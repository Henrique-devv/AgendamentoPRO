"""
AgendaPro - Sistema de Agendamentos
FastAPI backend with MongoDB, JWT auth, SendGrid email notifications
"""
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import uuid
import bcrypt
import jwt as pyjwt
import logging
from datetime import datetime, timezone, timedelta, date as date_cls, time as time_cls
from typing import List, Optional, Literal
from contextlib import asynccontextmanager

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, ConfigDict

# SendGrid
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("agendapro")

JWT_SECRET = os.environ.get("JWT_SECRET", "dev-secret-change-me")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXP_MINUTES = 60 * 24 * 7  # 7 days
APP_NAME = os.environ.get("APP_NAME", "AgendaPro")
SENDGRID_API_KEY = os.environ.get("SENDGRID_API_KEY", "")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "noreply@agendapro.com")

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]


# ---------------------------------------------------------------------------
# Lifespan: indexes + admin seed
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await db.users.create_index("email", unique=True)
        await db.services.create_index("provider_id")
        await db.appointments.create_index([("customer_id", 1), ("date", 1)])
        await db.appointments.create_index([("provider_id", 1), ("date", 1)])
        await db.reviews.create_index("provider_id")
        logger.info("MongoDB indexes ready")
    except Exception as e:
        logger.warning(f"Index creation issue: {e}")
    yield
    client.close()


app = FastAPI(title="AgendaPro API", lifespan=lifespan)
api_router = APIRouter(prefix="/api")


# ---------------------------------------------------------------------------
# Security helpers
# ---------------------------------------------------------------------------
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXP_MINUTES),
        "type": "access",
    }
    return pyjwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Não autenticado")
    try:
        payload = pyjwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Token inválido")
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
        if not user:
            raise HTTPException(status_code=401, detail="Usuário não encontrado")
        return user
    except pyjwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except pyjwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")


def require_role(role: str):
    async def checker(user: dict = Depends(get_current_user)) -> dict:
        if user.get("role") != role:
            raise HTTPException(status_code=403, detail=f"Acesso restrito para {role}")
        return user
    return checker


# ---------------------------------------------------------------------------
# Email helpers
# ---------------------------------------------------------------------------
def send_email(to: str, subject: str, html: str) -> bool:
    if not SENDGRID_API_KEY or not SENDGRID_API_KEY.startswith("SG."):
        logger.info(f"[EMAIL MOCK] To={to} | Subject={subject}")
        return False
    try:
        message = Mail(
            from_email=SENDER_EMAIL,
            to_emails=to,
            subject=subject,
            html_content=html,
        )
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = sg.send(message)
        logger.info(f"Email sent to {to} status={response.status_code}")
        return response.status_code in (200, 201, 202)
    except Exception as e:
        logger.error(f"SendGrid error sending to {to}: {e}")
        return False


def email_template(title: str, body: str, cta_label: Optional[str] = None, cta_url: Optional[str] = None) -> str:
    cta_html = ""
    if cta_label and cta_url:
        cta_html = f'<a href="{cta_url}" style="display:inline-block;padding:14px 28px;background:#4338CA;color:#fff;text-decoration:none;border-radius:12px;font-weight:600;margin-top:16px;">{cta_label}</a>'
    return f"""
    <div style="font-family:Manrope,Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#F8FAFC;border-radius:16px;color:#0F172A;">
        <div style="background:#fff;padding:32px;border-radius:16px;border:1px solid #E2E8F0;">
            <div style="font-size:12px;letter-spacing:0.2em;color:#64748B;text-transform:uppercase;font-weight:700;">{APP_NAME}</div>
            <h1 style="margin:8px 0 16px;font-size:24px;color:#0F172A;font-weight:700;">{title}</h1>
            <div style="font-size:15px;line-height:1.6;color:#334155;">{body}</div>
            {cta_html}
            <hr style="border:none;border-top:1px solid #E2E8F0;margin:24px 0;">
            <p style="font-size:12px;color:#94A3B8;margin:0;">Você está recebendo este e-mail porque tem uma conta no {APP_NAME}.</p>
        </div>
    </div>
    """


