import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://agenda-pro-48.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"

CUSTOMER_EMAIL_TEMPLATE = "TEST_customer_{uid}@agendapro.com"
PROVIDER_EMAIL_TEMPLATE = "TEST_provider_{uid}@agendapro.com"
PASSWORD = "SenhaForte123!"


def _register(email, password, name, role, phone=None, bio=None):
    return requests.post(f"{API}/auth/register", json={
        "email": email, "password": password, "name": name, "role": role,
        "phone": phone, "bio": bio
    })


@pytest.fixture(scope="session")
def customer_ctx():
    uid = uuid.uuid4().hex[:8]
    email = CUSTOMER_EMAIL_TEMPLATE.format(uid=uid)
    r = _register(email, PASSWORD, "Cliente Teste", "customer", "+5511999990000")
    assert r.status_code == 200, f"register customer: {r.status_code} {r.text}"
    body = r.json()
    return {"email": email, "password": PASSWORD, "token": body["token"], "user": body["user"]}


@pytest.fixture(scope="session")
def provider_ctx():
    uid = uuid.uuid4().hex[:8]
    email = PROVIDER_EMAIL_TEMPLATE.format(uid=uid)
    r = _register(email, PASSWORD, "Prestador Teste", "provider", "+5511988880000", bio="Especialista")
    assert r.status_code == 200, f"register provider: {r.status_code} {r.text}"
    body = r.json()
    return {"email": email, "password": PASSWORD, "token": body["token"], "user": body["user"]}


@pytest.fixture
def provider_headers(provider_ctx):
    return {"Authorization": f"Bearer {provider_ctx['token']}"}


@pytest.fixture
def customer_headers(customer_ctx):
    return {"Authorization": f"Bearer {customer_ctx['token']}"}
