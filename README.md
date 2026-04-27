# Workshop Platform Frontend

Frontend application for an online workshop and training management system.

## Features

- **Learner:** workshop cards with search/filter, calendar view, optional saved email, registration confirmation message, materials (links + uploads), post-training resources.
- **Admin:** password sign-in (header `X-Admin-Password`), create workshops, enrollment summary, **all registrations table**, add materials by URL or **file upload**.
- **UI:** header/footer branding, DM Sans typography, light/dark theme toggle.
- **Production:** set `VITE_API_URL` for `npm run preview`; dev uses Vite proxy to the backend (`/api` and `/uploads`).

## Run locally (with API)

1. **Backend (required):** in `student skill work shops_backend` run `npm install` then `npm start` (listens on port **4010**).
2. **Frontend:** in this folder:
   - `npm install`
   - `npm run dev`

Vite proxies `/api` to `http://127.0.0.1:4010`, so open the local URL (for example `http://localhost:5173`) in your browser.

If the backend is not running, the app shows an error until you start it.

### Production preview without proxy

Set `VITE_API_URL=http://localhost:4010` (for example in a `.env` file), run `npm run build` and `npm run preview`, and keep the backend running.
