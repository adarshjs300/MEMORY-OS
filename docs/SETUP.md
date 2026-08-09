# Setup Guide

## Prerequisites

- Node.js 20+
- Docker + Docker Compose
- npm

## Option A — Docker for everything (fastest)

From the repo root:

```bash
docker compose up -d --build
```

This starts Postgres, Redis, the backend API (port 4000), and the frontend
(port 5173, served via nginx). The backend container does **not** run
migrations automatically on boot — run them once after the containers are
healthy:

```bash
docker compose exec backend node dist/db/migrate.js
```

(There's no `npm` inside the production image — the compiled `dist/`
migration script is what runs there. For iterating on migrations during
development, use Option B instead so you get `npm run migrate` with tsx.)

Then visit http://localhost:5173, register an account, and you'll land on
the dashboard.

## Option B — Docker for infra only, npm for app code (recommended for development)

```bash
# Start just the databases
docker compose up -d postgres redis

# Backend
cd backend
cp .env.example .env      # edit secrets if you like
npm install
npm run migrate
npm run dev                # http://localhost:4000

# Frontend (new terminal)
cd frontend
cp .env.example .env
npm install
npm run dev                # http://localhost:5173
```

Hot reload works on both sides: `tsx watch` for the backend, Vite for the
frontend.

## Running tests

Tests hit a real database — point `DATABASE_URL` at a disposable one so you
don't touch your dev data:

```bash
cd backend
createdb digital_memory_os_test   # or via docker exec into the postgres container
DATABASE_URL=postgresql://dmos_user:dmos_password@localhost:5432/digital_memory_os_test npm run migrate
DATABASE_URL=postgresql://dmos_user:dmos_password@localhost:5432/digital_memory_os_test npm test
```

## Verifying Phase 1 manually

```bash
# Health check
curl http://localhost:4000/health

# Register
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"StrongPass123","displayName":"You"}'

# Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"you@example.com","password":"StrongPass123"}'

# Authenticated request (paste the accessToken from the login response)
curl http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer <accessToken>"

# Refresh (uses the cookie jar saved above)
curl -X POST http://localhost:4000/api/auth/refresh -b cookies.txt -c cookies.txt
```

## Common issues

- **`Invalid environment configuration` on backend start** — you haven't
  copied `.env.example` to `.env`, or `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET`
  are shorter than 32 characters.
- **`ECONNREFUSED` from the backend to Postgres** — the `postgres` container
  isn't healthy yet; `docker compose ps` to check, or just wait a few
  seconds and retry.
- **CORS errors in the browser** — make sure `CORS_ORIGIN` in the backend
  `.env` matches the exact origin the frontend is served from.
- **Refresh cookie not being set / login "not sticking"** — this is
  typically a cookie `SameSite`/`secure` mismatch. In development, both
  frontend and backend should be on `http://localhost:*` (not `127.0.0.1`
  for one and `localhost` for the other) so the cookie is sent consistently.
