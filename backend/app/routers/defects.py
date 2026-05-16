from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from ..models import DefectLog, MediaFile, User
from ..schemas import DefectCreate, DefectRead, DefectStatusUpdate, Severity, TranscriptionResponse
from ..services.extractor import extract_defect_details, normalize_coach_number
from ..services.speech import SpeechToTextError, transcribe_audio_file


router = APIRouter(prefix="/api/defects", tags=["defects"])


@router.post("", response_model=DefectRead, status_code=status.HTTP_201_CREATED)
def create_defect(payload: DefectCreate, db: Session = Depends(get_db)) -> DefectLog:
    creator = db.get(User, payload.created_by)
    if creator is None:
        raise HTTPException(status_code=404, detail="created_by demo user was not found.")

    extracted = extract_defect_details(payload.raw_transcript)
    coach_number = normalize_coach_number(payload.coach_number) or extracted.coach_number

    defect = DefectLog(
        defect_code=_next_defect_code(db),
        train_number=payload.train_number.strip(),
        coach_number=coach_number,
        component_name=extracted.component_name,
        defect_type=extracted.defect_type,
        severity=extracted.severity,
        description=extracted.description,
        raw_transcript=payload.raw_transcript.strip(),
        translated_text=None,
        status="Open",
        location=payload.location.strip() if payload.location else None,
        created_by=payload.created_by,
    )
    db.add(defect)
    db.commit()
    db.refresh(defect)
    return defect


@router.get("", response_model=list[DefectRead])
def list_defects(
    status_filter: str | None = Query(default=None, alias="status"),
    severity: Severity | None = None,
    component: str | None = None,
    db: Session = Depends(get_db),
) -> list[DefectLog]:
    statement = select(DefectLog).order_by(DefectLog.created_at.desc())
    if status_filter:
        statement = statement.where(DefectLog.status == status_filter)
    if severity:
        statement = statement.where(DefectLog.severity == severity)
    if component:
        statement = statement.where(DefectLog.component_name == component)
    return list(db.scalars(statement))


@router.get("/{defect_id}", response_model=DefectRead)
def get_defect(defect_id: int, db: Session = Depends(get_db)) -> DefectLog:
    defect = db.get(DefectLog, defect_id)
    if defect is None:
        raise HTTPException(status_code=404, detail="Defect was not found.")
    return defect


@router.patch("/{defect_id}/status", response_model=DefectRead)
def update_defect_status(
    defect_id: int,
    payload: DefectStatusUpdate,
    db: Session = Depends(get_db),
) -> DefectLog:
    from ..models import StatusHistory

    defect = db.get(DefectLog, defect_id)
    if defect is None:
        raise HTTPException(status_code=404, detail="Defect was not found.")

    updater = db.get(User, payload.updated_by)
    if updater is None:
        raise HTTPException(status_code=404, detail="updated_by demo user was not found.")

    old_status = defect.status
    defect.status = payload.new_status
    history = StatusHistory(
        defect_id=defect.id,
        old_status=old_status,
        new_status=payload.new_status,
        remarks=payload.remarks,
        updated_by=payload.updated_by,
    )
    db.add(history)
    db.commit()
    db.refresh(defect)
    return defect


@router.post("/{defect_id}/transcribe", response_model=TranscriptionResponse)
def transcribe_defect_audio(defect_id: int, db: Session = Depends(get_db)) -> TranscriptionResponse:
    if not settings.enable_whisper:
        return TranscriptionResponse(
            message="Whisper transcription is disabled for this environment.",
            defect=None,
        )

    defect = db.get(DefectLog, defect_id)
    if defect is None:
        raise HTTPException(status_code=404, detail="Defect was not found.")

    latest_audio = db.scalar(
        select(MediaFile)
        .where(MediaFile.defect_id == defect_id, MediaFile.file_type == "audio")
        .order_by(MediaFile.uploaded_at.desc())
    )
    if latest_audio is None:
        raise HTTPException(status_code=404, detail="No audio file is available for this defect.")

    audio_path = _resolve_backend_file_path(latest_audio.file_path)
    try:
        transcription = transcribe_audio_file(audio_path)
    except SpeechToTextError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    extraction_text = transcription.translated_text or transcription.raw_transcript
    extracted = extract_defect_details(extraction_text)
    defect.raw_transcript = transcription.raw_transcript
    defect.translated_text = transcription.translated_text
    defect.coach_number = extracted.coach_number or defect.coach_number
    defect.component_name = extracted.component_name
    defect.defect_type = extracted.defect_type
    defect.severity = extracted.severity
    defect.description = extracted.description

    db.commit()
    db.refresh(defect)
    message = "Audio transcribed and defect details updated."
    if transcription.translated_text:
        message = "Audio transcribed, translated to English, and defect details updated."
    return TranscriptionResponse(
        message=message,
        defect=defect,
    )


def _next_defect_code(db: Session) -> str:
    prefix = f"DEF-{datetime.utcnow():%Y%m%d}-"
    existing_count = db.scalar(
        select(func.count(DefectLog.id)).where(DefectLog.defect_code.like(f"{prefix}%"))
    )
    sequence = (existing_count or 0) + 1
    return f"{prefix}{sequence:04d}"


def _resolve_backend_file_path(file_path: str) -> Path:
    resolved = (settings.backend_dir / file_path).resolve()
    try:
        resolved.relative_to(settings.backend_dir.resolve())
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Stored audio path is outside the backend directory.") from exc
    return resolved
