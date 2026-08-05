import os
import io
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

os.environ["SECRET_KEY"] = "testsecretkeyforrunningtests"
os.environ["DATABASE_URL"] = os.getenv("DATABASE_URL", "sqlite:///./test.db")
os.environ["ENV"] = "development"

from app.main import app
from app.core.deps import get_db
from app.db.session import Base
from app.models.models import User, Role, Department, Document, Permission, Folder, Comment, Notification, DocumentVersion
from app.core.security import get_password_hash

client = TestClient(app)
engine = create_engine(os.environ["DATABASE_URL"], connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="module")
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    
    # Seed roles
    for r_name in ["super_admin", "admin", "employee", "guest", "department_manager"]:
        role = db.query(Role).filter(Role.name == r_name).first()
        if not role:
            db.add(Role(name=r_name))
            
    # Seed default department
    dept = db.query(Department).filter(Department.name == "HR").first()
    if not dept:
        db.add(Department(name="HR"))
        
    db.commit()
    yield db
    db.close()

def test_user_and_department_management(db_session):
    # Setup roles and department
    role_admin = db_session.query(Role).filter(Role.name == "admin").first()
    dept_hr = db_session.query(Department).filter(Department.name == "HR").first()
    
    # Register/create an admin user
    email_admin = "admin_test@efasttrade.com"
    db_session.query(User).filter(User.email == email_admin).delete()
    db_session.commit()
    
    admin_user = User(
        email=email_admin,
        full_name="Admin Test",
        password_hash=get_password_hash("password123"),
        role_id=role_admin.id,
        is_active=True,
        department_id=dept_hr.id
    )
    db_session.add(admin_user)
    db_session.commit()
    db_session.refresh(admin_user)
    
    # Login as Admin
    login_resp = client.post("/api/v1/auth/login", data={"username": email_admin, "password": "password123"})
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # List Departments
    dept_resp = client.get("/api/v1/departments", headers=headers)
    assert dept_resp.status_code == 200
    assert len(dept_resp.json()) >= 1
    
    # List Users
    users_resp = client.get("/api/v1/users", headers=headers)
    assert users_resp.status_code == 200
    assert len(users_resp.json()) >= 1
    
    # Cleanup admin
    db_session.delete(admin_user)
    db_session.commit()