def fmt_date(d: str) -> str:
    try:
        return datetime.strptime(d, "%Y-%m-%d").strftime("%d/%m/%Y")
    except Exception:
        return d


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------
class UserPublic(BaseModel):
    id: str
    email: EmailStr
    name: str
    role: Literal["customer", "provider"]
    phone: Optional[str] = None
    bio: Optional[str] = None
    created_at: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str = Field(min_length=2)
    role: Literal["customer", "provider"]
    phone: Optional[str] = None
    bio: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ServiceCreate(BaseModel):
    name: str = Field(min_length=2)
    description: str = ""
    duration_minutes: int = Field(ge=15, le=480)
    price: float = Field(ge=0)
    category: str = "Geral"
    active: bool = True


class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    duration_minutes: Optional[int] = None
    price: Optional[float] = None
    category: Optional[str] = None
    active: Optional[bool] = None


class Service(BaseModel):
    id: str
    provider_id: str
    provider_name: str
    name: str
    description: str
    duration_minutes: int
    price: float
    category: str
    active: bool
    avg_rating: float = 0.0
    review_count: int = 0
    created_at: str


class AvailabilityWindow(BaseModel):
    day_of_week: int = Field(ge=0, le=6)  # 0 = Mon ... 6 = Sun
    start_time: str  # "HH:MM"
    end_time: str  # "HH:MM"


class AvailabilityBulk(BaseModel):
    windows: List[AvailabilityWindow]


class AppointmentCreate(BaseModel):
    service_id: str
    date: str  # YYYY-MM-DD
    start_time: str  # HH:MM
    notes: Optional[str] = ""


class AppointmentReschedule(BaseModel):
    date: str
    start_time: str


class ReviewCreate(BaseModel):
    appointment_id: str
    rating: int = Field(ge=1, le=5)
    comment: str = ""


# ---------------------------------------------------------------------------
# Auth endpoints
# ---------------------------------------------------------------------------
def _set_auth_cookie(response: Response, token: str):
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=ACCESS_TOKEN_EXP_MINUTES * 60,
        path="/",
    )


@api_router.post("/auth/register")
async def register(payload: RegisterRequest, response: Response):
    email = payload.email.lower().strip()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="E-mail já cadastrado")
    user_id = str(uuid.uuid4())
    doc = {
        "id": user_id,
        "email": email,
        "password_hash": hash_password(payload.password),
        "name": payload.name.strip(),
        "role": payload.role,
        "phone": payload.phone,
        "bio": payload.bio,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(doc)
    token = create_access_token(user_id, email, payload.role)
    _set_auth_cookie(response, token)
    doc.pop("_id", None)
    user_public = {k: v for k, v in doc.items() if k != "password_hash"}
    return {"user": user_public, "token": token}


@api_router.post("/auth/login")
async def login(payload: LoginRequest, response: Response):
    email = payload.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="E-mail ou senha incorretos")
    token = create_access_token(user["id"], user["email"], user["role"])
    _set_auth_cookie(response, token)
    user.pop("_id", None)
    user.pop("password_hash", None)
    return {"user": user, "token": token}


@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"ok": True}


@api_router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user


# ---------------------------------------------------------------------------
# Services endpoints
# ---------------------------------------------------------------------------
async def _attach_rating(service: dict) -> dict:
    pipeline = [
        {"$match": {"service_id": service["id"]}},
        {"$group": {"_id": None, "avg": {"$avg": "$rating"}, "count": {"$sum": 1}}},
    ]
    res = await db.reviews.aggregate(pipeline).to_list(1)
    if res:
        service["avg_rating"] = round(float(res[0]["avg"]), 1)
        service["review_count"] = int(res[0]["count"])
    else:
        service["avg_rating"] = 0.0
        service["review_count"] = 0
    return service


@api_router.get("/services")
async def list_services(category: Optional[str] = None, search: Optional[str] = None, provider_id: Optional[str] = None):
    query = {"active": True}
    if category and category != "all":
        query["category"] = category
    if provider_id:
        query["provider_id"] = provider_id
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
        ]
    services = await db.services.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    for s in services:
        await _attach_rating(s)
    return services


@api_router.get("/services/{service_id}")
async def get_service(service_id: str):
    s = await db.services.find_one({"id": service_id}, {"_id": 0})
    if not s:
        raise HTTPException(status_code=404, detail="Serviço não encontrado")
    await _attach_rating(s)
    return s


