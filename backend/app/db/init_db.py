import logging
from sqlalchemy.orm import Session
from app.models.models import Role, Department, User
from app.core.security import get_password_hash

logger = logging.getLogger(__name__)

def init_db(db: Session) -> None:
    # 1. Seed Roles
    roles = ["super_admin", "admin", "department_manager", "employee", "guest"]
    db_roles = []
    for role_name in roles:
        role = db.query(Role).filter(Role.name == role_name).first()
        if not role:
            role = Role(name=role_name)
            db.add(role)
            logger.info(f"Seeding role: {role_name}")
        db_roles.append(role)
    db.commit()

    # 2. Seed Default Departments
    departments = ["Corporate", "Engineering", "Human Resources", "Finance", "Legal"]
    db_depts = []
    # Seed top-level Corporate
    corp = db.query(Department).filter(Department.name == "Corporate").first()
    if not corp:
        corp = Department(name="Corporate", parent_id=None)
        db.add(corp)
        db.commit()
        db.refresh(corp)
        logger.info("Seeding department: Corporate")
    
    for dept_name in departments[1:]:
        dept = db.query(Department).filter(Department.name == dept_name).first()
        if not dept:
            dept = Department(name=dept_name, parent_id=corp.id)
            db.add(dept)
            logger.info(f"Seeding department: {dept_name}")
        db_depts.append(dept)
    db.commit()

    # Get super_admin role
    super_admin_role = db.query(Role).filter(Role.name == "super_admin").first()
    corp_dept = db.query(Department).filter(Department.name == "Corporate").first()

    # 3. Seed Super Admin User
    admin_email = "admin@enterprise.com"
    admin_user = db.query(User).filter(User.email == admin_email).first()
    if not admin_user:
        admin_user = User(
            full_name="System Administrator",
            email=admin_email,
            password_hash=get_password_hash("adminpassword"),
            role_id=super_admin_role.id if super_admin_role else None,
            department_id=corp_dept.id if corp_dept else None,
            is_active=True
        )
        db.add(admin_user)
        db.commit()
        logger.info(f"Seeding super_admin user: {admin_email}")
    else:
        logger.info(f"Super_admin user {admin_email} already exists.")
