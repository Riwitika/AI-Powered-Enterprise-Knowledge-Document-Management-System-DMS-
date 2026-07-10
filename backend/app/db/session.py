from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

is_sqlite = settings.DATABASE_URL.startswith("sqlite")
connect_args = {"check_same_thread": False} if is_sqlite else {}

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    connect_args=connect_args
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

@event.listens_for(Base.metadata, 'before_create')
def create_vector_extension(target, connection, **kw):
    if connection.dialect.name == 'postgresql':
        connection.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
