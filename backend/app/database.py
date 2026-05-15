from collections.abc import Generator
from datetime import datetime

from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from .config import settings


class Base(DeclarativeBase):
    pass


engine_kwargs = {}
if settings.database_backend == "sqlite":
    engine_kwargs["connect_args"] = {"check_same_thread": False}

engine = create_engine(settings.database_url, **engine_kwargs)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


DEMO_USERS = [
    {
        "name": "Ramesh Kumar",
        "employee_id": "INS-001",
        "role": "inspector",
        "password_hash": "demo-only",
    },
    {
        "name": "Suresh Patil",
        "employee_id": "SUP-001",
        "role": "supervisor",
        "password_hash": "demo-only",
    },
    {
        "name": "Anita Rao",
        "employee_id": "MGR-001",
        "role": "manager",
        "password_hash": "demo-only",
    },
    {
        "name": "Admin Demo",
        "employee_id": "ADM-001",
        "role": "admin",
        "password_hash": "demo-only",
    },
]

DEMO_DEFECTS = [
    {
        "train_number": "12951",
        "location": "Yard Line 2",
        "raw_transcript": "Coach S3 door number two is not closing properly and rubber lining is damaged.",
        "status": "Open",
    },
    {
        "train_number": "12952",
        "location": "Pit Line 4",
        "raw_transcript": "Coach B2 brake pipe leakage near left side connection, needs urgent attention.",
        "status": "Assigned",
    },
    {
        "train_number": "12295",
        "location": "Platform 3",
        "raw_transcript": "Coach A1 electrical panel has spark and smoke smell.",
        "status": "In Progress",
    },
    {
        "train_number": "12627",
        "location": "Maintenance Bay 1",
        "raw_transcript": "Coach S5 seat cushion is damaged near berth number 42.",
        "status": "Resolved",
    },
]


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    settings.data_dir.mkdir(parents=True, exist_ok=True)
    settings.audio_upload_dir.mkdir(parents=True, exist_ok=True)
    settings.image_upload_dir.mkdir(parents=True, exist_ok=True)
    settings.backend_bin_dir.mkdir(parents=True, exist_ok=True)
    settings.whisper_model_dir.mkdir(parents=True, exist_ok=True)

    from . import models

    Base.metadata.create_all(bind=engine)
    seed_demo_users()
    seed_demo_defects()


def seed_demo_users() -> None:
    from .models import User

    with SessionLocal() as db:
        for demo_user in DEMO_USERS:
            existing = db.scalar(
                select(User).where(User.employee_id == demo_user["employee_id"])
            )
            if existing is None:
                db.add(User(**demo_user))
            else:
                existing.name = demo_user["name"]
                existing.role = demo_user["role"]
                existing.password_hash = demo_user["password_hash"]
        db.commit()


def seed_demo_defects() -> None:
    from .models import DefectLog, StatusHistory, User
    from .services.extractor import extract_defect_details

    with SessionLocal() as db:
        inspector = db.scalar(select(User).where(User.employee_id == "INS-001"))
        supervisor = db.scalar(select(User).where(User.employee_id == "SUP-001"))
        if inspector is None:
            return

        for sample in DEMO_DEFECTS:
            existing = db.scalar(
                select(DefectLog).where(DefectLog.raw_transcript == sample["raw_transcript"])
            )
            if existing is not None:
                continue

            extracted = extract_defect_details(sample["raw_transcript"])
            defect = DefectLog(
                defect_code=_next_demo_defect_code(db),
                train_number=sample["train_number"],
                coach_number=extracted.coach_number,
                component_name=extracted.component_name,
                defect_type=extracted.defect_type,
                severity=extracted.severity,
                description=extracted.description,
                raw_transcript=sample["raw_transcript"],
                translated_text=None,
                status=sample["status"],
                location=sample["location"],
                created_by=inspector.id,
            )
            db.add(defect)
            db.flush()

            if sample["status"] != "Open" and supervisor is not None:
                db.add(
                    StatusHistory(
                        defect_id=defect.id,
                        old_status="Open",
                        new_status=sample["status"],
                        remarks="Seeded demo workflow state.",
                        updated_by=supervisor.id,
                    )
                )

        db.commit()


def _next_demo_defect_code(db: Session) -> str:
    from .models import DefectLog

    prefix = f"DEF-{datetime.utcnow():%Y%m%d}-"
    existing_count = db.scalar(
        select(func.count(DefectLog.id)).where(DefectLog.defect_code.like(f"{prefix}%"))
    )
    sequence = (existing_count or 0) + 1
    return f"{prefix}{sequence:04d}"
