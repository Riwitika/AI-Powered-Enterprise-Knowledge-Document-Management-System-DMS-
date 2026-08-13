import logging
from sqlalchemy.orm import Session
from app.models.models import Role, Department, User
from app.core.security import get_password_hash

logger = logging.getLogger(__name__)

# Fixed seed document IDs — used for idempotent seeding and targeted pollution repair
SEED_EMPLOYEE_HANDBOOK_ID = "11111111-1111-1111-1111-111111111111"
SEED_LEAVE_POLICY_ID = "22222222-2222-2222-2222-222222222222"

# Marker injected by the old DocxEditor fake-content fallback (removed in Fix #2)
FAKE_HANDBOOK_CONTENT_MARKER = "Enterprise Policy and Operational Guidelines"

# Demo HTML content stored ONLY for the Employee Handbook seed document
EMPLOYEE_HANDBOOK_SEED_CONTENT = """
<div data-type="page" class="tiptap-page-sheet">
  <h1>Employee Handbook</h1>
  <p>Welcome to Fast Trade Technologies Pvt. Ltd. This handbook outlines corporate policies, working guidelines, code of conduct, and organizational expectations for all team members.</p>
  <h2>1. Working Hours &amp; Attendance</h2>
  <p>Standard working hours are 9:30 AM to 6:30 PM, Monday through Friday. Flexible arrangements require manager approval and must be documented in the HR portal.</p>
  <h2>2. Code of Conduct</h2>
  <p>All employees are expected to maintain professional integrity, respect confidentiality, and comply with information security policies when using the Knowledge Management System.</p>
  <h2>3. Benefits Overview</h2>
  <p>Eligible employees receive health insurance, paid time off, and professional development allowances as outlined in their offer letter and departmental policies.</p>
</div>
""".strip()