@api_router.post("/services")
async def create_service(payload: ServiceCreate, user: dict = Depends(require_role("provider"))):
    sid = str(uuid.uuid4())
    doc = {
        "id": sid,
        "provider_id": user["id"],
        "provider_name": user["name"],
        "name": payload.name,
        "description": payload.description,
        "duration_minutes": payload.duration_minutes,
        "price": payload.price,
        "category": payload.category,
        "active": payload.active,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.services.insert_one(doc)
    doc.pop("_id", None)
    doc["avg_rating"] = 0.0
    doc["review_count"] = 0
    return doc


@api_router.put("/services/{service_id}")
async def update_service(service_id: str, payload: ServiceUpdate, user: dict = Depends(require_role("provider"))):
    s = await db.services.find_one({"id": service_id})
    if not s:
        raise HTTPException(status_code=404, detail="Serviço não encontrado")
    if s["provider_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Sem permissão")
    update = {k: v for k, v in payload.model_dump().items() if v is not None}
    if update:
        await db.services.update_one({"id": service_id}, {"$set": update})
    new_s = await db.services.find_one({"id": service_id}, {"_id": 0})
    await _attach_rating(new_s)
    return new_s


@api_router.delete("/services/{service_id}")
async def delete_service(service_id: str, user: dict = Depends(require_role("provider"))):
    s = await db.services.find_one({"id": service_id})
    if not s:
        raise HTTPException(status_code=404, detail="Serviço não encontrado")
    if s["provider_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Sem permissão")
    await db.services.delete_one({"id": service_id})
    return {"ok": True}


@api_router.get("/providers")
async def list_providers():
    providers = await db.users.find({"role": "provider"}, {"_id": 0, "password_hash": 0}).to_list(500)
    return providers


@api_router.get("/providers/{provider_id}")
async def get_provider(provider_id: str):
    p = await db.users.find_one({"id": provider_id, "role": "provider"}, {"_id": 0, "password_hash": 0})
    if not p:
        raise HTTPException(status_code=404, detail="Prestador não encontrado")
    return p


# ---------------------------------------------------------------------------
# Availability endpoints
# ---------------------------------------------------------------------------
@api_router.get("/providers/{provider_id}/availability")
async def get_availability(provider_id: str):
    docs = await db.availability.find({"provider_id": provider_id}, {"_id": 0}).to_list(20)
    return docs


@api_router.put("/availability")
async def set_availability(payload: AvailabilityBulk, user: dict = Depends(require_role("provider"))):
    await db.availability.delete_many({"provider_id": user["id"]})
    if payload.windows:
        docs = []
        for w in payload.windows:
            docs.append({
                "id": str(uuid.uuid4()),
                "provider_id": user["id"],
                "day_of_week": w.day_of_week,
                "start_time": w.start_time,
                "end_time": w.end_time,
            })
        await db.availability.insert_many(docs)
    out = await db.availability.find({"provider_id": user["id"]}, {"_id": 0}).to_list(50)
    return out


def _time_to_minutes(t: str) -> int:
    h, m = t.split(":")
    return int(h) * 60 + int(m)


def _minutes_to_time(m: int) -> str:
    return f"{m // 60:02d}:{m % 60:02d}"


@api_router.get("/providers/{provider_id}/slots")
async def get_slots(provider_id: str, service_id: str = Query(...), date: str = Query(...)):
    service = await db.services.find_one({"id": service_id}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Serviço não encontrado")
    duration = int(service["duration_minutes"])

    try:
        target_date = datetime.strptime(date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Data inválida (use YYYY-MM-DD)")

    # Reject past dates
    today = datetime.now(timezone.utc).date()
    if target_date < today:
        return {"slots": []}

    dow = target_date.weekday()  # 0=Mon..6=Sun
    windows = await db.availability.find({"provider_id": provider_id, "day_of_week": dow}, {"_id": 0}).to_list(20)
    if not windows:
        return {"slots": []}

    # Get existing appointments for that date that aren't cancelled
    existing = await db.appointments.find({
        "provider_id": provider_id,
        "date": date,
        "status": {"$in": ["pending", "confirmed"]},
    }, {"_id": 0}).to_list(500)
    busy = []
    for a in existing:
        s = _time_to_minutes(a["start_time"])
        e = _time_to_minutes(a["end_time"])
        busy.append((s, e))

    slots = []
    step = 30  # 30-min granularity
    for w in windows:
        ws = _time_to_minutes(w["start_time"])
        we = _time_to_minutes(w["end_time"])
        cursor = ws
        while cursor + duration <= we:
            slot_start = cursor
            slot_end = cursor + duration
            conflict = any(not (slot_end <= b[0] or slot_start >= b[1]) for b in busy)
            if not conflict:
                # filter past slots if today
                if target_date == today:
                    now = datetime.now()
                    now_min = now.hour * 60 + now.minute
                    if slot_start <= now_min:
                        cursor += step
                        continue
                slots.append(_minutes_to_time(slot_start))
            cursor += step
    return {"slots": sorted(set(slots))}


# ---------------------------------------------------------------------------
# Appointments endpoints
# ---------------------------------------------------------------------------
async def _enrich_appointment(a: dict) -> dict:
    customer = await db.users.find_one({"id": a["customer_id"]}, {"_id": 0, "password_hash": 0})
    provider = await db.users.find_one({"id": a["provider_id"]}, {"_id": 0, "password_hash": 0})
    service = await db.services.find_one({"id": a["service_id"]}, {"_id": 0})
    a["customer_name"] = customer["name"] if customer else "Cliente"
    a["customer_email"] = customer["email"] if customer else ""
    a["provider_name"] = provider["name"] if provider else "Prestador"
    a["provider_email"] = provider["email"] if provider else ""
    a["service_name"] = service["name"] if service else "Serviço"
    a["service_price"] = service["price"] if service else 0
    a["service_duration"] = service["duration_minutes"] if service else 0
    return a


@api_router.post("/appointments")
async def create_appointment(payload: AppointmentCreate, background: BackgroundTasks, user: dict = Depends(require_role("customer"))):
    service = await db.services.find_one({"id": payload.service_id}, {"_id": 0})
    if not service or not service.get("active"):
        raise HTTPException(status_code=404, detail="Serviço indisponível")

    # Validate slot still available
    slots_resp = await get_slots(provider_id=service["provider_id"], service_id=service["id"], date=payload.date)
    if payload.start_time not in slots_resp["slots"]:
        raise HTTPException(status_code=400, detail="Horário não está mais disponível")

    duration = int(service["duration_minutes"])
    end_time = _minutes_to_time(_time_to_minutes(payload.start_time) + duration)
    aid = str(uuid.uuid4())
    doc = {
        "id": aid,
        "customer_id": user["id"],
        "provider_id": service["provider_id"],
        "service_id": service["id"],
        "date": payload.date,
        "start_time": payload.start_time,
        "end_time": end_time,
        "status": "pending",
        "notes": payload.notes or "",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.appointments.insert_one(doc)
    doc.pop("_id", None)
    enriched = await _enrich_appointment(doc.copy())

    # Notifications
    body_customer = (
        f"Olá <strong>{enriched['customer_name']}</strong>,<br><br>"
        f"Seu agendamento foi criado com sucesso e está aguardando confirmação do prestador.<br><br>"
        f"<strong>Serviço:</strong> {enriched['service_name']}<br>"
        f"<strong>Profissional:</strong> {enriched['provider_name']}<br>"
        f"<strong>Data:</strong> {fmt_date(payload.date)}<br>"
        f"<strong>Horário:</strong> {payload.start_time} às {end_time}<br>"
        f"<strong>Valor:</strong> R$ {enriched['service_price']:.2f}"
    )
    body_provider = (
        f"Olá <strong>{enriched['provider_name']}</strong>,<br><br>"
        f"Você recebeu um novo agendamento.<br><br>"
        f"<strong>Cliente:</strong> {enriched['customer_name']} ({enriched['customer_email']})<br>"
        f"<strong>Serviço:</strong> {enriched['service_name']}<br>"
        f"<strong>Data:</strong> {fmt_date(payload.date)}<br>"
        f"<strong>Horário:</strong> {payload.start_time} às {end_time}"
    )
    background.add_task(send_email, enriched["customer_email"], f"✓ Agendamento criado - {enriched['service_name']}", email_template("Agendamento criado", body_customer))
    background.add_task(send_email, enriched["provider_email"], f"Novo agendamento: {enriched['customer_name']}", email_template("Novo agendamento recebido", body_provider))

    return enriched


@api_router.get("/appointments/customer")
async def my_customer_appointments(user: dict = Depends(get_current_user)):
    if user["role"] != "customer":
        raise HTTPException(status_code=403, detail="Apenas clientes")
    docs = await db.appointments.find({"customer_id": user["id"]}, {"_id": 0}).sort([("date", -1), ("start_time", -1)]).to_list(500)
    out = []
    for d in docs:
        out.append(await _enrich_appointment(d))
    return out


@api_router.get("/appointments/provider")
async def my_provider_appointments(user: dict = Depends(get_current_user)):
    if user["role"] != "provider":
        raise HTTPException(status_code=403, detail="Apenas prestadores")
    docs = await db.appointments.find({"provider_id": user["id"]}, {"_id": 0}).sort([("date", -1), ("start_time", -1)]).to_list(500)
    out = []
    for d in docs:
        out.append(await _enrich_appointment(d))
    return out


@api_router.put("/appointments/{appointment_id}/cancel")
async def cancel_appointment(appointment_id: str, background: BackgroundTasks, user: dict = Depends(get_current_user)):
    a = await db.appointments.find_one({"id": appointment_id}, {"_id": 0})
    if not a:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado")
    if user["id"] not in (a["customer_id"], a["provider_id"]):
        raise HTTPException(status_code=403, detail="Sem permissão")
    if a["status"] in ("cancelled", "completed"):
        raise HTTPException(status_code=400, detail=f"Agendamento já está {a['status']}")
    await db.appointments.update_one({"id": appointment_id}, {"$set": {"status": "cancelled", "cancelled_by": user["role"], "cancelled_at": datetime.now(timezone.utc).isoformat()}})
    a["status"] = "cancelled"
    enriched = await _enrich_appointment(a)
    body_other = (
        f"O agendamento abaixo foi <strong>cancelado</strong> por {user['name']}.<br><br>"
        f"<strong>Serviço:</strong> {enriched['service_name']}<br>"
        f"<strong>Data:</strong> {fmt_date(a['date'])} às {a['start_time']}"
    )
    target_email = enriched["provider_email"] if user["role"] == "customer" else enriched["customer_email"]
    background.add_task(send_email, target_email, "Agendamento cancelado", email_template("Agendamento cancelado", body_other))
    return enriched


@api_router.put("/appointments/{appointment_id}/reschedule")
async def reschedule_appointment(appointment_id: str, payload: AppointmentReschedule, background: BackgroundTasks, user: dict = Depends(get_current_user)):
    a = await db.appointments.find_one({"id": appointment_id}, {"_id": 0})
    if not a:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado")
    if user["id"] not in (a["customer_id"], a["provider_id"]):
        raise HTTPException(status_code=403, detail="Sem permissão")
    if a["status"] in ("cancelled", "completed"):
        raise HTTPException(status_code=400, detail=f"Agendamento já está {a['status']}")
    service = await db.services.find_one({"id": a["service_id"]}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Serviço não encontrado")
    duration = int(service["duration_minutes"])
    # Free current slot before checking availability
    await db.appointments.update_one({"id": appointment_id}, {"$set": {"status": "rescheduling"}})
    slots_resp = await get_slots(provider_id=a["provider_id"], service_id=service["id"], date=payload.date)
    if payload.start_time not in slots_resp["slots"]:
        # Restore status
        await db.appointments.update_one({"id": appointment_id}, {"$set": {"status": a["status"]}})
        raise HTTPException(status_code=400, detail="Horário não disponível")
    new_end = _minutes_to_time(_time_to_minutes(payload.start_time) + duration)
    await db.appointments.update_one({"id": appointment_id}, {"$set": {
        "date": payload.date,
        "start_time": payload.start_time,
        "end_time": new_end,
        "status": "pending",
        "rescheduled_at": datetime.now(timezone.utc).isoformat(),
    }})
    a.update({"date": payload.date, "start_time": payload.start_time, "end_time": new_end, "status": "pending"})
    enriched = await _enrich_appointment(a)
    body = (
        f"Seu agendamento foi <strong>reagendado</strong>.<br><br>"
        f"<strong>Serviço:</strong> {enriched['service_name']}<br>"
        f"<strong>Nova data:</strong> {fmt_date(payload.date)} às {payload.start_time}"
    )
    background.add_task(send_email, enriched["customer_email"], "Agendamento reagendado", email_template("Agendamento reagendado", body))
    background.add_task(send_email, enriched["provider_email"], "Agendamento reagendado", email_template("Agendamento reagendado", body))
    return enriched


@api_router.put("/appointments/{appointment_id}/confirm")
async def confirm_appointment(appointment_id: str, background: BackgroundTasks, user: dict = Depends(require_role("provider"))):
    a = await db.appointments.find_one({"id": appointment_id}, {"_id": 0})
    if not a:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado")
    if a["provider_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Sem permissão")
    if a["status"] != "pending":
        raise HTTPException(status_code=400, detail=f"Status atual: {a['status']}")
    await db.appointments.update_one({"id": appointment_id}, {"$set": {"status": "confirmed"}})
    a["status"] = "confirmed"
    enriched = await _enrich_appointment(a)
    body = (
        f"Boas notícias! Seu agendamento foi <strong>confirmado</strong> por {enriched['provider_name']}.<br><br>"
        f"<strong>Serviço:</strong> {enriched['service_name']}<br>"
        f"<strong>Data:</strong> {fmt_date(a['date'])} às {a['start_time']}"
    )
    background.add_task(send_email, enriched["customer_email"], "✓ Agendamento confirmado", email_template("Agendamento confirmado", body))
    return enriched


@api_router.put("/appointments/{appointment_id}/complete")
async def complete_appointment(appointment_id: str, user: dict = Depends(require_role("provider"))):
    a = await db.appointments.find_one({"id": appointment_id}, {"_id": 0})
    if not a:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado")
    if a["provider_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Sem permissão")
    if a["status"] not in ("pending", "confirmed"):
        raise HTTPException(status_code=400, detail=f"Status atual: {a['status']}")
    await db.appointments.update_one({"id": appointment_id}, {"$set": {"status": "completed"}})
    a["status"] = "completed"
    return await _enrich_appointment(a)


# ---------------------------------------------------------------------------
# Reviews
# ---------------------------------------------------------------------------
@api_router.post("/reviews")
async def create_review(payload: ReviewCreate, user: dict = Depends(require_role("customer"))):
    a = await db.appointments.find_one({"id": payload.appointment_id}, {"_id": 0})
    if not a:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado")
    if a["customer_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Sem permissão")
    if a["status"] != "completed":
        raise HTTPException(status_code=400, detail="Só é possível avaliar agendamentos concluídos")
    existing = await db.reviews.find_one({"appointment_id": payload.appointment_id})
    if existing:
        raise HTTPException(status_code=400, detail="Você já avaliou este agendamento")
    rid = str(uuid.uuid4())
    doc = {
        "id": rid,
        "appointment_id": payload.appointment_id,
        "customer_id": user["id"],
        "customer_name": user["name"],
        "provider_id": a["provider_id"],
        "service_id": a["service_id"],
        "rating": payload.rating,
        "comment": payload.comment,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.reviews.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.get("/providers/{provider_id}/reviews")
async def get_provider_reviews(provider_id: str):
    docs = await db.reviews.find({"provider_id": provider_id}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return docs


@api_router.get("/services/{service_id}/reviews")
async def get_service_reviews(service_id: str):
    docs = await db.reviews.find({"service_id": service_id}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return docs


# ---------------------------------------------------------------------------
# Stats endpoint for provider dashboard
# ---------------------------------------------------------------------------
@api_router.get("/stats/provider")
async def provider_stats(user: dict = Depends(require_role("provider"))):
    today = datetime.now(timezone.utc).date().isoformat()
    today_count = await db.appointments.count_documents({"provider_id": user["id"], "date": today, "status": {"$in": ["pending", "confirmed"]}})
    pending_count = await db.appointments.count_documents({"provider_id": user["id"], "status": "pending"})
    completed_count = await db.appointments.count_documents({"provider_id": user["id"], "status": "completed"})
    services_count = await db.services.count_documents({"provider_id": user["id"]})

    # Revenue (sum of completed appointments' service prices)
    pipeline = [
        {"$match": {"provider_id": user["id"], "status": "completed"}},
        {"$lookup": {"from": "services", "localField": "service_id", "foreignField": "id", "as": "svc"}},
        {"$unwind": "$svc"},
        {"$group": {"_id": None, "total": {"$sum": "$svc.price"}}},
    ]
    rev = await db.appointments.aggregate(pipeline).to_list(1)
    revenue = float(rev[0]["total"]) if rev else 0.0

    # Rating
    rate = await db.reviews.aggregate([
        {"$match": {"provider_id": user["id"]}},
        {"$group": {"_id": None, "avg": {"$avg": "$rating"}, "count": {"$sum": 1}}}
    ]).to_list(1)
    avg_rating = round(float(rate[0]["avg"]), 1) if rate else 0.0
    review_count = int(rate[0]["count"]) if rate else 0

    return {
        "today_appointments": today_count,
        "pending_appointments": pending_count,
        "completed_appointments": completed_count,
        "services_count": services_count,
        "revenue": revenue,
        "avg_rating": avg_rating,
        "review_count": review_count,
    }


@api_router.get("/")
async def root():
    return {"app": APP_NAME, "status": "ok"}


# Include router and CORS
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)
