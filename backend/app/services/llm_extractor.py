import json
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from pydantic import BaseModel, Field, ValidationError

from ..config import settings
from .extractor import ExtractedDefect, normalize_coach_number


class LLMExtractionError(RuntimeError):
    pass


ALLOWED_COMPONENTS = (
    "Door",
    "Brake System",
    "Wheel Assembly",
    "Electrical System",
    "Seat/Berth",
    "Toilet/Water System",
    "Window",
    "Leakage/Plumbing",
    "General",
)
ALLOWED_SEVERITIES = ("Low", "Medium", "High", "Critical")

EXTRACTION_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "coach_number": {
            "anyOf": [{"type": "string"}, {"type": "null"}],
            "description": "Final intended coach code such as S3, B2, A1, D1, or null if not present.",
        },
        "component_name": {"type": "string", "enum": list(ALLOWED_COMPONENTS)},
        "defect_type": {
            "type": "string",
            "description": "Short maintenance defect type, for example Door not closing or Brake leakage.",
        },
        "severity": {"type": "string", "enum": list(ALLOWED_SEVERITIES)},
        "description": {
            "type": "string",
            "description": "One clear English sentence describing the observed defect.",
        },
    },
    "required": ["coach_number", "component_name", "defect_type", "severity", "description"],
    "additionalProperties": False,
}


class LLMExtractionPayload(BaseModel):
    coach_number: str | None = None
    component_name: str
    defect_type: str = Field(min_length=1, max_length=120)
    severity: str
    description: str = Field(min_length=1, max_length=500)


def extract_defect_details_with_llm(raw_transcript: str) -> ExtractedDefect:
    transcript = raw_transcript.strip()
    if not transcript:
        raise LLMExtractionError("Transcript is empty.")

    response = _call_ollama(transcript)
    parsed = _parse_response(response)
    return ExtractedDefect(
        coach_number=normalize_coach_number(parsed.coach_number),
        component_name=parsed.component_name,
        defect_type=parsed.defect_type.strip(),
        severity=parsed.severity,
        description=parsed.description.strip(),
    )


def _call_ollama(transcript: str) -> str:
    payload = {
        "model": settings.ollama_model,
        "stream": False,
        "format": EXTRACTION_SCHEMA,
        "options": {
            "temperature": 0,
            "num_predict": 220,
        },
        "prompt": _build_prompt(transcript),
    }

    request = Request(
        f"{settings.ollama_base_url}/api/generate",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urlopen(request, timeout=settings.ollama_timeout_seconds) as response:
            body = json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        raise LLMExtractionError(f"Ollama returned HTTP {exc.code}.") from exc
    except (TimeoutError, URLError, json.JSONDecodeError) as exc:
        raise LLMExtractionError(f"Ollama extraction failed: {exc}") from exc

    model_response = body.get("response")
    if not isinstance(model_response, str) or not model_response.strip():
        raise LLMExtractionError("Ollama returned an empty extraction response.")
    return model_response


def _build_prompt(transcript: str) -> str:
    return f"""
You are extracting railway maintenance defect details from an inspector transcript.

Return only valid JSON matching the provided schema.
Do not invent a coach number if it is not present.
If the inspector corrects themself, choose the final corrected coach/component/issue, not the earlier rejected one.
Examples of correction language include sorry, not that coach, actually, instead, correction, I mean, or "not X, it is Y".
Use only these component names: {", ".join(ALLOWED_COMPONENTS)}.
Use only these severity values: {", ".join(ALLOWED_SEVERITIES)}.
Make defect_type short but complete, and include the component when useful, for example:
- Door not closing
- Brake leakage
- Wheel crack
- Electrical spark
- Seat cushion damage
Make description one complete English sentence that keeps the coach, component, and issue when available.

Severity guidance:
- Critical: brake leakage, wheel crack, smoke, fire, electrical spark, safety-critical issue.
- High: major leakage, broken component, jammed component, not working, visible crack.
- Medium: damaged, loose, faulty, not closing properly.
- Low: minor/general observation.

Transcript:
{transcript}
""".strip()


def _parse_response(response_text: str) -> LLMExtractionPayload:
    try:
        data = json.loads(response_text)
        payload = LLMExtractionPayload.model_validate(data)
    except (json.JSONDecodeError, ValidationError) as exc:
        raise LLMExtractionError("Ollama did not return valid structured defect JSON.") from exc

    if payload.component_name not in ALLOWED_COMPONENTS:
        raise LLMExtractionError("Ollama returned an unsupported component name.")
    if payload.severity not in ALLOWED_SEVERITIES:
        raise LLMExtractionError("Ollama returned an unsupported severity.")
    return payload
