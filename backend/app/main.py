from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .config import settings
from .database import init_db
from .routers import auth, dashboard, defects, media
from .schemas import HealthRead


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    init_db()
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=list({settings.frontend_origin, "http://127.0.0.1:3101", "http://localhost:3101"}),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

settings.upload_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")

app.include_router(auth.router)
app.include_router(defects.router)
app.include_router(media.router)
app.include_router(dashboard.router)


@app.get("/health", response_model=HealthRead)
def health_check() -> HealthRead:
    return {
        "status": "ok",
        "app": settings.app_name,
        "environment": settings.app_env,
        "database": settings.database_backend,
        "host": settings.backend_host,
        "port": settings.backend_port,
        "whisper_enabled": settings.enable_whisper,
    }
