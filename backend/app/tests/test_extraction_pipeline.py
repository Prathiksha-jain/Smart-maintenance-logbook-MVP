from app.services.extractor import ExtractedDefect
from app.services import extraction_pipeline


def test_smart_extractor_uses_rule_based_when_llm_disabled(monkeypatch) -> None:
    monkeypatch.setattr(extraction_pipeline.settings, "enable_llm_extractor", False)

    result = extraction_pipeline.extract_defect_details_smart("Coach B2 brake pipe leakage near left connection.")

    assert result.coach_number == "B2"
    assert result.component_name == "Brake System"
    assert result.severity == "Critical"


def test_smart_extractor_uses_valid_llm_output(monkeypatch) -> None:
    monkeypatch.setattr(extraction_pipeline.settings, "enable_llm_extractor", True)

    def fake_llm(_transcript: str) -> ExtractedDefect:
        return ExtractedDefect(
            coach_number="S3",
            component_name="Door",
            defect_type="Door alignment fault",
            severity="Medium",
            description="Door number two of coach S3 is not aligning and closing properly.",
        )

    monkeypatch.setattr(extraction_pipeline, "extract_defect_details_with_llm", fake_llm)

    result = extraction_pipeline.extract_defect_details_smart("S3 coach second doorway alignment issue.")

    assert result.coach_number == "S3"
    assert result.component_name == "Door"
    assert result.defect_type == "Door alignment fault"


def test_smart_extractor_falls_back_when_llm_fails(monkeypatch) -> None:
    monkeypatch.setattr(extraction_pipeline.settings, "enable_llm_extractor", True)

    def broken_llm(_transcript: str) -> ExtractedDefect:
        raise extraction_pipeline.LLMExtractionError("Ollama is unavailable.")

    monkeypatch.setattr(extraction_pipeline, "extract_defect_details_with_llm", broken_llm)

    result = extraction_pipeline.extract_defect_details_smart("Coach A1 electrical panel has spark and smoke smell.")

    assert result.coach_number == "A1"
    assert result.component_name == "Electrical System"
    assert result.defect_type == "Electrical spark"
    assert result.severity == "Critical"


def test_smart_extractor_does_not_downgrade_rule_based_critical(monkeypatch) -> None:
    monkeypatch.setattr(extraction_pipeline.settings, "enable_llm_extractor", True)

    def low_llm(_transcript: str) -> ExtractedDefect:
        return ExtractedDefect(
            coach_number="B2",
            component_name="Brake System",
            defect_type="Brake pipe issue",
            severity="Low",
            description="Brake pipe leakage reported in coach B2.",
        )

    monkeypatch.setattr(extraction_pipeline, "extract_defect_details_with_llm", low_llm)

    result = extraction_pipeline.extract_defect_details_smart("Coach B2 brake pipe leakage near left side connection.")

    assert result.severity == "Critical"


def test_smart_extractor_can_use_llm_corrected_coach_when_mentioned(monkeypatch) -> None:
    monkeypatch.setattr(extraction_pipeline.settings, "enable_llm_extractor", True)

    def corrected_llm(_transcript: str) -> ExtractedDefect:
        return ExtractedDefect(
            coach_number="S6",
            component_name="Seat/Berth",
            defect_type="Seat cushion damage",
            severity="Medium",
            description="Coach S6 has a damaged seat cushion that needs replacement.",
        )

    monkeypatch.setattr(extraction_pipeline, "extract_defect_details_with_llm", corrected_llm)

    result = extraction_pipeline.extract_defect_details_smart(
        "In coach A5, sorry, not in coach A5, it is in coach S6, "
        "there is a problem in the seat cushion which is damaged and needs to be replaced."
    )

    assert result.coach_number == "S6"
    assert result.component_name == "Seat/Berth"
    assert result.defect_type == "Seat cushion damage"


def test_smart_extractor_rejects_llm_coach_that_was_not_mentioned(monkeypatch) -> None:
    monkeypatch.setattr(extraction_pipeline.settings, "enable_llm_extractor", True)

    def invented_llm(_transcript: str) -> ExtractedDefect:
        return ExtractedDefect(
            coach_number="S9",
            component_name="Seat/Berth",
            defect_type="Seat cushion damage",
            severity="Medium",
            description="Coach S9 has a damaged seat cushion that needs replacement.",
        )

    monkeypatch.setattr(extraction_pipeline, "extract_defect_details_with_llm", invented_llm)

    result = extraction_pipeline.extract_defect_details_smart(
        "In coach A5, there is a problem in the seat cushion which is damaged."
    )

    assert result.coach_number == "A5"
