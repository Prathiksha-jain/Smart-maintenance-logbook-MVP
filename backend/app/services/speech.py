from dataclasses import dataclass
from functools import lru_cache
import os
from pathlib import Path
import shutil
from typing import Any

from ..config import settings


class SpeechToTextError(RuntimeError):
    pass


LANGUAGE_HINTS = {
    "en": "English",
    "hi": "Hindi",
    "kn": "Kannada",
}

RAILWAY_PROMPT = (
    "Railway maintenance inspection audio. Common words include coach A1, B2, S3, door, brake pipe leakage, "
    "electrical panel spark, smoke smell, wheel crack, seat cushion damage, urgent attention."
)
LOW_CONFIDENCE_LOGPROB_THRESHOLD = -1.15


@dataclass(frozen=True)
class TranscriptionResult:
    raw_transcript: str
    translated_text: str | None = None
    language: str | None = None
    model_name: str | None = None
    average_logprob: float | None = None
    low_confidence: bool = False
    warning: str | None = None


def transcribe_audio_file(audio_path: Path, source_language: str | None = None) -> TranscriptionResult:
    if not audio_path.exists():
        raise SpeechToTextError("Audio file was not found on disk.")

    _configure_ffmpeg_path()
    language = _normalize_language_hint(source_language)
    model_name = _model_name_for_language(language)

    try:
        model, model_name = _load_first_available_model(model_name)
        result = _transcribe_with_fallback(model, audio_path, "transcribe", language)
    except SpeechToTextError:
        raise
    except Exception as exc:
        raise SpeechToTextError(f"Whisper transcription failed: {exc}") from exc

    text = str(result.get("text") or "").strip()
    if not text:
        raise SpeechToTextError("Whisper did not return any transcript text.")

    language = result.get("language")
    if language is not None:
        language = str(language).strip() or None

    translation_result: dict[str, Any] | None = None
    translated_text: str | None = None
    warning: str | None = None
    if _should_translate(language, source_language):
        try:
            translation_result = _transcribe_with_fallback(model, audio_path, "translate", language)
            translated_text = str(translation_result.get("text") or "").strip() or None
            if translated_text == text:
                translated_text = None
        except SpeechToTextError as exc:
            warning = f"English translation was skipped because Whisper translation failed: {exc}"

    average_logprob = _average_logprob(translation_result or {}) or _average_logprob(result)
    low_confidence = _is_low_confidence(average_logprob, translated_text or text)

    return TranscriptionResult(
        raw_transcript=text,
        translated_text=translated_text,
        language=language,
        model_name=model_name,
        average_logprob=average_logprob,
        low_confidence=low_confidence,
        warning=warning,
    )


def _normalize_language_hint(source_language: str | None) -> str | None:
    if not source_language or source_language == "auto":
        return None
    if source_language not in LANGUAGE_HINTS:
        raise SpeechToTextError("Unsupported audio language. Choose Auto, English, Hindi, or Kannada.")
    return source_language


def _model_name_for_language(language: str | None) -> str:
    if language in {"hi", "kn"}:
        return settings.whisper_non_english_model
    return settings.whisper_model


def _transcribe_options(task: str, language: str | None, *, use_prompt: bool, beam_size: int) -> dict[str, Any]:
    options: dict[str, Any] = {
        "task": task,
        "fp16": False,
        "temperature": 0,
        "beam_size": beam_size,
        "patience": 1,
        "condition_on_previous_text": False,
    }
    if use_prompt:
        options["initial_prompt"] = RAILWAY_PROMPT
    if language:
        options["language"] = language
    return options


def _load_first_available_model(preferred_model_name: str):
    model_names = [preferred_model_name]
    if settings.whisper_model not in model_names:
        model_names.append(settings.whisper_model)

    last_error: SpeechToTextError | None = None
    for model_name in model_names:
        try:
            return _get_whisper_model(model_name), model_name
        except SpeechToTextError as exc:
            last_error = exc

    raise last_error or SpeechToTextError("Could not load a Whisper model.")


def _transcribe_with_fallback(model, audio_path: Path, task: str, language: str | None) -> dict[str, Any]:
    attempts = (
        _transcribe_options(task, language, use_prompt=True, beam_size=5),
        _transcribe_options(task, language, use_prompt=False, beam_size=5),
        _transcribe_options(task, language, use_prompt=False, beam_size=1),
    )

    last_error: Exception | None = None
    for options in attempts:
        try:
            return model.transcribe(str(audio_path), **options)
        except Exception as exc:
            last_error = exc

    raise SpeechToTextError(f"Whisper {task} failed after safe retries: {last_error}")


def _should_translate(detected_language: str | None, source_language: str | None) -> bool:
    requested_language = _normalize_language_hint(source_language)
    if requested_language in {"hi", "kn"}:
        return True
    if requested_language == "en":
        return False
    return bool(detected_language and detected_language != "en")


def _average_logprob(result: dict[str, Any]) -> float | None:
    segments = result.get("segments")
    if not isinstance(segments, list):
        return None

    values: list[float] = []
    for segment in segments:
        if not isinstance(segment, dict):
            continue
        value = segment.get("avg_logprob")
        if value is None:
            continue
        try:
            values.append(float(value))
        except (TypeError, ValueError):
            continue

    if not values:
        return None
    return sum(values) / len(values)


def _is_low_confidence(average_logprob: float | None, text: str) -> bool:
    if average_logprob is not None and average_logprob < LOW_CONFIDENCE_LOGPROB_THRESHOLD:
        return True
    if _has_unexpected_translation_script(text):
        return True
    return False


def _has_unexpected_translation_script(text: str) -> bool:
    if not text.strip():
        return True

    letters = [character for character in text if character.isalpha()]
    if not letters:
        return True

    return any(not character.isascii() for character in letters)


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


@lru_cache(maxsize=4)
def _get_whisper_model(model_name: str):
    whisper_module = _load_whisper_module()
    try:
        settings.whisper_model_dir.mkdir(parents=True, exist_ok=True)
        return whisper_module.load_model(model_name, download_root=str(settings.whisper_model_dir))
    except Exception as exc:
        raise SpeechToTextError(f"Could not load the Whisper model: {exc}") from exc
