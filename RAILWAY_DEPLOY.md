# Railway Deployment

This app deploys cleanly to Railway as **two separate services** from the same GitHub repo.

## Service 1 — Backend (FastAPI + ffmpeg)

- **Root directory:** `backend`
- **Build:** Railway auto-detects `nixpacks.toml` → installs Python 3.11, ffmpeg, DejaVu fonts.
- **Start command:** (already in `nixpacks.toml`) `uvicorn server:app --host 0.0.0.0 --port $PORT`
- **Required environment variables:**
  - `MONGO_URL` — provided by the Railway MongoDB plugin
  - `DB_NAME` — e.g. `listworks_prod`
  - `EMERGENT_LLM_KEY` — your Emergent universal key
  - `CORS_ORIGINS` — `https://listworks.pro,https://www.listworks.pro`
- **Add the MongoDB plugin** to the Railway project — it auto-injects `MONGO_URL`.

## Service 2 — Frontend (React)

- **Root directory:** `frontend`
- **Build command:** `yarn install && yarn build`
- **Start command:** `npx serve -s build -l $PORT`  (or use a static-site provider)
- **Required environment variables:**
  - `REACT_APP_BACKEND_URL` — the **public URL of the backend service** on Railway
    (e.g. `https://listworks-backend-production.up.railway.app`)

  > ⚠️ This is the variable that fixes the "still shows preview URL" issue.
  > After updating it, **redeploy the frontend** so Webpack bakes the new value into the build.

## Custom domain

- In Railway → frontend service → **Settings → Domains → Add Custom Domain** → `listworks.pro`
- Add the CNAME record Railway shows you at your domain registrar.
- Optionally also add `www.listworks.pro` and redirect.

## Bundled assets

- Music tracks live at `backend/static/music/*.mp3` (8 tracks) — these survive deploys.
- Font fallbacks are bundled at `backend/static/fonts/DejaVu*.ttf`.
- Nixpacks also installs `dejavu_fonts` system-wide as a backup.
