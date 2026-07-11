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

    # 4. Seed Folders (Company Knowledge -> HR, Finance, Legal, Products -> ERP Lens)
    from app.models.models import Folder, Document
    import uuid

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

    root_folder = get_or_create_folder("Company Knowledge", None)
    hr_folder = get_or_create_folder("HR", root_folder.id)
    fin_folder = get_or_create_folder("Finance", root_folder.id)
    leg_folder = get_or_create_folder("Legal", root_folder.id)
    prod_folder = get_or_create_folder("Products", root_folder.id)
    erp_folder = get_or_create_folder("ERP Lens", prod_folder.id)

    admin_id = admin_user.id if admin_user else None

    # Documents data to seed with static IDs
    docs_data = [
        {
            "id": uuid.UUID("11111111-1111-1111-1111-111111111111"),
            "folder_id": hr_folder.id,
            "name": "Employee Handbook",
            "description": "Official corporate policies, office guidelines, code of conduct, and organizational structure overview.",
            "file_path": "/uploads/employee_handbook.pdf",
            "file_type": "pdf",
            "category": "HR Handbook",
            "access_level": "organization",
            "current_version": 1,
            "ai_summary": "Comprehensive handbook detailing working hours, benefits, direct lines of management contact, and professional conduct expectations.",
        },
        {
            "id": uuid.UUID("22222222-2222-2222-2222-222222222222"),
            "folder_id": hr_folder.id,
            "name": "Leave Policy",
            "description": "Rules regarding casual leaves, sick leaves, paid time-off limits, and request logging procedures.",
            "file_path": "/uploads/leave_policy.pdf",
            "file_type": "pdf",
            "category": "HR Policy",
            "access_level": "organization",
            "current_version": 2,
            "ai_summary": "Detailed criteria for PTO submissions, carrying over balances, maternity/paternity guidelines, and medical certificate templates.",
        },
        {
            "id": uuid.UUID("33333333-3333-3333-3333-333333333333"),
            "folder_id": fin_folder.id,
            "name": "GST Guide",
            "description": "Standard compliance checklist for goods and services tax invoicing and tax bracket assignments.",
            "file_path": "/uploads/gst_guide.docx",
            "file_type": "docx",
            "category": "Finance Guide",
            "access_level": "organization",
            "current_version": 1,
            "ai_summary": "Tax directives for local invoicing, matching ledgers, reverse charge mechanisms, and monthly compliance filing protocols.",
        },
        {
            "id": uuid.UUID("44444444-4444-4444-4444-444444444444"),
            "folder_id": fin_folder.id,
            "name": "Invoices",
            "description": "Corporate billing templates and accounts payable/receivable registration templates.",
            "file_path": "/uploads/invoices.xlsx",
            "file_type": "xlsx",
            "category": "Finance Template",
            "access_level": "department",
            "current_version": 1,
            "ai_summary": "Receipt templates with client headers, description rows, multi-currency cells, and corporate bank routing descriptions.",
        },
        {
            "id": uuid.UUID("55555555-5555-5555-5555-555555555555"),
            "folder_id": leg_folder.id,
            "name": "NDA",
            "description": "Standard corporate Non-Disclosure Agreement safeguarding intellectual properties and customer logs.",
            "file_path": "/uploads/nda.docx",
            "file_type": "docx",
            "category": "Legal NDA",
            "access_level": "organization",
            "current_version": 1,
            "ai_summary": "Protective legal structure outlining proprietary data definitions, disclosure limitations, arbitration terms, and duration scopes.",
        },
        {
            "id": uuid.UUID("66666666-6666-6666-6666-666666666666"),
            "folder_id": leg_folder.id,
            "name": "Contracts",
            "description": "Approved legal service agreement draft and external vendor master service agreement template.",
            "file_path": "/uploads/contracts.docx",
            "file_type": "docx",
            "category": "Legal Agreement",
            "access_level": "private",
            "current_version": 1,
            "ai_summary": "General master services structure specifying deliverables, milestones, warranty disclaimers, and liability caps.",
        },
        {
            "id": uuid.UUID("77777777-7777-7777-7777-777777777777"),
            "folder_id": erp_folder.id,
            "name": "User Manual",
            "description": "Setup operations manual for the corporate ERP Lens enterprise dashboard modules.",
            "file_path": "/uploads/user_manual.docx",
            "file_type": "docx",
            "category": "ERP Manual",
            "access_level": "organization",
            "current_version": 3,
            "ai_summary": "Manual for ERP module installations. Highlights database configuration strings, telemetry logging switches, and client portal authentication setups.",
        },
        {
            "id": uuid.UUID("88888888-8888-8888-8888-888888888888"),
            "folder_id": erp_folder.id,
            "name": "FAQs",
            "description": "Troubleshooting logs and frequently asked integration questions for the ERP Lens platform.",
            "file_path": "/uploads/faqs.docx",
            "file_type": "docx",
            "category": "ERP FAQs",
            "access_level": "department",
            "current_version": 1,
            "ai_summary": "Troubleshooting FAQ lists. Resolves connection dropouts, user access synchronization errors, and CSV ingestion limits.",
        }
    ]

    for item in docs_data:
        doc = db.query(Document).filter(Document.id == item["id"]).first()
        if not doc:
            doc = Document(
                id=item["id"],
                folder_id=item["folder_id"],
                name=item["name"],
                description=item["description"],
                file_path=item["file_path"],
                file_type=item["file_type"],
                category=item["category"],
                access_level=item["access_level"],
                current_version=item["current_version"],
                ai_summary=item["ai_summary"],
                owner_id=admin_id,
                status="active"
            )
            db.add(doc)
            logger.info(f"Seeding document: {item['name']}")
    
    db.commit()
    logger.info("Successfully seeded database document tree hierarchy.")
