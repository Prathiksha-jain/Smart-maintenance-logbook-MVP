# Demo Script: Smart Maintenance Logbook Web MVP

Use this script to present the MVP to the team in about 8 to 10 minutes.

## 1. Opening Context

Say:

> This is a local, isolated Smart Maintenance Logbook MVP for railway inspection teams. It uses FastAPI, SQLAlchemy, PostgreSQL or SQLite, Next.js, TypeScript, and Tailwind. For this demo, Docker is not used and all app work stays inside this project folder.

Mention the ports:

- Backend: `127.0.0.1:8101`
- Frontend: `127.0.0.1:3101`

## 2. Start The Apps

Backend terminal:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --host 127.0.0.1 --port 8101 --reload
```

Frontend terminal:

```powershell
cd frontend
npm run dev
```

Open:

```text
http://127.0.0.1:3101
```

## 3. Show Demo Users

Point to the role switcher in the header.

Say:

> The MVP uses demo role switching instead of full login. The seeded users are Ramesh Kumar as Inspector, Suresh Patil as Supervisor, and Anita Rao as Manager.

## 4. Manager Opening View

Open `/manager`.

Show:

- Total defects
- Open defects
- In-progress defects
- Resolved defects
- Critical defects
- Defects by component
- Defects by status
- Recent critical defects

Say:

> The backend seeds realistic railway defects so the dashboard is meaningful immediately.

## 5. Inspector Flow

Switch role to `Inspector`, then open `/inspector`.

Use this transcript:

```text
Coach B2 brake pipe leakage near left side connection, needs urgent attention.
```

Optionally choose the audio language, then record a short audio clip in English, Hindi, or Kannada. Optionally upload an image.

Click `Submit defect`.

Show:

- Generated defect code
- Normalized coach number
- Component
- Defect type
- Severity
- Status

Say:

> The rule-based extractor turns unstructured maintenance language into structured fields. For this transcript, it identifies brake system, brake leakage, and critical severity.

If audio is used, say:

> Whisper transcribes the recorded audio, translates it to English when needed, and then the extractor runs on the English text.

## 6. Supervisor Flow

Switch role to `Supervisor`, then open `/supervisor`.

Show:

- Summary cards
- Filters by status, severity, and component
- Defect table
- Detail panel
- Transcript
- Audio and image evidence areas

Select the newly created defect.

Change status to `In Progress` or `Resolved`, add a short remark, and save.

Say:

> The supervisor can review the evidence and move the defect through the workflow.

## 7. Manager Follow-Up

Switch role to `Manager`, then open `/manager`.

Show that counts and analytics reflect the current backend data.

Say:

> This gives managers an operational view of defect volume and critical issues by component and status.

## 8. Close With Scope

Say:

> This is intentionally MVP-sized. It proves the core inspection flow: transcript capture, rule-based extraction, evidence upload, supervisor review, and manager analytics.

Production next steps:

- Real authentication and role permissions.
- Database migrations and Docker when approved.
- Production speech-to-text runtime hardening.
- File storage hardening.
- Audit logs and notifications.
- Assignment workflow and reporting exports.
