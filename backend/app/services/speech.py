from dataclasses import dataclass
from functools import lru_cache
import os
from pathlib import Path
import shutil
from typing import Any

from ..config import settings


class SpeechToTextError(RuntimeError):
    pass


@dataclass(frozen=True)
class TranscriptionResult:
    raw_transcript: str
    translated_text: str | None = None


def transcribe_audio_file(audio_path: Path) -> TranscriptionResult:
    if not audio_path.exists():
        raise SpeechToTextError("Audio file was not found on disk.")

    _configure_ffmpeg_path()

    try:
        model = _get_whisper_model()
        result: dict[str, Any] = model.transcribe(str(audio_path))
    except SpeechToTextError:
        raise
    except Exception as exc:
        raise SpeechToTextError(f"Whisper transcription failed: {exc}") from exc

    text = str(result.get("text") or "").strip()
    if not text:
        raise SpeechToTextError("Whisper did not return any transcript text.")

    translated_text = result.get("translated_text")
    if translated_text is not None:
        translated_text = str(translated_text).strip() or None

    return TranscriptionResult(raw_transcript=text, translated_text=translated_text)


def _load_whisper_module():
    try:
        import whisper
    except ImportError as exc:
        raise SpeechToTextError(
            "Whisper is enabled but not installed. Install the optional 'openai-whisper' package in the backend environment."
        ) from exc
    return whisper


def _configure_ffmpeg_path() -> None:
    try:
        import imageio_ffmpeg
    except ImportError:
        return

    source_ffmpeg = Path(imageio_ffmpeg.get_ffmpeg_exe()).resolve()
    settings.backend_bin_dir.mkdir(parents=True, exist_ok=True)
    ffmpeg_exe = settings.backend_bin_dir / "ffmpeg.exe"
    if not ffmpeg_exe.exists():
        shutil.copy2(source_ffmpeg, ffmpeg_exe)

    ffmpeg_dir = str(settings.backend_bin_dir)
    current_path = os.environ.get("PATH", "")
    if ffmpeg_dir.lower() not in current_path.lower():
        os.environ["PATH"] = f"{ffmpeg_dir}{os.pathsep}{current_path}"


@lru_cache(maxsize=1)
def _get_whisper_model():
    whisper_module = _load_whisper_module()
    try:
        settings.whisper_model_dir.mkdir(parents=True, exist_ok=True)
        return whisper_module.load_model("base", download_root=str(settings.whisper_model_dir))
    except Exception as exc:
        raise SpeechToTextError(f"Could not load the Whisper model: {exc}") from exc
