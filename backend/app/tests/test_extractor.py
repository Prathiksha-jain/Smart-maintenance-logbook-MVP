from app.services.extractor import extract_defect_details, normalize_coach_number


def test_door_defect() -> None:
    result = extract_defect_details("Coach s-3 door is not closing near the hinge.")

    assert result.coach_number == "S3"
    assert result.component_name == "Door"
    assert result.defect_type == "Door not closing"
    assert result.severity == "Medium"


def test_brake_leakage_critical_defect() -> None:
    result = extract_defect_details("Brake pipe air leakage reported in B2.")

    assert result.coach_number == "B2"
    assert result.component_name == "Brake System"
    assert result.defect_type == "Brake leakage"
    assert result.severity == "Critical"


def test_wheel_crack_critical_defect() -> None:
    result = extract_defect_details("Wheel crack found near axle in A1.")

    assert result.coach_number == "A1"
    assert result.component_name == "Wheel Assembly"
    assert result.defect_type == "Wheel crack"
    assert result.severity == "Critical"


def test_electrical_spark_critical_defect() -> None:
    result = extract_defect_details("Electrical spark from panel in D1.")

    assert result.coach_number == "D1"
    assert result.component_name == "Electrical System"
    assert result.defect_type == "Electrical spark"
    assert result.severity == "Critical"


def test_seat_damage() -> None:
    result = extract_defect_details("Seat cushion damaged in C1.")

    assert result.coach_number == "C1"
    assert result.component_name == "Seat/Berth"
    assert result.defect_type == "Seat damage"
    assert result.severity == "Medium"


def test_coach_number_normalization() -> None:
    assert normalize_coach_number("s-3") == "S3"
    assert normalize_coach_number("coach b 2") == "B2"
    assert normalize_coach_number("A1") == "A1"


def test_coach_number_ignores_text_without_real_coach_code() -> None:
    result = extract_defect_details("A physical panel had started sparking but there was continuous noise.")

    assert result.coach_number is None
    assert normalize_coach_number("A physical panel had started sparking") is None


def test_door_not_closed_maps_to_not_closing() -> None:
    result = extract_defect_details("The second door of S3 coach is not closed properly.")

    assert result.coach_number == "S3"
    assert result.component_name == "Door"
    assert result.defect_type == "Door not closing"
    assert result.severity == "Medium"
