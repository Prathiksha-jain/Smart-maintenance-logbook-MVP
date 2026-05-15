# Smart Maintenance Logbook Frontend

Next.js, TypeScript, and Tailwind CSS frontend for the Smart Maintenance Logbook MVP.

## Scope

- Frontend runs on `127.0.0.1:3101`.
- Backend API is expected at `http://127.0.0.1:8101`.
- Environment variables are read from `frontend/.env.local`.
- No backend logic, database, Docker, or global system settings are modified by this frontend.

## Setup

From the repository root:

```powershell
cd frontend
npm install
```

Create a local env file if needed:

```powershell
Copy-Item .env.local.example .env.local
```

## Run

```powershell
npm run dev
```

This starts Next.js at:

```text
http://127.0.0.1:3101
```

## Full Flow Test

1. Start the backend from `backend/`:

```powershell
uvicorn app.main:app --host 127.0.0.1 --port 8101 --reload
```

2. Start the frontend from `frontend/`:

```powershell
npm run dev
```

3. Open `http://127.0.0.1:3101/inspector`.
4. Enter a train number, location, and transcript such as:

```text
Brake pipe air leakage reported in coach B2 near the coupling.
```

5. Optionally record audio or upload an audio file, then upload an image.
6. Submit the defect and confirm the extracted component, severity, and defect code appear.
7. Open `http://127.0.0.1:3101/supervisor`.
8. Select the new defect, confirm transcript/media are visible, then update its status.
9. Open `http://127.0.0.1:3101/manager` and confirm summary cards and charts update.
