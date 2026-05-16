# Smart Maintenance Logbook Web MVP

An isolated demo-ready MVP for railway inspection personnel. Inspectors can log defects from a transcript, attach audio/image evidence, supervisors can review and update status, and managers can view summary analytics.

## Safety And Isolation

- This project can use SQLite or a separate PostgreSQL database when explicitly configured.
- No Docker is used yet.
- No global settings or external project folders are required.
- Backend port: `127.0.0.1:8101`.
- Frontend port: `127.0.0.1:3101`.
- SQLite database path: `backend/data/smart_logbook.sqlite3`.
- PostgreSQL database name when enabled: `smart_maintenance_logbook`.
- Whisper transcription and English translation are optional and disabled by default with `ENABLE_WHISPER=false`. For better Hindi/Kannada accuracy, use `WHISPER_MODEL=small` or `WHISPER_MODEL=medium`.
- Upload folders:
  - `backend/uploads/audio/`
  - `backend/uploads/images/`

## Demo Users

The backend seeds these users automatically on startup:

| Role | Name | Employee ID |
| --- | --- | --- |
| Inspector | Ramesh Kumar | INS-001 |
| Supervisor | Suresh Patil | SUP-001 |
| Manager | Anita Rao | MGR-001 |

The frontend includes a simple demo role switcher in the dashboard header.

## Demo Seed Defects

The backend seeds these sample railway defect transcripts automatically:

1. `Coach S3 door number two is not closing properly and rubber lining is damaged.`
2. `Coach B2 brake pipe leakage near left side connection, needs urgent attention.`
3. `Coach A1 electrical panel has spark and smoke smell.`
4. `Coach S5 seat cushion is damaged near berth number 42.`

## Backend Setup

Open PowerShell from the repository root:

```powershell
cd backend
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

Optional PostgreSQL setup:

```powershell
python scripts\create_postgres_database.py --user postgres --password YOUR_PGADMIN_PASSWORD --database smart_maintenance_logbook
```

This creates only the separate project database and updates `backend/.env`.

Run the backend:

```powershell
uvicorn app.main:app --host 127.0.0.1 --port 8101 --reload
```

Check health:

```powershell
curl.exe http://127.0.0.1:8101/health
```

Run backend tests:

```powershell
pytest
```

## Frontend Setup

Open a second PowerShell window from the repository root:

```powershell
cd frontend
npm install
Copy-Item .env.local.example .env.local
npm run dev
```

Open:

```text
http://127.0.0.1:3101
```

Build the frontend:

```powershell
npm run build
```

## Demo Flow

1. Start the backend on `127.0.0.1:8101`.
2. Start the frontend on `127.0.0.1:3101`.
3. Open `/manager` first to show seeded analytics.
4. Switch the demo role to `Inspector`.
5. Open `/inspector`.
6. Use a sample transcript shortcut or type a new railway defect transcript.
7. Optionally record audio or upload an audio file. If Whisper is enabled, choose the audio language before submitting. Hindi/Kannada/English audio is translated to English before defect extraction.
8. Optionally upload an image.
9. Submit the defect and show the extracted component, defect type, severity, coach number, and generated defect code.
10. Switch the demo role to `Supervisor`.
11. Open `/supervisor`.
12. Select the newly created defect, review transcript/media, and update its status.
13. Switch the demo role to `Manager`.
14. Open `/manager` and show the updated summary and analytics.

## Useful API Checks

Create a defect:

```powershell
curl.exe -X POST "http://127.0.0.1:8101/api/defects" -H "Content-Type: application/json" -d '{"train_number":"12951","coach_number":"","location":"Platform 2","raw_transcript":"Coach B2 brake pipe leakage near left side connection, needs urgent attention.","created_by":1}'
```

Dashboard summary:

```powershell
curl.exe http://127.0.0.1:8101/api/dashboard/summary
```

Demo users:

```powershell
curl.exe http://127.0.0.1:8101/api/auth/demo-users
```

Transcribe and translate uploaded audio for a defect:

```powershell
curl.exe -X POST http://127.0.0.1:8101/api/defects/1/transcribe
```

## Troubleshooting

- If the frontend shows a backend connection error, confirm the backend is running on `127.0.0.1:8101`.
- If the frontend cannot start, run `npm install` again inside `frontend/`.
- If backend imports fail for file uploads, confirm `python-multipart` installed from `backend/requirements.txt`.
- If the SQLite database has old demo names, restart the backend once. The seed updates `INS-001`, `SUP-001`, and `MGR-001` to the named demo users.
- If you want a clean local demo database, stop the backend, delete only `backend/data/smart_logbook.sqlite3`, then restart the backend. Do not delete anything outside this repository.
- Do not use ports `3000`, `5000`, `8000`, `8501`, or `5432` for this MVP.

## Pending For Production

- Real authentication and authorization.
- Production database migration strategy.
- PostgreSQL and Docker only when explicitly requested later.
- Durable object storage for media.
- Production-ready speech-to-text deployment and audio runtime setup.
- Audit logs, notifications, assignment workflow, and richer reporting.
