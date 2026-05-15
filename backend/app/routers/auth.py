from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User
from ..schemas import UserRead


router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.get("/demo-users", response_model=list[UserRead])
def list_demo_users(db: Session = Depends(get_db)) -> list[User]:
    return list(db.scalars(select(User).order_by(User.id)))
