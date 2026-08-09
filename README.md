# Digital Memory OS

> "Remember everything. Understand anything. Forget nothing."

Your private, searchable, intelligent second brain.

This repository is built **incrementally, phase by phase**, per the development
strategy below. Each phase is a working, testable increment — not a stub.

## Monorepo layout

```
digital-memory-os/
├── backend/          Node.js + Express + TypeScript API (auth, memories, search, etc.)
├── frontend/         React + TypeScript + Tailwind + Zustand + React Query
├── ai-service/        Python + FastAPI (embeddings, OCR, transcription, NLP) — added in later phases
├── docker-compose.yml Postgres + Redis + backend + frontend (+ ai-service later)
└── README.md
```

## Phase status

| Phase | Description | Status |
|---|---|---|
| 1 | Auth + project setup | ✅ Implemented (this delivery) |
| 2 | Memory CRUD + PostgreSQL | ⏳ Not started |
| 3 | File upload + storage | ⏳ Not started |
| 4 | Search | ⏳ Not started |
| 5 | Embeddings + semantic search | ⏳ Not started |
| 6 | AI memory chat | ⏳ Not started |
| 7 | Knowledge graph | ⏳ Not started |
| 8 | Timeline + temporal memory | ⏳ Not started |
| 9 | OCR + audio transcription | ⏳ Not started |
| 10 | Learning intelligence | ⏳ Not started |
| 11 | Insights | ⏳ Not started |
| 12 | Security hardening | ⏳ Not started |
| 13 | Testing | ⏳ Not started |
| 14 | Docker + deployment | 🟡 Partial (dev compose only) |

See `PHASE_1_REPORT.md` for exactly what was built, verified, and what's next.

## Quick start (local development)

Requires: Node.js 20+, Docker + Docker Compose, npm.

```bash
# 1. Clone / unzip this repo, then from the root:
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 2. Start Postgres + Redis
docker compose up -d postgres redis

# 3. Install backend deps and run migrations
cd backend
npm install
npm run migrate
npm run dev        # http://localhost:4000

# 4. In a second terminal, install and run the frontend
cd ../frontend
npm install
npm run dev         # http://localhost:5173
```

Full instructions, including Docker-only startup, are in `docs/SETUP.md`.

## Tech stack

- **Frontend**: React, TypeScript, Tailwind CSS, React Query, Zustand, Vite
- **Backend**: Node.js, Express, TypeScript
- **AI Service** (later phase): Python, FastAPI
- **Database**: PostgreSQL (+ pgvector, added in Phase 5)
- **Cache / Queue**: Redis (+ BullMQ, added in Phase 3)
- **Storage**: S3-compatible object storage (added in Phase 3)
- **Auth**: JWT access + refresh tokens, bcrypt password hashing

## Design principles carried through every phase

1. No feature is marked done unless it actually runs against a real database.
2. No silent data loss — memories are versioned, not overwritten (from Phase 2 on).
3. Every AI-generated answer must cite the memories it came from (from Phase 6 on).
4. Decay affects ranking, never deletes data (from Phase 5 on).
5. Security is built in per-phase, not bolted on at the end — Phase 12 hardens, it doesn't invent.
