# Student Skill Workshops — Backend

Express REST API for the workshop management frontend. Data is stored in `data/database.json` (created on first run with seed data).

## Requirements

- Node.js 18+

## Install

```powershell
cd "c:\Users\sai krishana\Downloads\student skill work shops_backend"
npm install
```

## Run

```powershell
npm start
```

The API base URL is `http://localhost:4010` (port **4010** avoids conflicts with other tools that use 4000).

### Admin authentication

Default admin password is **`admin123`** unless you set **`ADMIN_PASSWORD`** in the environment.

- Sign in from the frontend **Admin** tab uses `POST /api/admin/login`.
- Protected routes expect header **`X-Admin-Password`** with the same value.

Example (PowerShell):

```powershell
$env:ADMIN_PASSWORD="MySecret"; npm start
```

### File uploads

Uploaded files are saved under `uploads/` and served at `http://localhost:4010/uploads/...`.

For auto-reload on file changes (Node 20+ / 22+):

```powershell
npm run dev
```

## Endpoints

- `GET /api/health` — health check
- `GET /api/workshops` — list workshops
- `POST /api/workshops` — create workshop (body: title, trainer, date, time, duration, level, capacity, description)
- `GET /api/materials` — list training materials
- `POST /api/materials` — add material (body: workshopId, name, type, link)
- `GET /api/post-training-resources` — list post-training resources
- `POST /api/registrations` — register (body: name, email, workshopId)
- `GET /api/registrations?email=...` — current user’s registrations

## With the frontend

1. Start this backend: `npm start`
2. In the frontend folder, start Vite: `npm run dev` (the dev server proxies `/api` to this backend)
3. Open the URL shown by Vite (for example `http://localhost:5173`)

Optional: set `PORT=5000` in the environment to run on a different port; then update the proxy `target` in the frontend `vite.config.js` to match.