def _repair_polluted_seed_documents(db: Session) -> None:
    """
    One-time-safe repair for dev databases polluted by the old editor fake-content fallback.
    Only clears content when the known fake marker is present on non-handbook seed documents.
    Never deletes rows; never touches documents without the pollution marker.
    """
    import uuid
    from app.models.models import Document

    non_handbook_seed_ids = [
        uuid.UUID(SEED_LEAVE_POLICY_ID),
        uuid.UUID("33333333-3333-3333-3333-333333333333"),
        uuid.UUID("44444444-4444-4444-4444-444444444444"),
        uuid.UUID("55555555-5555-5555-5555-555555555555"),
        uuid.UUID("66666666-6666-6666-6666-666666666666"),
        uuid.UUID("77777777-7777-7777-7777-777777777777"),
    ]

    for doc_id in non_handbook_seed_ids:
        doc = db.query(Document).filter(Document.id == doc_id).first()
        if doc and doc.content and FAKE_HANDBOOK_CONTENT_MARKER in doc.content:
            logger.info(
                "Repairing polluted seed document '%s' (%s): removing injected fake handbook content",
                doc.name,
                doc.id,
            )
            doc.content = None

    handbook = db.query(Document).filter(Document.id == uuid.UUID(SEED_EMPLOYEE_HANDBOOK_ID)).first()
    if handbook and (handbook.content is None or not str(handbook.content).strip()):
        handbook.content = EMPLOYEE_HANDBOOK_SEED_CONTENT
        logger.info("Initializing Employee Handbook seed content (document had no stored content)")


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
    departments = ["Corporate", "Engineering", "Human Resources", "Finance", "Legal", "Operations"]
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

    # Get roles and departments
    super_admin_role = db.query(Role).filter(Role.name == "super_admin").first()
    admin_role = db.query(Role).filter(Role.name == "admin").first()
    manager_role = db.query(Role).filter(Role.name == "department_manager").first()
    employee_role = db.query(Role).filter(Role.name == "employee").first()

    corp_dept = db.query(Department).filter(Department.name == "Corporate").first()
    ops_dept = db.query(Department).filter(Department.name == "Operations").first()
    hr_dept = db.query(Department).filter(Department.name == "Human Resources").first()
    fin_dept = db.query(Department).filter(Department.name == "Finance").first()

    # 3. Seed Standard Demo Users
    demo_users_data = [
        {
            "full_name": "Arun Goyal",
            "email": "superadmin@efasttrade.com",
            "password": "SuperAdmin@123",
            "role_id": super_admin_role.id if super_admin_role else None,
            "department_id": corp_dept.id if corp_dept else None
        },
        {
            "full_name": "Arnim Goyal",
            "email": "admin@efasttrade.com",
            "password": "Admin@123",
            "role_id": admin_role.id if admin_role else None,
            "department_id": ops_dept.id if ops_dept else None
        },
        {
            "full_name": "Riwitika Gupta",
            "email": "manager@efasttrade.com",
            "password": "Manager@123",
            "role_id": manager_role.id if manager_role else None,
            "department_id": fin_dept.id if fin_dept else None
        },
        {
            "full_name": "Paras Jain",
            "email": "employee@efasttrade.com",
            "password": "Employee@123",
            "role_id": employee_role.id if employee_role else None,
            "department_id": hr_dept.id if hr_dept else None
        },
        {
            "full_name": "Yukti Gupta",
            "email": "yukti@efasttrade.com",
            "password": "Employee@123",
            "role_id": employee_role.id if employee_role else None,
            "department_id": hr_dept.id if hr_dept else None
        },
        {
            "full_name": "Uttam Gupta",
            "email": "uttam@efasttrade.com",
            "password": "Employee@123",
            "role_id": employee_role.id if employee_role else None,
            "department_id": ops_dept.id if ops_dept else None
        }
    ]

    admin_user = None
    for u_data in demo_users_data:
        user_record = db.query(User).filter(User.email == u_data["email"]).first()
        if not user_record:
            user_record = User(
                full_name=u_data["full_name"],
                email=u_data["email"],
                password_hash=get_password_hash(u_data["password"]),
                role_id=u_data["role_id"],
                department_id=u_data["department_id"],
                is_active=True
            )
            db.add(user_record)
            db.commit()
            db.refresh(user_record)
            logger.info(f"Seeded user: {u_data['email']}")
        
        if u_data["email"] == "superadmin@efasttrade.com":
            admin_user = user_record

    # 4. Seed Folders & Documents (Company Documents -> HR Documents, Mixed Documents)
    from app.models.models import Folder, Document
    import uuid
    import os

    # Helper function to get or create folder
    def get_or_create_folder(name: str, parent_id: int | None) -> Folder:
        folder = db.query(Folder).filter(Folder.name == name, Folder.parent_id == parent_id).first()
        if not folder:
            folder = Folder(name=name, parent_id=parent_id)
            db.add(folder)
            db.commit()
            db.refresh(folder)
            logger.info(f"Seeding folder: {name}")
        return folder

    root_folder = get_or_create_folder("Company Documents", None)
    hr_folder = get_or_create_folder("HR Documents", root_folder.id)
    mixed_folder = get_or_create_folder("Mixed Documents", root_folder.id)

    admin_id = admin_user.id if admin_user else None

    # Write files to uploads directory so they physically exist
    os.makedirs("./uploads", exist_ok=True)
    seeded_files = {
        "employee_handbook.docx": "Employee Handbook: Standard HR Guidelines, leave structures, and Code of Conduct.",
        "leave_policy.docx": "Leave Policy: Guidelines for casual leaves, medical leaves, and parental time-off.",
        "company_profile.pdf": "Company Profile: Fast Trade Enterprise KMS strategy, mission statement, and client verticals.",
        "sales_presentation.pptx": "Sales Presentation: Presentation deck for sales metrics, growth charts, and product roadmaps.",
        "financial_report.xlsx": "Financial Report: Departmental allocations, gross revenues, expenditures, and compliance audits.",
        "meeting_notes.txt": "Meeting Notes: Weekly sync items, decisions, timeline constraints, and action tasks.",
        "office_layout.png": "Office Layout: Mapping floor plans, compliance exits, conference facilities, and desk locations."
    }

    for fname, content in seeded_files.items():
        fpath = os.path.join("./uploads", fname)
        if not os.path.exists(fpath):
            with open(fpath, "w") as f:
                f.write(content)

    docs_data = [
        {
            "id": uuid.UUID(SEED_EMPLOYEE_HANDBOOK_ID),
            "folder_id": hr_folder.id,
            "name": "Employee Handbook.docx",
            "description": "Official corporate policies, office guidelines, code of conduct, and organizational structure overview.",
            "file_path": "/uploads/employee_handbook.docx",
            "file_type": "docx",
            "category": "HR Handbook",
            "access_level": "organization",
            "current_version": 1,
            "ai_summary": "Comprehensive handbook detailing working hours, benefits, direct lines of management contact, and professional conduct expectations.",
            "content": EMPLOYEE_HANDBOOK_SEED_CONTENT,
        },
        {
            "id": uuid.UUID(SEED_LEAVE_POLICY_ID),
            "folder_id": hr_folder.id,
            "name": "Leave Policy.docx",
            "description": "Rules regarding casual leaves, sick leaves, paid time-off limits, and request logging procedures.",
            "file_path": "/uploads/leave_policy.docx",
            "file_type": "docx",
            "category": "HR Policy",
            "access_level": "organization",
            "current_version": 1,
            "ai_summary": "Detailed criteria for PTO submissions, carrying over balances, maternity/paternity guidelines, and medical certificate templates.",
        },
        {
            "id": uuid.UUID("33333333-3333-3333-3333-333333333333"),
            "folder_id": mixed_folder.id,
            "name": "Company Profile.pdf",
            "description": "Enterprise mission, services, client segments, and business strategy overview.",
            "file_path": "/uploads/company_profile.pdf",
            "file_type": "pdf",
            "category": "Corporate Overview",
            "access_level": "organization",
            "current_version": 1,
            "ai_summary": "Tax directives for local invoicing, matching ledgers, reverse charge mechanisms, and monthly compliance filing protocols.",
        },
        {
            "id": uuid.UUID("44444444-4444-4444-4444-444444444444"),
            "folder_id": mixed_folder.id,
            "name": "Sales Presentation.pptx",
            "description": "Approved template for marketing proposals and client decks.",
            "file_path": "/uploads/sales_presentation.pptx",
            "file_type": "pptx",
            "category": "Sales Deck",
            "access_level": "organization",
            "current_version": 1,
            "ai_summary": "Receipt templates with client headers, description rows, multi-currency cells, and corporate bank routing descriptions.",
        },
        {
            "id": uuid.UUID("55555555-5555-5555-5555-555555555555"),
            "folder_id": mixed_folder.id,
            "name": "Financial Report.xlsx",
            "description": "Departmental expenses, annual tax compliance figures, and cash flow analysis.",
            "file_path": "/uploads/financial_report.xlsx",
            "file_type": "xlsx",
            "category": "Financial Summary",
            "access_level": "organization",
            "current_version": 1,
            "ai_summary": "Protective legal structure outlining proprietary data definitions, disclosure limitations, arbitration terms, and duration scopes.",
        },
        {
            "id": uuid.UUID("66666666-6666-6666-6666-666666666666"),
            "folder_id": mixed_folder.id,
            "name": "Meeting Notes.txt",
            "description": "Weekly sync decisions, timeline constraints, and compliance checklists.",
            "file_path": "/uploads/meeting_notes.txt",
            "file_type": "txt",
            "category": "Meeting Minutes",
            "access_level": "organization",
            "current_version": 1,
            "ai_summary": "General master services structure specifying deliverables, milestones, warranty disclaimers, and liability caps.",
        },
        {
            "id": uuid.UUID("77777777-7777-7777-7777-777777777777"),
            "folder_id": mixed_folder.id,
            "name": "Office Layout.png",
            "description": "Structural map of office seating, compliance exits, and meeting rooms.",
            "file_path": "/uploads/office_layout.png",
            "file_type": "png",
            "category": "Facility Map",
            "access_level": "organization",
            "current_version": 1,
            "ai_summary": "Manual for ERP module installations. Highlights database configuration strings, telemetry logging switches, and client portal authentication setups.",
        }
    ]

    for item in docs_data:
        doc = db.query(Document).filter(Document.id == item["id"]).first()
        if not doc:
            doc_kwargs = {
                "id": item["id"],
                "folder_id": item["folder_id"],
                "name": item["name"],
                "description": item["description"],
                "file_path": item["file_path"],
                "file_type": item["file_type"],
                "category": item["category"],
                "access_level": item["access_level"],
                "current_version": item["current_version"],
                "ai_summary": item["ai_summary"],
                "owner_id": admin_id,
                "status": "active",
            }
            if item.get("content") is not None:
                doc_kwargs["content"] = item["content"]
            doc = Document(**doc_kwargs)
            db.add(doc)
            logger.info(f"Seeding document: {item['name']}")

    db.commit()

    # Targeted repair for dev DBs polluted by the old fake editor fallback (never deletes rows)
    _repair_polluted_seed_documents(db)
    db.commit()

    logger.info("Database seed initialization complete (existing records preserved).")
