from sqlalchemy import create_engine
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from .config import DATABASE_URL

SQLALCHEMY_DATABASE_URL = DATABASE_URL

engine_kwargs = {}
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}

engine = create_engine(SQLALCHEMY_DATABASE_URL, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def ensure_sqlite_compat_columns():
    if not SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
        return

    required_columns = {
        "prompt_track_runs": {
            "query_hash": "TEXT",
            "status": "TEXT",
            "provider_used": "TEXT",
            "model_name": "TEXT",
            "mention_tier": "TEXT",
            "share_of_model_score": "INTEGER DEFAULT 0",
            "latency_ms": "INTEGER DEFAULT 0",
            "error_message": "TEXT",
            "response_share_url": "TEXT",
            "result_summary_json": "TEXT",
        }
    }

    with engine.begin() as conn:
        for table_name, table_columns in required_columns.items():
            rows = conn.execute(text(f"PRAGMA table_info({table_name})")).fetchall()
            existing = {row[1] for row in rows}
            for column_name, column_type in table_columns.items():
                if column_name in existing:
                    continue
                conn.execute(
                    text(
                        f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type}"
                    )
                )

        try:
            conn.execute(
                text(
                    "CREATE UNIQUE INDEX IF NOT EXISTS uq_users_email_lower ON users (lower(email))"
                )
            )
        except SQLAlchemyError:
            pass

        try:
            conn.execute(
                text(
                    "CREATE UNIQUE INDEX IF NOT EXISTS uq_user_auth_provider_subject_idx ON user_auth_providers(provider, subject)"
                )
            )
        except SQLAlchemyError:
            pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
