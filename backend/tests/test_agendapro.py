"""End-to-end backend tests for AgendaPro API"""
import os
import uuid
import requests
import pytest
from datetime import datetime, timedelta, timezone

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://agenda-pro-48.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"


def _future_date_weekday(target_dow: int) -> str:
    """Return a date string (YYYY-MM-DD) at least 2 days from today, matching weekday."""
    d = (datetime.now(timezone.utc) + timedelta(days=2)).date()
    # move to requested day_of_week (0=Mon..6=Sun)
    delta = (target_dow - d.weekday()) % 7
    d = d + timedelta(days=delta)
    return d.isoformat()


# ---------------------------------------------------------------------------
# Health + Auth
# ---------------------------------------------------------------------------
class TestHealth:
    def test_root(self):
        r = requests.get(f"{API}/")
        assert r.status_code == 200
        assert r.json().get("status") == "ok"


class TestAuth:
    def test_register_duplicate(self, customer_ctx):
        r = requests.post(f"{API}/auth/register", json={
            "email": customer_ctx["email"], "password": "whatever123",
            "name": "Dup", "role": "customer"
        })
        assert r.status_code == 400

    def test_login_success(self, customer_ctx):
        r = requests.post(f"{API}/auth/login", json={
            "email": customer_ctx["email"], "password": customer_ctx["password"]
        })
        assert r.status_code == 200
        body = r.json()
        assert "token" in body and body["user"]["email"].lower() == customer_ctx["email"].lower()
        assert body["user"]["role"] == "customer"

    def test_login_wrong_password(self, customer_ctx):
        r = requests.post(f"{API}/auth/login", json={
            "email": customer_ctx["email"], "password": "wrongpass"
        })
        assert r.status_code == 401

    def test_me_with_bearer(self, customer_headers, customer_ctx):
        r = requests.get(f"{API}/auth/me", headers=customer_headers)
        assert r.status_code == 200
        assert r.json()["email"].lower() == customer_ctx["email"].lower()
        # must not expose password_hash
        assert "password_hash" not in r.json()

    def test_me_unauthenticated(self):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code == 401


