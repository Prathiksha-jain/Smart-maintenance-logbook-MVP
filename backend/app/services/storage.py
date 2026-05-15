from dataclasses import dataclass
from pathlib import Path
import re
from uuid import uuid4

from fastapi import UploadFile

from ..config import settings


ALLOWED_EXTENSIONS = {
    "audio": {"wav", "mp3", "m4a", "webm"},
    "image": {"jpg", "jpeg", "png", "webp"},
}

CHUNK_SIZE = 1024 * 1024


class StorageError(ValueError):
    pass


@dataclass(frozen=True)
class StoredFile:
    file_path: str
    original_filename: str


async def save_upload_file(upload_file: UploadFile, file_type: str) -> StoredFile:
    if file_type not in ALLOWED_EXTENSIONS:
        raise StorageError("Unsupported file type.")

    original_filename = Path(upload_file.filename or "").name
    if not original_filename:
        raise StorageError("A filename is required.")

    extension = Path(original_filename).suffix.lower().lstrip(".")
    if extension not in ALLOWED_EXTENSIONS[file_type]:
        allowed = ", ".join(sorted(ALLOWED_EXTENSIONS[file_type]))
        raise StorageError(f"Invalid {file_type} extension. Allowed: {allowed}.")

    target_dir = settings.audio_upload_dir if file_type == "audio" else settings.image_upload_dir
    target_dir.mkdir(parents=True, exist_ok=True)
    target_path = (target_dir / _safe_filename(original_filename)).resolve()

    if not _is_relative_to(target_path, target_dir.resolve()):
        raise StorageError("Invalid upload path.")

    with target_path.open("wb") as output:
        while chunk := await upload_file.read(CHUNK_SIZE):
            output.write(chunk)

    await upload_file.close()

    return StoredFile(
        file_path=target_path.relative_to(settings.backend_dir).as_posix(),
        original_filename=original_filename,
    )


def _safe_filename(filename: str) -> str:
    path = Path(filename)
    stem = re.sub(r"[^A-Za-z0-9_.-]+", "_", path.stem).strip("._-") or "upload"
    extension = path.suffix.lower()
    return f"{uuid4().hex}_{stem}{extension}"


def _is_relative_to(path: Path, parent: Path) -> bool:
    try:
        path.relative_to(parent)
        return True
    except ValueError:
        return False
