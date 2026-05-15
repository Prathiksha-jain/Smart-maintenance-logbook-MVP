from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


Role = Literal["inspector", "supervisor", "manager", "admin"]
Severity = Literal["Low", "Medium", "High", "Critical"]
DefectStatus = Literal["Open", "Reviewed", "Assigned", "In Progress", "Resolved", "Closed"]
MediaFileType = Literal["audio", "image"]


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    employee_id: str
    role: Role
    created_at: datetime


class MediaFileRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    defect_id: int
    file_type: MediaFileType
    file_path: str
    original_filename: str
    uploaded_at: datetime


class StatusHistoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    defect_id: int
    old_status: DefectStatus
    new_status: DefectStatus
    remarks: str | None
    updated_by: int
    updated_at: datetime


class DefectCreate(BaseModel):
    train_number: str = Field(..., min_length=1, max_length=50)
    coach_number: str | None = Field(default=None, max_length=20)
    location: str | None = Field(default=None, max_length=255)
    raw_transcript: str = Field(..., min_length=1)
    created_by: int = Field(..., gt=0)


class DefectStatusUpdate(BaseModel):
    new_status: DefectStatus
    remarks: str | None = None
    updated_by: int = Field(..., gt=0)


class DefectRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    defect_code: str
    train_number: str
    coach_number: str | None
    component_name: str
    defect_type: str
    severity: Severity
    description: str
    raw_transcript: str
    translated_text: str | None
    status: DefectStatus
    location: str | None
    created_by: int
    created_at: datetime
    updated_at: datetime
    media_files: list[MediaFileRead] = Field(default_factory=list)


class TranscriptionResponse(BaseModel):
    message: str
    defect: DefectRead | None = None


class HealthRead(BaseModel):
    status: str
    app: str
    environment: str
    database: str
    host: str
    port: int
    whisper_enabled: bool


class DashboardSummary(BaseModel):
    total_defects: int
    open_defects: int
    in_progress_defects: int
    resolved_defects: int
    critical_defects: int


class DashboardBucket(BaseModel):
    label: str
    count: int
