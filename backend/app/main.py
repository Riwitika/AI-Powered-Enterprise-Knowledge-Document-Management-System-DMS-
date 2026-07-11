import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.session import engine, Base, SessionLocal
from app.db.init_db import init_db
from app.api import auth, users, departments, folders, documents, permissions, search, ai, dashboard

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Run database creation & seed on startup
# This acts as a robust fallback to ensure the DB works immediately.
try:
    logger.info("Initializing database tables...")
    if engine.url.drivername.startswith("postgresql"):
        from sqlalchemy import text
        with engine.begin() as conn:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    init_db(db)
    db.close()
    logger.info("Database initialized successfully.")
except Exception as e:
    logger.error(f"Error during database initialization: {e}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(users.router, prefix=f"{settings.API_V1_STR}/users", tags=["users"])
app.include_router(departments.router, prefix=f"{settings.API_V1_STR}/departments", tags=["departments"])
app.include_router(folders.router, prefix=f"{settings.API_V1_STR}/folders", tags=["folders"])
app.include_router(documents.router, prefix=f"{settings.API_V1_STR}/documents", tags=["documents"])
app.include_router(permissions.router, prefix=f"{settings.API_V1_STR}/permissions", tags=["permissions"])
app.include_router(search.router, prefix=f"{settings.API_V1_STR}/search", tags=["search"])
app.include_router(ai.router, prefix=f"{settings.API_V1_STR}/ai", tags=["ai"])
app.include_router(dashboard.router, prefix=f"{settings.API_V1_STR}/dashboard", tags=["dashboard"])

@app.get("/")
def read_root():
    # Hot-reload seed trigger comment
    return {"message": "Welcome to the Enterprise KMS API. Go to /docs for Swagger documentation."}
