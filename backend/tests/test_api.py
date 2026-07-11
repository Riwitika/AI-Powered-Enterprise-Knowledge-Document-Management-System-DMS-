import os
import io
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Set environment variable to make sure tests run correctly
os.environ["SECRET_KEY"] = "testsecretkeyforrunningtests"
os.environ["DATABASE_URL"] = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/kms")

from app.main import app
from app.core.deps import get_db
from app.db.session import Base
from app.models.models import User, Role, Department, Document, Permission
from app.core.security import get_password_hash

client = TestClient(app)

# Create a test database session
engine = create_engine(os.environ["DATABASE_URL"])
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="module")
def db_session():
    # Make sure tables exist
    if engine.url.drivername.startswith("postgresql"):
        from sqlalchemy import text
        with engine.begin() as conn:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    
    # Seed roles if they don't exist
    for r_name in ["super_admin", "admin", "employee", "guest"]:
        role = db.query(Role).filter(Role.name == r_name).first()
        if not role:
            db.add(Role(name=r_name))
            
    # Seed a default department
    dept = db.query(Department).filter(Department.name == "Test Dept").first()
    if not dept:
        db.add(Department(name="Test Dept"))
        
    db.commit()
    yield db
    db.close()


def test_auth_flow(db_session):
    email = "tester@efasttrade.com"
    password = "testpassword123"
    
    # 1. Clean up existing test user
    db_session.query(User).filter(User.email == email).delete()
    db_session.commit()
    
    # 2. Register
    reg_data = {
        "email": email,
        "password": password,
        "full_name": "Test User",
        "role_name": "employee",
        "invite_code": "FASTTRADE-SECURE-2026"
    }
    response = client.post("/api/v1/auth/register", json=reg_data)
    assert response.status_code == 200
    assert response.json()["email"] == email
    
    # 3. Login
    login_data = {
        "username": email,
        "password": password
    }
    response = client.post("/api/v1/auth/login", data=login_data)
    assert response.status_code == 200
    tokens = response.json()
    assert "access_token" in tokens
    assert "refresh_token" in tokens
    
    # 4. Get Me
    access_token = tokens["access_token"]
    headers = {"Authorization": f"Bearer {access_token}"}
    response = client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == 200
    assert response.json()["email"] == email


def test_document_crud_and_permissions(db_session):
    # 1. Setup two test users (User A - Owner, User B - Guest)
    email_a = "usera@test.com"
    email_b = "userb@test.com"
    
    # Clean up existing
    db_session.query(User).filter(User.email.in_([email_a, email_b])).delete()
    db_session.commit()
    
    role_emp = db_session.query(Role).filter(Role.name == "employee").first()
    
    user_a = User(
        email=email_a,
        full_name="User A",
        password_hash=get_password_hash("password"),
        role_id=role_emp.id if role_emp else None,
        is_active=True
    )
    user_b = User(
        email=email_b,
        full_name="User B",
        password_hash=get_password_hash("password"),
        role_id=role_emp.id if role_emp else None,
        is_active=True
    )
    db_session.add_all([user_a, user_b])
    db_session.commit()
    db_session.refresh(user_a)
    db_session.refresh(user_b)

    # Log in both users
    token_a = client.post("/api/v1/auth/login", data={"username": email_a, "password": "password"}).json()["access_token"]
    token_b = client.post("/api/v1/auth/login", data={"username": email_b, "password": "password"}).json()["access_token"]
    
    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # 2. User A uploads a private document
    file_content = b"This is a secret document containing proprietary codes and information."
    file_tuple = ("secret.txt", io.BytesIO(file_content), "text/plain")
    
    upload_data = {
        "name": "Secret Doc",
        "description": "User A Private SOP",
        "category": "SOP",
        "access_level": "private"
    }
    
    response = client.post(
        "/api/v1/documents/upload",
        headers=headers_a,
        data=upload_data,
        files={"file": file_tuple}
    )
    assert response.status_code == 201
    doc = response.json()
    doc_id = doc["id"]
    assert doc["name"] == "Secret Doc"
    assert doc["access_level"] == "private"

    # 3. User B tries to view it (expect 403 Forbidden)
    response = client.get(f"/api/v1/documents/{doc_id}", headers=headers_b)
    assert response.status_code == 403

    # 4. User A grants permission to User B
    grant_payload = {
        "user_id": str(user_b.id),
        "access_type": "view"
    }
    response = client.post(f"/api/v1/permissions/{doc_id}/grant", headers=headers_a, json=grant_payload)
    assert response.status_code == 201

    # 5. User B tries to view it again (expect 200 Success now)
    response = client.get(f"/api/v1/documents/{doc_id}", headers=headers_b)
    assert response.status_code == 200
    assert response.json()["name"] == "Secret Doc"

    # 6. User B tries to delete/update metadata (expect 403 Forbidden)
    update_payload = {"name": "Hacked Doc"}
    response = client.put(f"/api/v1/documents/{doc_id}", headers=headers_b, json=update_payload)
    assert response.status_code == 403

    # 7. User A deletes the document
    response = client.delete(f"/api/v1/documents/{doc_id}", headers=headers_a)
    assert response.status_code == 200
    
    # 8. Clean up users
    db_session.delete(user_a)
    db_session.delete(user_b)
    db_session.commit()
