import re

from ..config import settings
from .extractor import ExtractedDefect, extract_defect_details, normalize_coach_number
from .llm_extractor import LLMExtractionError, extract_defect_details_with_llm


SEVERITY_RANK = {
    "Low": 0,
    "Medium": 1,
    "High": 2,
    "Critical": 3,
}


def extract_defect_details_smart(raw_transcript: str) -> ExtractedDefect:
    rule_based = extract_defect_details(raw_transcript)
    if not settings.enable_llm_extractor:
        return rule_based

    try:
        llm_based = extract_defect_details_with_llm(raw_transcript)
    except LLMExtractionError:
        return rule_based

    return _merge_extractions(raw_transcript, rule_based, llm_based)


def _merge_extractions(raw_transcript: str, rule_based: ExtractedDefect, llm_based: ExtractedDefect) -> ExtractedDefect:
    coach_number = _select_coach_number(raw_transcript, rule_based, llm_based)

    component_name = llm_based.component_name
    if component_name == "General" and rule_based.component_name != "General":
        component_name = rule_based.component_name

    severity = _highest_severity(rule_based.severity, llm_based.severity)

    defect_type = _polish_defect_type(llm_based.defect_type, component_name) or rule_based.defect_type
    description = _best_description(rule_based.description, llm_based.description)

    return ExtractedDefect(
        coach_number=coach_number,
        component_name=component_name,
        defect_type=defect_type,
        severity=severity,
        description=description,
    )


def _select_coach_number(raw_transcript: str, rule_based: ExtractedDefect, llm_based: ExtractedDefect) -> str | None:
    llm_coach = normalize_coach_number(llm_based.coach_number)
    if llm_coach and _coach_is_mentioned(raw_transcript, llm_coach):
        return llm_coach

    transcript_coach = normalize_coach_number(raw_transcript)
    return transcript_coach or rule_based.coach_number


def _coach_is_mentioned(raw_transcript: str, coach_number: str) -> bool:
    normalized = normalize_coach_number(coach_number)
    if normalized is None:
        return False

    coach_letter = normalized[0]
    coach_digits = normalized[1:]
    return re.search(rf"\b{coach_letter}\s*-?\s*{coach_digits}\b", raw_transcript, re.IGNORECASE) is not None


def _highest_severity(first: str, second: str) -> str:
    first_rank = SEVERITY_RANK.get(first, 0)
    second_rank = SEVERITY_RANK.get(second, 0)
    return first if first_rank >= second_rank else second


def _polish_defect_type(defect_type: str, component_name: str) -> str:
    cleaned = " ".join(defect_type.split()).strip(" .")
    if not cleaned:
        return ""

    primary_component = component_name.split("/")[0].split()[0]
    if component_name != "General" and primary_component.lower() not in cleaned.lower():
        cleaned = f"{primary_component} {cleaned}"

    return cleaned[:1].upper() + cleaned[1:]


def _best_description(rule_description: str, llm_description: str) -> str:
    cleaned = " ".join(llm_description.split()).strip()
    if len(cleaned.split()) < 6:
        return rule_description
    return cleaned
