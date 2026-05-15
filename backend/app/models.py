from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


USER_ROLES = ("inspector", "supervisor", "manager", "admin")
DEFECT_STATUSES = ("Open", "Reviewed", "Assigned", "In Progress", "Resolved", "Closed")
SEVERITIES = ("Low", "Medium", "High", "Critical")
MEDIA_FILE_TYPES = ("audio", "image")


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint(
            "role in ('inspector', 'supervisor', 'manager', 'admin')",
            name="ck_users_role",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    employee_id: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    role: Mapped[str] = mapped_column(String(30), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    defects: Mapped[list["DefectLog"]] = relationship("DefectLog", back_populates="creator")


class DefectLog(Base):
    __tablename__ = "defect_logs"
    __table_args__ = (
        CheckConstraint(
            "severity in ('Low', 'Medium', 'High', 'Critical')",
            name="ck_defect_logs_severity",
        ),
        CheckConstraint(
            "status in ('Open', 'Reviewed', 'Assigned', 'In Progress', 'Resolved', 'Closed')",
            name="ck_defect_logs_status",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    defect_code: Mapped[str] = mapped_column(String(30), unique=True, index=True, nullable=False)
    train_number: Mapped[str] = mapped_column(String(50), nullable=False)
    coach_number: Mapped[str | None] = mapped_column(String(20), nullable=True)
    component_name: Mapped[str] = mapped_column(String(120), nullable=False)
    defect_type: Mapped[str] = mapped_column(String(120), nullable=False)
    severity: Mapped[str] = mapped_column(String(20), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    raw_transcript: Mapped[str] = mapped_column(Text, nullable=False)
    translated_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="Open", nullable=False)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    creator: Mapped[User] = relationship("User", back_populates="defects")
    media_files: Mapped[list["MediaFile"]] = relationship(
        "MediaFile",
        back_populates="defect",
        cascade="all, delete-orphan",
    )
    status_history: Mapped[list["StatusHistory"]] = relationship(
        "StatusHistory",
        back_populates="defect",
        cascade="all, delete-orphan",
    )


class MediaFile(Base):
    __tablename__ = "media_files"
    __table_args__ = (
        CheckConstraint("file_type in ('audio', 'image')", name="ck_media_files_file_type"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    defect_id: Mapped[int] = mapped_column(ForeignKey("defect_logs.id"), nullable=False, index=True)
    file_type: Mapped[str] = mapped_column(String(20), nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    defect: Mapped[DefectLog] = relationship("DefectLog", back_populates="media_files")


class StatusHistory(Base):
    __tablename__ = "status_history"
    __table_args__ = (
        CheckConstraint(
            "old_status in ('Open', 'Reviewed', 'Assigned', 'In Progress', 'Resolved', 'Closed')",
            name="ck_status_history_old_status",
        ),
        CheckConstraint(
            "new_status in ('Open', 'Reviewed', 'Assigned', 'In Progress', 'Resolved', 'Closed')",
            name="ck_status_history_new_status",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    defect_id: Mapped[int] = mapped_column(ForeignKey("defect_logs.id"), nullable=False, index=True)
    old_status: Mapped[str] = mapped_column(String(30), nullable=False)
    new_status: Mapped[str] = mapped_column(String(30), nullable=False)
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)
    updated_by: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    defect: Mapped[DefectLog] = relationship("DefectLog", back_populates="status_history")
    updated_by_user: Mapped[User] = relationship("User")
