import json

import pytest

from app.services.llm_extractor import LLMExtractionError, _parse_response


def test_parse_response_accepts_valid_structured_json() -> None:
    payload = {
        "coach_number": "S3",
        "component_name": "Door",
        "defect_type": "Door not closing",
        "severity": "Medium",
        "description": "Door number two of coach S3 is not closing properly.",
    }

    result = _parse_response(json.dumps(payload))

    assert result.coach_number == "S3"
    assert result.component_name == "Door"
    assert result.severity == "Medium"


def test_parse_response_rejects_invalid_component() -> None:
    payload = {
        "coach_number": "S3",
        "component_name": "Random Component",
        "defect_type": "Unknown",
        "severity": "Medium",
        "description": "Something is wrong.",
    }

    with pytest.raises(LLMExtractionError):
        _parse_response(json.dumps(payload))