def test_folders_and_documents(db_session):
    role_admin = db_session.query(Role).filter(Role.name == "admin").first()
    email = "folder_test@efasttrade.com"
    db_session.query(User).filter(User.email == email).delete()
    db_session.commit()
    
    user = User(
        email=email,
        full_name="Folder Tester",
        password_hash=get_password_hash("password"),
        role_id=role_admin.id,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    
    token = client.post("/api/v1/auth/login", data={"username": email, "password": "password"}).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create Folder
    folder_resp = client.post("/api/v1/folders", headers=headers, json={"name": "Finance Notes"})
    assert folder_resp.status_code in [200, 201]
    folder_id = folder_resp.json()["id"]
    
    # List Folder Tree
    tree_resp = client.get("/api/v1/folders/tree", headers=headers)
    assert tree_resp.status_code == 200
    
    # Delete Folder
    del_resp = client.delete(f"/api/v1/folders/{folder_id}", headers=headers)
    assert del_resp.status_code == 200
    
    db_session.delete(user)
    db_session.commit()

def test_comments_and_versions(db_session):
    role_admin = db_session.query(Role).filter(Role.name == "admin").first()
    email = "comm_test@efasttrade.com"
    db_session.query(User).filter(User.email == email).delete()
    db_session.commit()
    
    user = User(
        email=email,
        full_name="Comment Tester",
        password_hash=get_password_hash("password"),
        role_id=role_admin.id,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    
    token = client.post("/api/v1/auth/login", data={"username": email, "password": "password"}).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create doc
    doc = Document(
        name="Comments Doc",
        file_path="uploads/mock_comm.txt",
        file_type="txt",
        owner_id=user.id,
        status="active"
    )
    db_session.add(doc)
    db_session.commit()
    db_session.refresh(doc)
    
    # Create version
    version = DocumentVersion(
        document_id=doc.id,
        version_number=1,
        file_path="uploads/mock_comm_v1.txt",
        uploaded_by=user.id
    )
    db_session.add(version)
    db_session.commit()
    
    # Add Comment
    comment_payload = {
        "content": "Is this correct?",
        "quote": "proprietary codes"
    }
    comm_resp = client.post(f"/api/v1/comments/{doc.id}", headers=headers, json=comment_payload)
    assert comm_resp.status_code == 200
    comment_id = comm_resp.json()["id"]
    
    # List Comments
    list_comm = client.get(f"/api/v1/comments/{doc.id}", headers=headers)
    assert list_comm.status_code == 200
    assert len(list_comm.json()) == 1
    
    # Reply Comment
    reply_payload = {
        "content": "Yes, it is correct.",
        "parent_id": comment_id
    }
    reply_resp = client.post(f"/api/v1/comments/{doc.id}", headers=headers, json=reply_payload)
    assert reply_resp.status_code == 200
    
    # Resolve Comment
    resolve_resp = client.post(f"/api/v1/comments/resolve/{comment_id}", headers=headers)
    assert resolve_resp.status_code == 200
    
    # Delete Comment
    del_comm = client.delete(f"/api/v1/comments/item/{comment_id}", headers=headers)
    assert del_comm.status_code == 200
    
    # List Versions
    ver_resp = client.get(f"/api/v1/documents/{doc.id}/versions", headers=headers)
    assert ver_resp.status_code == 200
    
    db_session.delete(doc)
    db_session.delete(user)
    db_session.commit()

def test_dashboard_and_notifications(db_session):
    role_admin = db_session.query(Role).filter(Role.name == "admin").first()
    email = "dash_test@efasttrade.com"
    db_session.query(User).filter(User.email == email).delete()
    db_session.query(Notification).filter(Notification.user_email == email).delete()
    db_session.commit()
    
    user = User(
        email=email,
        full_name="Dashboard Tester",
        password_hash=get_password_hash("password"),
        role_id=role_admin.id,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    
    token = client.post("/api/v1/auth/login", data={"username": email, "password": "password"}).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create notification
    notif = Notification(
        user_email=user.email,
        title="Welcome",
        message="Welcome to DMS",
        read=False
    )
    db_session.add(notif)
    db_session.commit()
    db_session.refresh(notif)
    
    # List Notifications
    notif_resp = client.get("/api/v1/notifications", headers=headers)
    assert notif_resp.status_code == 200
    assert len(notif_resp.json()) == 1
    
    # Read Notification
    read_resp = client.post(f"/api/v1/notifications/read/{notif.id}", headers=headers)
    assert read_resp.status_code == 200
    
    # Read All
    read_all = client.post("/api/v1/notifications/read-all", headers=headers)
    assert read_all.status_code == 200
    
    # Delete Notification
    del_resp = client.delete(f"/api/v1/notifications/{notif.id}", headers=headers)
    assert del_resp.status_code == 200
    
    # Get Dashboard metrics
    dash_resp = client.get("/api/v1/dashboard", headers=headers)
    assert dash_resp.status_code == 200
    
    db_session.delete(user)
    db_session.commit()

def test_ai_endpoints_and_search(db_session):
    role_admin = db_session.query(Role).filter(Role.name == "admin").first()
    email = "ai_test@efasttrade.com"
    db_session.query(User).filter(User.email == email).delete()
    db_session.commit()
    
    user = User(
        email=email,
        full_name="AI Tester",
        password_hash=get_password_hash("password"),
        role_id=role_admin.id,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    
    token = client.post("/api/v1/auth/login", data={"username": email, "password": "password"}).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create doc for RAG context
    doc = Document(
        name="AI Search Doc",
        file_path="uploads/ai_test.txt",
        file_type="txt",
        owner_id=user.id,
        status="active"
    )
    db_session.add(doc)
    db_session.commit()
    db_session.refresh(doc)
    
    # Global AI Chat Ask
    ask_payload = {
        "question": "What is the secret format?",
        "conversation_id": "test-convo-123"
    }
    ask_resp = client.post("/api/v1/ai/ask", headers=headers, json=ask_payload)
    assert ask_resp.status_code == 200
    
    # Document Search API
    search_resp = client.get("/api/v1/search?q=AI", headers=headers)
    assert search_resp.status_code == 200
    
    db_session.delete(doc)
    db_session.delete(user)
    db_session.commit()
