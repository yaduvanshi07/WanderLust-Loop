## Deployment Guide (Vercel frontend, Render backend & ML services)

This repo is an Express/EJS app with two small FastAPI ML services. Use Render for all server workloads (Node + ML) and, if you want a static marketing/front layer on Vercel, point it to the Render backend APIs.

### 1) Environment variables (shared)
- `ATLASDB_URL` (MongoDB connection string)
- `SESSION_SECRET` (long random string)
- `CLOUD_NAME`, `CLOUD_API_KEY`, `CLOUD_API_SECRET` (Cloudinary)
- Optional external ML URLs (otherwise defaults to local):  
  - `NLP_SERVICE_URL` (defaults to `http://localhost:8002`)  
  - `BANDIT_SERVICE_URL` (defaults to `http://127.0.0.1:8001`)

Create a `.env` in the repo root (not committed) and set these.

### 2) Backend (Node/Express) on Render
1. Render → New Web Service → pick this repo.
2. Runtime: Node 20+, Build: `npm install`, Start: `node app.js` (Procfile already present with `web: node app.js`).
3. Environment: Add vars listed above; ensure `PORT` is auto-provided by Render (Express already respects `process.env.PORT`).
4. Enable auto-deploy on push if desired.

### 3) ML services on Render (Python/FastAPI)
Create two separate Web Services from `ml-services/bandit_service` and `ml-services/nlp_service`.

- **Bandit service**
  - Build: `pip install -r requirements.txt`
  - Start: `uvicorn app:app --host 0.0.0.0 --port 8001`
  - Expose port 8001 (Render sets `PORT`; override command to use `$PORT` if needed: `uvicorn app:app --host 0.0.0.0 --port $PORT`)

- **NLP service**
  - Build: `pip install -r requirements.txt`
  - Start: `uvicorn app:app --host 0.0.0.0 --port 8002` (or `$PORT`)

Update your main app env to point `BANDIT_SERVICE_URL`/`NLP_SERVICE_URL` to the Render service URLs.

### 4) Frontend on Vercel (static layer hitting Render API)
This codebase is server-rendered Express, which is better hosted entirely on Render. If you still want a Vercel-hosted static frontend:
1. Create a separate lightweight frontend (e.g., Next.js or plain static) that calls the Render backend API domain.
2. Add a `vercel.json` in that frontend project to set rewrites to your Render API origin.
3. Deploy that frontend project to Vercel via the Vercel dashboard or CLI.

> Note: Deploying this full Express app directly on Vercel would require adding a `vercel.json` with a custom serverless entry (not present now) and is not recommended for stateful sessions.

### 5) Required deployment files status
- Present: `Procfile` (for Render web service), `package.json`, `package-lock.json`, Python `requirements.txt` for both ML services, `render.yaml` (infra-as-code for Render; service names use the Wanderlust prefix).
- Missing (create if needed): `.env` (local secrets), `vercel.json` (only if you adapt or add a dedicated Vercel frontend).

### 6) Smoke test checklist after deploy
- Backend URL `/health` (add a quick route if needed) returns OK.
- Frontend pages render via Render domain.
- Coupon and booking flows hit Mongo successfully.
- Media uploads succeed (Cloudinary creds correct).
- ML endpoints return OK (`/sentiment`, `/risk`, `/rank`, `/stats/ctr`).

