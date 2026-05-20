# Smart Maintenance Logbook API

FastAPI backend MVP for the Smart Maintenance Logbook Web project.

## Scope

- SQLite is available for the MVP, and a separate project PostgreSQL database can be enabled when needed.
- SQLite database location: `backend/data/smart_logbook.sqlite3`.
- Uploads stay inside `backend/uploads/audio` and `backend/uploads/images`.
- Demo users are seeded automatically on startup.
- No Docker or global system configuration is used.
- Whisper speech-to-text/English translation is optional and disabled by default.
- Ollama LLM extraction is optional and falls back to the rule-based extractor if Ollama is unavailable.

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
WHISPER_MODEL=small
WHISPER_NON_ENGLISH_MODEL=medium
ENABLE_LLM_EXTRACTOR=false
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.2:latest
OLLAMA_TIMEOUT_SECONDS=45
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
pip install -r requirements-whisper.txt
```

2. Set `ENABLE_WHISPER=true` in `backend/.env`.
3. Restart the backend.

When enabled, `POST /api/defects/{id}/transcribe` finds the latest audio evidence for the defect, transcribes it, translates the audio to English when needed, saves the original transcript and English translation, re-runs the rule-based extractor on the English text, and updates the defect fields. Send `{"source_language":"hi"}` for Hindi, `{"source_language":"kn"}` for Kannada, `{"source_language":"en"}` for English, or `{"source_language":"auto"}` for auto-detect.

`WHISPER_MODEL` controls English audio. `WHISPER_NON_ENGLISH_MODEL` controls auto-detect, Hindi, and Kannada audio. The default keeps English on `small` for speed and uses `medium` for non-English accuracy. This is general model selection, not phrase hardcoding. Whisper model files are downloaded only inside `backend/models/whisper/`.

If Whisper is unsure, the backend still saves the raw transcript and English translation, but it does not overwrite the structured defect fields with low-confidence text.

## Optional Ollama LLM Extraction

The backend can use a local Ollama model to extract structured defect details from transcript text. Whisper still handles audio-to-text. The default UI flow uses fast rule-based extraction first, and the Inspector page can call a separate slower smart refinement step with Ollama.

Enable it in `backend/.env`:

```env
ENABLE_LLM_EXTRACTOR=true
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.2:latest
```

The LLM must return strict JSON with `coach_number`, `component_name`, `defect_type`, `severity`, and `description`. The backend validates the JSON, protects detected critical severity, and falls back to the existing rule-based extractor if Ollama is off, slow, missing, or returns invalid output.

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
