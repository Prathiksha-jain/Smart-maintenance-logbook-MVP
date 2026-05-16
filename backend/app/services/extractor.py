from dataclasses import dataclass
import re


@dataclass(frozen=True)
class ExtractedDefect:
    coach_number: str | None
    component_name: str
    defect_type: str
    severity: str
    description: str


COACH_PATTERN = re.compile(r"\b([SBADC])\s*-?\s*(\d{1,2})\b", re.IGNORECASE)

COMPONENT_RULES: list[tuple[str, tuple[str, ...]]] = [
    ("Brake System", ("brake pipe", "air leakage", "brake", "pressure")),
    ("Wheel Assembly", ("wheel", "axle", "bearing", "crack")),
    ("Electrical System", ("fan", "light", "wire", "spark", "electrical", "panel")),
    ("Door", ("door", "gate", "lock", "hinge", "closing", "closed", "close", "दरवाजा", "दरवाज़ा")),
    ("Seat/Berth", ("seat", "berth", "cushion")),
    ("Toilet/Water System", ("toilet", "tap", "flush", "water")),
    ("Window", ("window", "glass")),
    ("Leakage/Plumbing", ("water leak", "leakage", "leak")),
]

COACH_TEXT_REPLACEMENTS = (
    ("एस", "S"),
    ("बी", "B"),
    ("ए", "A"),
    ("डी", "D"),
    ("सी", "C"),
    ("ಎಸ್", "S"),
    ("ಬಿ", "B"),
    ("ಎ", "A"),
    ("ಡಿ", "D"),
    ("ಸಿ", "C"),
)

DOOR_CLOSING_PATTERNS = (
    "not closing",
    "not close",
    "not closed",
    "does not close",
    "doesn't close",
    "cannot close",
    "can't close",
    "wont close",
    "won't close",
    "not shut",
    "properly closed",
    "closed by the team",
    "बंद नहीं",
    "बन्द नहीं",
    "बंद नही",
    "band nahi",
    "band nahin",
)


def normalize_coach_number(value: str | None) -> str | None:
    if not value:
        return None
    match = COACH_PATTERN.search(_normalize_coach_aliases(value))
    if match is None:
        return None
    return f"{match.group(1).upper()}{match.group(2)}"


def normalize_translated_defect_text(raw_transcript: str, translated_text: str | None = None) -> str | None:
    combined = " ".join(part for part in (translated_text, raw_transcript) if part).strip()
    if not combined:
        return None

    text = _normalize_text(combined)
    component_name = _detect_component(text)
    coach_number = normalize_coach_number(combined)

    if component_name == "Door" and _is_door_closing_issue(text):
        door_reference = _detect_door_reference(text)
        coach_prefix = f"Coach {coach_number} " if coach_number else ""
        return f"{coach_prefix}{door_reference} is not closing properly."

    return translated_text.strip() if translated_text else None


def extract_defect_details(raw_transcript: str) -> ExtractedDefect:
    text = _normalize_text(raw_transcript)
    coach_number = normalize_coach_number(raw_transcript)
    component_name = _detect_component(text)
    severity = _detect_severity(text)
    defect_type = _detect_defect_type(text, component_name)
    description = raw_transcript.strip()

    return ExtractedDefect(
        coach_number=coach_number,
        component_name=component_name,
        defect_type=defect_type,
        severity=severity,
        description=description or "No description provided.",
    )


def _normalize_text(value: str) -> str:
    return re.sub(r"\s+", " ", _normalize_coach_aliases(value).lower()).strip()


def _normalize_coach_aliases(value: str) -> str:
    normalized = value
    for source, replacement in COACH_TEXT_REPLACEMENTS:
        normalized = normalized.replace(source, replacement)
    return normalized


def _contains_any(text: str, keywords: tuple[str, ...]) -> bool:
    return any(keyword in text for keyword in keywords)


def _detect_component(text: str) -> str:
    for component, keywords in COMPONENT_RULES:
        if _contains_any(text, keywords):
            return component
    return "General"


def _detect_severity(text: str) -> str:
    if (
        "brake leakage" in text
        or ("brake" in text and "leak" in text)
        or "wheel crack" in text
        or ("wheel" in text and "crack" in text)
        or "smoke" in text
        or "fire" in text
        or "electrical spark" in text
        or ("electrical" in text and "spark" in text)
    ):
        return "Critical"

    if _contains_any(text, ("leakage", "broken", "not working", "jammed", "crack")):
        return "High"

    if _contains_any(text, ("loose", "damaged", "faulty")) or _is_door_closing_issue(text):
        return "Medium"

    return "Low"


def _detect_defect_type(text: str, component_name: str) -> str:
    if component_name == "Door":
        if _is_door_closing_issue(text):
            return "Door not closing"
        if "jammed" in text:
            return "Door jammed"
        if "lock" in text:
            return "Door lock issue"
        return "Door defect"

    if component_name == "Brake System":
        if "leak" in text or "air leakage" in text:
            return "Brake leakage"
        if "pressure" in text:
            return "Brake pressure issue"
        return "Brake system defect"

    if component_name == "Wheel Assembly":
        if "crack" in text:
            return "Wheel crack"
        if "bearing" in text:
            return "Bearing defect"
        return "Wheel assembly defect"

    if component_name == "Electrical System":
        if "spark" in text:
            return "Electrical spark"
        if "light" in text:
            return "Lighting fault"
        if "fan" in text:
            return "Fan fault"
        return "Electrical fault"

    if component_name == "Seat/Berth":
        if "damaged" in text or "broken" in text or "cushion" in text:
            return "Seat damage"
        return "Seat/Berth defect"

    if component_name == "Toilet/Water System":
        if "flush" in text:
            return "Flush fault"
        if "tap" in text:
            return "Tap fault"
        return "Toilet/Water fault"

    if component_name == "Window":
        if "glass" in text:
            return "Window glass damage"
        return "Window defect"

    if component_name == "Leakage/Plumbing":
        return "Water leakage"

    return "General defect"


def _is_door_closing_issue(text: str) -> bool:
    return any(pattern in text for pattern in DOOR_CLOSING_PATTERNS)


def _detect_door_reference(text: str) -> str:
    if (
        "second door" in text
        or "door number two" in text
        or "door no 2" in text
        or "door no. 2" in text
        or "2nd door" in text
        or "दूसरा" in text
    ):
        return "door number two"
    return "door"
