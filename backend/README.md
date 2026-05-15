# Smart Maintenance Logbook API

FastAPI backend MVP for the Smart Maintenance Logbook Web project.

## Scope

- SQLite only for the MVP.
- Database location: `backend/data/smart_logbook.sqlite3`.
- Uploads stay inside `backend/uploads/audio` and `backend/uploads/images`.
- Demo users are seeded automatically on startup.
- No PostgreSQL, Docker, or global system configuration is used.
- Whisper speech-to-text is optional and disabled by default.

## Setup

From the repository root:

```powershell
cd backend
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

## PostgreSQL Storage

SQLite remains available, but this backend can also use a separate PostgreSQL database.

Create only this project's PostgreSQL database:

```powershell
python scripts\create_postgres_database.py --user postgres --password YOUR_PGADMIN_PASSWORD --database smart_maintenance_logbook
```

The script:

- connects to the local PostgreSQL server,
- creates `smart_maintenance_logbook` if it does not exist,
- does not drop or modify other databases,
- updates only `backend/.env`.

After that, restart the backend. On startup, SQLAlchemy creates the project tables and seeds demo users/defects in the separate PostgreSQL database.

## Run

```powershell
uvicorn app.main:app --host 127.0.0.1 --port 8101 --reload
```

Open the API health endpoint:

```powershell
curl http://127.0.0.1:8101/health
```

## Tests

```powershell
pytest
```

## Optional Whisper Speech-To-Text

The MVP works without Whisper. By default:

```env
ENABLE_WHISPER=false
```

When disabled, this endpoint returns a clear message and does not modify the defect:

```powershell
curl -X POST http://127.0.0.1:8101/api/defects/1/transcribe
```

Response:

```json
{"message":"Whisper transcription is disabled for this environment.","defect":null}
```

To enable local Whisper later:

1. Install optional dependencies:

```powershell
python -m pip --python .\.venv install -r requirements-whisper.txt
```

2. Set `ENABLE_WHISPER=true` in `backend/.env`.
3. Restart the backend.

When enabled, `POST /api/defects/{id}/transcribe` finds the latest audio evidence for the defect, transcribes it, saves the transcript, re-runs the rule-based extractor, and updates the defect fields. Whisper model files are downloaded only inside `backend/models/whisper/`.

## Demo Users

The backend seeds these role-switching users:

- Ramesh Kumar, Inspector: `INS-001`
- Suresh Patil, Supervisor: `SUP-001`
- Anita Rao, Manager: `MGR-001`
- Admin Demo: `ADM-001`

The backend also seeds four sample railway defect transcripts so dashboards have useful demo data immediately.

Fetch them with:

```powershell
curl http://127.0.0.1:8101/api/auth/demo-users
```

## Useful API Checks

Create a defect:

```powershell
curl -X POST http://127.0.0.1:8101/api/defects -H "Content-Type: application/json" -d "{\"train_number\":\"12951\",\"coach_number\":\"\",\"location\":\"Platform 2\",\"raw_transcript\":\"Brake pipe air leakage reported in coach B2 near the coupling.\",\"created_by\":1}"
```

Upload audio:

```powershell
curl -X POST http://127.0.0.1:8101/api/defects/1/media/audio -F "file=@sample.webm"
```

Upload image:

```powershell
curl -X POST http://127.0.0.1:8101/api/defects/1/media/image -F "file=@sample.jpg"
```

Dashboard summary:

```powershell
curl http://127.0.0.1:8101/api/dashboard/summary
```
