from __future__ import annotations

import argparse
from pathlib import Path
from urllib.parse import quote_plus

import psycopg
from psycopg import sql


BACKEND_DIR = Path(__file__).resolve().parents[1]
ENV_FILE = BACKEND_DIR / ".env"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Create a separate PostgreSQL database for this project and update backend/.env."
    )
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", default="5432")
    parser.add_argument("--admin-db", default="postgres")
    parser.add_argument("--user", default="postgres")
    parser.add_argument("--password", required=True)
    parser.add_argument("--database", default="smart_maintenance_logbook")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    admin_conninfo = (
        f"host={args.host} port={args.port} dbname={args.admin_db} "
        f"user={args.user} password={args.password}"
    )

    with psycopg.connect(admin_conninfo, autocommit=True) as conn:
        exists = conn.execute(
            "select 1 from pg_database where datname = %s",
            (args.database,),
        ).fetchone()
        if exists is None:
            conn.execute(sql.SQL("create database {}").format(sql.Identifier(args.database)))
            print(f"Created PostgreSQL database: {args.database}")
        else:
            print(f"PostgreSQL database already exists: {args.database}")

    database_url = (
        "postgresql+psycopg://"
        f"{quote_plus(args.user)}:{quote_plus(args.password)}"
        f"@{args.host}:{args.port}/{quote_plus(args.database)}"
    )
    update_env(database_url)
    print(f"Updated {ENV_FILE} to use PostgreSQL.")


def update_env(database_url: str) -> None:
    lines: list[str]
    if ENV_FILE.exists():
        lines = ENV_FILE.read_text(encoding="utf-8").splitlines()
    else:
        lines = [
            "APP_NAME=Smart Maintenance Logbook API",
            "APP_ENV=local",
            "UPLOAD_DIR=./uploads",
            "BACKEND_HOST=127.0.0.1",
            "BACKEND_PORT=8101",
            "FRONTEND_ORIGIN=http://127.0.0.1:3101",
            "ENABLE_WHISPER=true",
        ]

    found = False
    next_lines = []
    for line in lines:
        if line.startswith("DATABASE_URL="):
            next_lines.append(f"DATABASE_URL={database_url}")
            found = True
        else:
            next_lines.append(line)

    if not found:
        next_lines.insert(2, f"DATABASE_URL={database_url}")

    ENV_FILE.write_text("\n".join(next_lines) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
