from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import DefectLog
from ..schemas import DashboardBucket, DashboardSummary, DefectRead, Severity


router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def get_summary(db: Session = Depends(get_db)) -> DashboardSummary:
    return DashboardSummary(
        total_defects=_count_defects(db),
        open_defects=_count_defects(db, DefectLog.status == "Open"),
        in_progress_defects=_count_defects(db, DefectLog.status == "In Progress"),
        resolved_defects=_count_defects(db, DefectLog.status == "Resolved"),
        critical_defects=_count_defects(db, DefectLog.severity == "Critical"),
    )


@router.get("/defects-by-component", response_model=list[DashboardBucket])
def get_defects_by_component(db: Session = Depends(get_db)) -> list[DashboardBucket]:
    return _bucket_counts(db, DefectLog.component_name)


@router.get("/defects-by-status", response_model=list[DashboardBucket])
def get_defects_by_status(db: Session = Depends(get_db)) -> list[DashboardBucket]:
    return _bucket_counts(db, DefectLog.status)


@router.get("/recent-defects", response_model=list[DefectRead])
def get_recent_defects(
    severity: Severity | None = None,
    limit: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db),
) -> list[DefectLog]:
    statement = select(DefectLog).order_by(DefectLog.created_at.desc()).limit(limit)
    if severity:
        statement = statement.where(DefectLog.severity == severity)
    return list(db.scalars(statement))


def _count_defects(db: Session, *conditions) -> int:
    statement = select(func.count(DefectLog.id))
    for condition in conditions:
        statement = statement.where(condition)
    return int(db.scalar(statement) or 0)


def _bucket_counts(db: Session, field) -> list[DashboardBucket]:
    rows = db.execute(select(field, func.count(DefectLog.id)).group_by(field).order_by(field)).all()
    return [DashboardBucket(label=row[0] or "Unspecified", count=int(row[1])) for row in rows]
