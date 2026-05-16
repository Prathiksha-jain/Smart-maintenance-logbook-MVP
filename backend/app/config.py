from pathlib import Path

from dotenv import dotenv_values


BACKEND_DIR = Path(__file__).resolve().parents[1]
ENV_FILE = BACKEND_DIR / ".env"
SUPPORTED_WHISPER_MODELS = {"tiny", "base", "small", "medium", "large"}


def _read_env() -> dict[str, str]:
    if not ENV_FILE.exists():
        return {}
    return {key: value for key, value in dotenv_values(ENV_FILE).items() if value is not None}


def _is_relative_to(path: Path, parent: Path) -> bool:
    try:
        path.relative_to(parent)
        return True
    except ValueError:
        return False


class Settings:
    def __init__(self) -> None:
        env = _read_env()
        self.backend_dir = BACKEND_DIR
        self.env_file = ENV_FILE
        self.app_name = env.get("APP_NAME", "Smart Maintenance Logbook API")
        self.app_env = env.get("APP_ENV", "local")
        self.backend_host = env.get("BACKEND_HOST", "127.0.0.1")
        self.backend_port = int(env.get("BACKEND_PORT", "8101"))
        self.frontend_origin = env.get("FRONTEND_ORIGIN", "http://127.0.0.1:3101")
        self.enable_whisper = env.get("ENABLE_WHISPER", "false").lower() == "true"
        self.whisper_model = env.get("WHISPER_MODEL", "small").lower()
        if self.whisper_model not in SUPPORTED_WHISPER_MODELS:
            raise ValueError("WHISPER_MODEL must be tiny, base, small, medium, or large.")

        self.data_dir = (self.backend_dir / "data").resolve()
        self.database_path = (self.data_dir / "smart_logbook.sqlite3").resolve()
        self.database_url = self._database_url(env.get("DATABASE_URL"))
        self.database_backend = self._database_backend(self.database_url)

        upload_dir = self._resolve_backend_path(env.get("UPLOAD_DIR", "./uploads"))
        self.upload_dir = upload_dir
        self.audio_upload_dir = (upload_dir / "audio").resolve()
        self.image_upload_dir = (upload_dir / "images").resolve()
        self.backend_bin_dir = (self.backend_dir / "bin").resolve()
        self.whisper_model_dir = (self.backend_dir / "models" / "whisper").resolve()

    def _resolve_backend_path(self, raw_path: str) -> Path:
        path = Path(raw_path)
        if not path.is_absolute():
            path = self.backend_dir / path
        resolved = path.resolve()
        if not _is_relative_to(resolved, self.backend_dir.resolve()):
            raise ValueError("Configured path must stay inside the backend directory.")
        return resolved

    def _database_url(self, configured_url: str | None) -> str:
        expected_url = f"sqlite:///{self.database_path.as_posix()}"
        if not configured_url:
            return expected_url

        if configured_url.startswith(("postgresql://", "postgresql+psycopg://")):
            return configured_url

        if not configured_url.startswith("sqlite:///"):
            raise ValueError("DATABASE_URL must use SQLite or PostgreSQL.")

        configured_path = Path(configured_url.removeprefix("sqlite:///"))
        if not configured_path.is_absolute():
            configured_path = self.backend_dir / configured_path

        if configured_path.resolve() != self.database_path:
            raise ValueError("SQLite database must be backend/data/smart_logbook.sqlite3.")

        return expected_url

    def _database_backend(self, database_url: str) -> str:
        if database_url.startswith("sqlite:///"):
            return "sqlite"
        if database_url.startswith(("postgresql://", "postgresql+psycopg://")):
            return "postgresql"
        return "unknown"


settings = Settings()