# ---------------------------------------------------------------------------
# Services
# ---------------------------------------------------------------------------
class TestServices:
    def test_customer_cannot_create_service(self, customer_headers):
        r = requests.post(f"{API}/services", headers=customer_headers, json={
            "name": "Test", "duration_minutes": 30, "price": 50, "category": "Beleza"
        })
        assert r.status_code == 403

    def test_provider_create_service(self, provider_headers, provider_ctx):
        payload = {
            "name": "TEST_Corte de Cabelo",
            "description": "Corte masculino completo",
            "duration_minutes": 30,
            "price": 50.0,
            "category": "Beleza",
        }
        r = requests.post(f"{API}/services", headers=provider_headers, json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["name"] == payload["name"]
        assert data["provider_id"] == provider_ctx["user"]["id"]
        assert data["provider_name"] == provider_ctx["user"]["name"]
        assert data["duration_minutes"] == 30
        assert data["avg_rating"] == 0.0
        pytest.service_id = data["id"]
        # GET verify persistence
        r2 = requests.get(f"{API}/services/{data['id']}")
        assert r2.status_code == 200
        assert r2.json()["id"] == data["id"]

    def test_list_services_filters(self, provider_ctx):
        # all
        r = requests.get(f"{API}/services")
        assert r.status_code == 200
        assert any(s["id"] == pytest.service_id for s in r.json())
        # category
        r2 = requests.get(f"{API}/services", params={"category": "Beleza"})
        assert all(s["category"] == "Beleza" for s in r2.json())
        # search
        r3 = requests.get(f"{API}/services", params={"search": "TEST_Corte"})
        assert any(s["id"] == pytest.service_id for s in r3.json())
        # provider_id filter
        r4 = requests.get(f"{API}/services", params={"provider_id": provider_ctx["user"]["id"]})
        assert all(s["provider_id"] == provider_ctx["user"]["id"] for s in r4.json())

    def test_update_service(self, provider_headers):
        r = requests.put(f"{API}/services/{pytest.service_id}", headers=provider_headers,
                         json={"price": 75.0})
        assert r.status_code == 200
        assert r.json()["price"] == 75.0
        # persisted
        r2 = requests.get(f"{API}/services/{pytest.service_id}")
        assert r2.json()["price"] == 75.0

    def test_update_service_non_owner(self, customer_headers, provider_headers):
        # create another provider
        email = f"TEST_otherp_{uuid.uuid4().hex[:6]}@agendapro.com"
        r0 = requests.post(f"{API}/auth/register", json={
            "email": email, "password": "SenhaForte123!", "name": "Other", "role": "provider"
        })
        token = r0.json()["token"]
        r = requests.put(f"{API}/services/{pytest.service_id}",
                         headers={"Authorization": f"Bearer {token}"}, json={"price": 5.0})
        assert r.status_code == 403


# ---------------------------------------------------------------------------
# Availability & Slots
# ---------------------------------------------------------------------------
class TestAvailabilityAndSlots:
    def test_set_availability(self, provider_headers, provider_ctx):
        # All weekdays (0-6) 09:00-12:00 so we always have a slot
        windows = [{"day_of_week": d, "start_time": "09:00", "end_time": "12:00"} for d in range(7)]
        r = requests.put(f"{API}/availability", headers=provider_headers, json={"windows": windows})
        assert r.status_code == 200
        assert len(r.json()) == 7
        # GET
        r2 = requests.get(f"{API}/providers/{provider_ctx['user']['id']}/availability")
        assert r2.status_code == 200
        assert len(r2.json()) == 7

    def test_customer_cannot_set_availability(self, customer_headers):
        r = requests.put(f"{API}/availability", headers=customer_headers, json={"windows": []})
        assert r.status_code == 403

    def test_get_slots_future(self, provider_ctx):
        # pick next Monday
        target_date = _future_date_weekday(0)
        r = requests.get(f"{API}/providers/{provider_ctx['user']['id']}/slots",
                         params={"service_id": pytest.service_id, "date": target_date})
        assert r.status_code == 200
        slots = r.json()["slots"]
        # 09:00 to 12:00 with 30-min step and 30-min duration → 09:00..11:30 → 6 slots
        assert len(slots) == 6
        assert "09:00" in slots and "11:30" in slots
        pytest.appt_date = target_date
        pytest.appt_time = "10:00"

    def test_get_slots_past_date(self, provider_ctx):
        past = (datetime.now(timezone.utc).date() - timedelta(days=3)).isoformat()
        r = requests.get(f"{API}/providers/{provider_ctx['user']['id']}/slots",
                         params={"service_id": pytest.service_id, "date": past})
        assert r.status_code == 200
        assert r.json()["slots"] == []

    def test_get_slots_invalid_date(self, provider_ctx):
        r = requests.get(f"{API}/providers/{provider_ctx['user']['id']}/slots",
                         params={"service_id": pytest.service_id, "date": "not-a-date"})
        assert r.status_code == 400


# ---------------------------------------------------------------------------
# Appointments
# ---------------------------------------------------------------------------
class TestAppointments:
    def test_provider_cannot_create_appointment(self, provider_headers):
        r = requests.post(f"{API}/appointments", headers=provider_headers, json={
            "service_id": pytest.service_id, "date": pytest.appt_date, "start_time": pytest.appt_time
        })
        assert r.status_code == 403

    def test_create_appointment(self, customer_headers, customer_ctx, provider_ctx):
        r = requests.post(f"{API}/appointments", headers=customer_headers, json={
            "service_id": pytest.service_id,
            "date": pytest.appt_date,
            "start_time": pytest.appt_time,
            "notes": "Favor confirmar"
        })
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["status"] == "pending"
        assert data["customer_id"] == customer_ctx["user"]["id"]
        assert data["provider_id"] == provider_ctx["user"]["id"]
        assert data["service_name"].startswith("TEST_Corte")
        assert data["customer_name"] == customer_ctx["user"]["name"]
        assert data["provider_name"] == provider_ctx["user"]["name"]
        assert data["end_time"] == "10:30"
        pytest.appt_id = data["id"]

    def test_slot_no_longer_available(self, customer_headers, provider_ctx):
        # Same slot should fail
        r = requests.post(f"{API}/appointments", headers=customer_headers, json={
            "service_id": pytest.service_id, "date": pytest.appt_date, "start_time": pytest.appt_time
        })
        assert r.status_code == 400

        # Slots should exclude the booked one now
        r2 = requests.get(f"{API}/providers/{provider_ctx['user']['id']}/slots",
                          params={"service_id": pytest.service_id, "date": pytest.appt_date})
        assert pytest.appt_time not in r2.json()["slots"]

    def test_list_customer_appointments(self, customer_headers):
        r = requests.get(f"{API}/appointments/customer", headers=customer_headers)
        assert r.status_code == 200
        assert any(a["id"] == pytest.appt_id for a in r.json())

    def test_list_provider_appointments(self, provider_headers):
        r = requests.get(f"{API}/appointments/provider", headers=provider_headers)
        assert r.status_code == 200
        assert any(a["id"] == pytest.appt_id for a in r.json())

    def test_customer_cannot_confirm(self, customer_headers):
        r = requests.put(f"{API}/appointments/{pytest.appt_id}/confirm", headers=customer_headers)
        assert r.status_code == 403

    def test_provider_confirm(self, provider_headers):
        r = requests.put(f"{API}/appointments/{pytest.appt_id}/confirm", headers=provider_headers)
        assert r.status_code == 200
        assert r.json()["status"] == "confirmed"

    def test_reschedule(self, customer_headers, provider_ctx):
        # pick a different time same date
        r = requests.put(f"{API}/appointments/{pytest.appt_id}/reschedule",
                         headers=customer_headers,
                         json={"date": pytest.appt_date, "start_time": "11:00"})
        assert r.status_code == 200, r.text
        assert r.json()["start_time"] == "11:00"
        assert r.json()["end_time"] == "11:30"
        assert r.json()["status"] == "pending"

    def test_reschedule_unavailable(self, customer_headers):
        # A date without availability (pick past-weekday but future)
        # Use a time outside window
        r = requests.put(f"{API}/appointments/{pytest.appt_id}/reschedule",
                         headers=customer_headers,
                         json={"date": pytest.appt_date, "start_time": "14:00"})
        assert r.status_code == 400

    def test_stranger_cannot_cancel(self):
        email = f"TEST_str_{uuid.uuid4().hex[:6]}@agendapro.com"
        r0 = requests.post(f"{API}/auth/register", json={
            "email": email, "password": "SenhaForte123!", "name": "Stranger", "role": "customer"
        })
        token = r0.json()["token"]
        r = requests.put(f"{API}/appointments/{pytest.appt_id}/cancel",
                         headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 403

    def test_complete_appointment(self, provider_headers):
        r = requests.put(f"{API}/appointments/{pytest.appt_id}/complete", headers=provider_headers)
        assert r.status_code == 200, r.text
        assert r.json()["status"] == "completed"

    def test_cancel_after_completed_fails(self, customer_headers):
        r = requests.put(f"{API}/appointments/{pytest.appt_id}/cancel", headers=customer_headers)
        assert r.status_code == 400


# ---------------------------------------------------------------------------
# Reviews
# ---------------------------------------------------------------------------
class TestReviews:
    def test_create_review(self, customer_headers):
        r = requests.post(f"{API}/reviews", headers=customer_headers, json={
            "appointment_id": pytest.appt_id, "rating": 5, "comment": "Excelente!"
        })
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["rating"] == 5
        pytest.review_id = body["id"]

    def test_one_review_per_appointment(self, customer_headers):
        r = requests.post(f"{API}/reviews", headers=customer_headers, json={
            "appointment_id": pytest.appt_id, "rating": 4, "comment": "dup"
        })
        assert r.status_code == 400

    def test_provider_cannot_review(self, provider_headers):
        r = requests.post(f"{API}/reviews", headers=provider_headers, json={
            "appointment_id": pytest.appt_id, "rating": 5
        })
        assert r.status_code == 403

    def test_list_provider_reviews(self, provider_ctx):
        r = requests.get(f"{API}/providers/{provider_ctx['user']['id']}/reviews")
        assert r.status_code == 200
        assert any(x["id"] == pytest.review_id for x in r.json())

    def test_list_service_reviews(self):
        r = requests.get(f"{API}/services/{pytest.service_id}/reviews")
        assert r.status_code == 200
        assert any(x["id"] == pytest.review_id for x in r.json())

    def test_service_rating_updated(self):
        r = requests.get(f"{API}/services/{pytest.service_id}")
        assert r.json()["avg_rating"] == 5.0
        assert r.json()["review_count"] == 1


# ---------------------------------------------------------------------------
# Stats
# ---------------------------------------------------------------------------
class TestStats:
    def test_provider_stats(self, provider_headers):
        r = requests.get(f"{API}/stats/provider", headers=provider_headers)
        assert r.status_code == 200, r.text
        data = r.json()
        # After completing 1 appointment at 75.0
        assert data["completed_appointments"] >= 1
        assert data["revenue"] >= 75.0
        assert data["avg_rating"] == 5.0
        assert data["review_count"] >= 1
        assert data["services_count"] >= 1

    def test_customer_cannot_get_stats(self, customer_headers):
        r = requests.get(f"{API}/stats/provider", headers=customer_headers)
        assert r.status_code == 403


# ---------------------------------------------------------------------------
# Service deletion (last to avoid breaking others)
# ---------------------------------------------------------------------------
class TestZServiceDeletion:
    def test_delete_service(self, provider_headers):
        r = requests.delete(f"{API}/services/{pytest.service_id}", headers=provider_headers)
        assert r.status_code == 200
        r2 = requests.get(f"{API}/services/{pytest.service_id}")
        assert r2.status_code == 404
