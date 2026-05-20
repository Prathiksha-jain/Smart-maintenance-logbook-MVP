from app.config import settings
from app.services import speech


def test_non_english_audio_uses_stronger_model() -> None:
    assert speech._model_name_for_language("hi") == settings.whisper_non_english_model
    assert speech._model_name_for_language("kn") == settings.whisper_non_english_model
    assert speech._model_name_for_language(None) == settings.whisper_model
    assert speech._model_name_for_language("en") == settings.whisper_model


def test_low_confidence_rejects_unexpected_translation_script() -> None:
    assert speech._is_low_confidence(-0.5, "both the deposit pass験 urgently do not damage")


def test_low_confidence_rejects_bad_logprob() -> None:
    assert speech._is_low_confidence(-1.5, "The second door of S3 coach is not closing properly.")


def test_confident_english_translation_is_accepted() -> None:
    assert not speech._is_low_confidence(-0.5, "The second door of S3 coach is not closing properly.")
