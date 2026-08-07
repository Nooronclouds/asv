import os
import pytest
from fastapi.testclient import TestClient

# Ensure DATABASE_URL is set for tests
os.environ["DATABASE_URL"] = "sqlite:///./test_db.db"
os.environ["SECRET_KEY"] = "testsecretkey"
os.environ["ALLOWED_ORIGINS"] = "http://localhost:3000"

from app.main import app
from app.db.database import Base, engine

# Setup test database
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

client = TestClient(app)

def test_register_and_login():
    # 1. Test Register
    reg_response = client.post("/register", json={
        "email": "testuser@example.com",
        "password": "password123"
    })
    assert reg_response.status_code in (200, 400) # 400 if user exists from previous run

    # 2. Test Login
    login_response = client.post("/login", json={
        "email": "testuser@example.com",
        "password": "password123"
    })
    assert login_response.status_code == 200
    assert "access_token" in login_response.json()

def test_unauthorized_endpoints():
    url_res = client.post("/api/scan/url", json={"url": "http://example.com"})
    assert url_res.status_code in (401, 403)

def test_url_scan_input_validation():
    # Ensure test user is registered
    client.post("/register", json={
        "email": "valuser@example.com",
        "password": "password123"
    })
    login_res = client.post("/login", json={
        "email": "valuser@example.com",
        "password": "password123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Test invalid validation (empty string)
    bad_res = client.post("/api/scan/url", json={"url": ""}, headers=headers)
    assert bad_res.status_code == 422
