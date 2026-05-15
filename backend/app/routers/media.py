from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import DefectLog, MediaFile
from ..schemas import MediaFileRead
from ..services.storage import StorageError, save_upload_file


router = APIRouter(prefix="/api/defects", tags=["media"])


@router.post(
    "/{defect_id}/media/audio",
    response_model=MediaFileRead,
    status_code=status.HTTP_201_CREATED,
)
async def upload_audio(
    defect_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> MediaFile:
    return await _save_media(defect_id, file, "audio", db)


@router.post(
    "/{defect_id}/media/image",
    response_model=MediaFileRead,
    status_code=status.HTTP_201_CREATED,
)
async def upload_image(
    defect_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> MediaFile:
    return await _save_media(defect_id, file, "image", db)


@router.get("/{defect_id}/media", response_model=list[MediaFileRead])
def list_media(defect_id: int, db: Session = Depends(get_db)) -> list[MediaFile]:
    defect = db.get(DefectLog, defect_id)
    if defect is None:
        raise HTTPException(status_code=404, detail="Defect was not found.")

    return list(
        db.scalars(select(MediaFile).where(MediaFile.defect_id == defect_id).order_by(MediaFile.uploaded_at.desc()))
    )


async def _save_media(
    defect_id: int,
    upload_file: UploadFile,
    file_type: str,
    db: Session,
) -> MediaFile:
    defect = db.get(DefectLog, defect_id)
    if defect is None:
        raise HTTPException(status_code=404, detail="Defect was not found.")

    try:
        stored_file = await save_upload_file(upload_file, file_type)
    except StorageError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    media_file = MediaFile(
        defect_id=defect_id,
        file_type=file_type,
        file_path=stored_file.file_path,
        original_filename=stored_file.original_filename,
    )
    db.add(media_file)
    db.commit()
    db.refresh(media_file)
    return media_file
