# StudyBuddy (Vercel + Neon ready)

## Local dev
```bash
# Server
cd server
cp .env.example .env
# add OPENAI_API_KEY; keep DATABASE_URL=./studybuddy.db for local sqlite
npm i
npm run dev

# Web
cd ../web
npm i
npm run dev
```
Open http://localhost:5173

## Deploy (quick)
- Create Neon Postgres → copy connection URL
- Vercel project (server): root `server/`, env: `OPENAI_API_KEY`, `DATABASE_URL`, `ORIGIN=https://<your-web>.vercel.app`
- Vercel project (web): root `web/`, env: `VITE_API_BASE=https://<your-server>.vercel.app`

## Notes
- Server auto-switches SQLite (local) ↔ Postgres (prod) based on `DATABASE_URL`.
- Uploads are memory-based (serverless-safe).
- No secrets checked in.
