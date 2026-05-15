
---

# 3. Create `AGENTS.md`

Create a file called `AGENTS.md` and paste this:

```md
# AGENTS.md

## Project Name

Smart Maintenance Logbook Web MVP

## Absolute Safety Rule

This repository must be treated as a fully isolated project.

You must not read, modify, delete, rename, or refactor any files outside this repository.

You must not touch any other project folders.

You must not modify any existing PostgreSQL database, existing Docker container, existing Docker volume, existing Docker network, existing .env file, or any global system configuration.

You must not run destructive commands.

Do not run commands like:
- rm -rf outside this repo
- docker system prune
- docker volume prune
- dropdb
- DROP DATABASE
- deleting existing databases
- modifying global PATH
- changing system services

If a command may affect anything outside this repo, do not run it.

## Project Purpose

Build a production-style web MVP for railway inspection personnel.

The system should allow inspectors to log defects using transcript/voice input and image evidence. The backend should extract structured maintenance details and store them in a database. Supervisors and managers should track defects through web dashboards.

## Build Strategy

Build incrementally.

Do not create an overcomplicated system in one step.

Order of work:

1. Backend MVP
2. Rule-based extractor
3. Media upload
4. Dashboard APIs
5. Frontend MVP
6. Demo role switcher
7. Audio recorder
8. UI polish
9. Optional Whisper integration later
10. Optional PostgreSQL/Docker later

## Isolation Requirements

Use SQLite for the MVP.

The SQLite database must be created only inside:

backend/data/smart_logbook.sqlite3

Uploads must be stored only inside:

backend/uploads/audio/
backend/uploads/images/

Environment variables must be loaded only from:

backend/.env
frontend/.env.local

Do not create or modify any .env file outside this repository.

Use isolated local ports:

Backend: 127.0.0.1:8101
Frontend: 127.0.0.1:3101

Do not use ports 3000, 5000, 8000, 8501, or 5432.

## Tech Stack

Backend:
- FastAPI
- SQLAlchemy
- SQLite
- Pydantic
- Uvicorn
- python-dotenv
- pytest

Frontend:
- Next.js
- TypeScript
- Tailwind CSS
- Fetch API or Axios
- Browser MediaRecorder API for audio recording

Storage:
- Local uploads folder for MVP
- Do not store binary audio/image data directly in the database

## Backend Folder Structure

Create:

backend/
  app/
    __init__.py
    main.py
    config.py
    database.py
    models.py
    schemas.py
    routers/
      __init__.py
      auth.py
      defects.py
      media.py
      dashboard.py
    services/
      __init__.py
      extractor.py
      storage.py
    tests/
      test_extractor.py
  data/
    .gitkeep
  uploads/
    audio/
      .gitkeep
    images/
      .gitkeep
  requirements.txt
  .env.example
  README.md

## Frontend Folder Structure

Create:

frontend/
  app/
    layout.tsx
    page.tsx
    inspector/
      page.tsx
    supervisor/
      page.tsx
    manager/
      page.tsx
  components/
    AppShell.tsx
    Sidebar.tsx
    StatCard.tsx
    DefectForm.tsx
    DefectTable.tsx
    AudioRecorder.tsx
    ImageUpload.tsx
  lib/
    api.ts
    types.ts
  .env.local.example
  package.json
  README.md

## Backend Entities

### User

Fields:
- id
- name
- employee_id
- role
- password_hash
- created_at

Roles:
- inspector
- supervisor
- manager
- admin

### DefectLog

Fields:
- id
- defect_code
- train_number
- coach_number
- component_name
- defect_type
- severity
- description
- raw_transcript
- translated_text
- status
- location
- created_by
- created_at
- updated_at

### MediaFile

Fields:
- id
- defect_id
- file_type
- file_path
- original_filename
- uploaded_at

file_type must be:
- audio
- image

### StatusHistory

Fields:
- id
- defect_id
- old_status
- new_status
- remarks
- updated_by
- updated_at

## API Requirements

Create these APIs:

### Health

GET /health

### Defects

POST /api/defects
GET /api/defects
GET /api/defects/{id}
PATCH /api/defects/{id}/status

### Media

POST /api/defects/{id}/media/audio
POST /api/defects/{id}/media/image
GET /api/defects/{id}/media

### Dashboard

GET /api/dashboard/summary
GET /api/dashboard/defects-by-component
GET /api/dashboard/defects-by-status
GET /api/dashboard/recent-defects

### Demo Auth

GET /api/auth/demo-users

For MVP, use demo users and role switching. Do not implement complex authentication yet.

## Defect Creation Logic

When POST /api/defects is called:

1. Accept train_number, coach_number, location, raw_transcript, created_by.
2. Run rule-based extractor on raw_transcript.
3. Extract:
   - coach_number if missing
   - component_name
   - defect_type
   - severity
   - description
4. Generate defect_code in format:
   DEF-YYYYMMDD-0001
5. Store defect with status Open.
6. Return the full created defect.

## Rule-Based Extractor

Create backend/app/services/extractor.py.

Input:

raw_transcript: string

Output:

- coach_number
- component_name
- defect_type
- severity
- description

Rules:

Coach detection:
- Detect patterns like S1, S2, S3, B1, B2, A1, A2, D1, C1.
- Normalize lowercase to uppercase.
- Normalize S-3 as S3.

Component rules:
- door, gate, lock, hinge, closing -> Door
- brake, brake pipe, pressure, air leakage -> Brake System
- wheel, axle, bearing, crack -> Wheel Assembly
- fan, light, wire, spark, electrical, panel -> Electrical System
- seat, berth, cushion -> Seat/Berth
- toilet, tap, flush, water -> Toilet/Water System
- window, glass -> Window
- leakage, leak, water leak -> Leakage/Plumbing

Severity rules:
- Critical if text contains brake leakage, wheel crack, smoke, fire, electrical spark
- High if text contains leakage, broken, not working, jammed, crack
- Medium if text contains loose, damaged, not closing, faulty
- Low otherwise

Defect type:
- Create short defect type based on detected component and keywords.
- Example: Door not closing, Brake leakage, Wheel crack, Electrical fault.

## Media Upload Rules

Audio allowed:
- wav
- mp3
- m4a
- webm

Images allowed:
- jpg
- jpeg
- png
- webp

Rules:
- Save files only inside backend/uploads/audio or backend/uploads/images.
- Store only file path and metadata in database.
- Do not store raw binary in database.
- Validate extensions.
- Use safe filenames.
- Return clear errors.

## Frontend UI Requirements

Use a clean professional dashboard UI.

Design style:
- Slate background
- White cards
- Rounded corners
- Subtle borders
- Clean sidebar
- Good spacing
- Professional admin-dashboard look
- Responsive layout

## Frontend Pages

### Home Page

Redirect or link to:
- Inspector
- Supervisor
- Manager

### Inspector Page

Must include:
- role indicator
- train number input
- coach number input
- location input
- transcript textarea
- audio recorder
- audio file upload fallback
- image upload with preview
- submit defect button
- extracted result display after submission

### Supervisor Page

Must include:
- summary cards
- defect table
- filters by status, severity, component
- image preview
- audio playback
- transcript display
- status update dropdown

### Manager Page

Must include:
- total defects
- open defects
- in-progress defects
- resolved defects
- critical defects
- defects by component
- defects by status
- recent critical defects

## Environment Files

Create backend/.env.example:

APP_NAME=Smart Maintenance Logbook API
APP_ENV=local
DATABASE_URL=sqlite:///./data/smart_logbook.sqlite3
UPLOAD_DIR=./uploads
BACKEND_HOST=127.0.0.1
BACKEND_PORT=8101
FRONTEND_ORIGIN=http://127.0.0.1:3101

Create frontend/.env.local.example:

NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8101

Do not create real secret values.

## Testing

Add pytest tests for extractor.

Tests should cover:
- door defect
- brake leakage critical defect
- wheel crack critical defect
- electrical spark critical defect
- seat damage
- coach number normalization

## Quality Requirements

- Keep code readable and modular.
- Add error handling.
- Add CORS only for http://127.0.0.1:3101.
- Add setup instructions.
- Add sample demo data.
- Do not over-engineer.
- Do not add Docker or PostgreSQL until explicitly requested later.