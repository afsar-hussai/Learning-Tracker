# Personal Learning OS — Afsar's DevOps/MLOps/LLMOps Journey Tracker

## Quick Start

```bash
# First time — builds and seeds everything
docker-compose up --build

# Stop (data is preserved)
docker-compose down

# Resume (all data intact, no re-seeding)
docker-compose up

# Open in browser
http://localhost:3000
```

## What's Inside

- **DSA Tracker** — 150 problems, spaced repetition (1-2-4-7), GitHub heatmap, streaks
- **Skills Roadmap** — 4 phases, 20+ skills, certification tracker
- **Apex Bank Project** — Full DevOps+MLOps capstone tracker with 6 layers
- **Daily Dashboard** — Progress rings, revision queue, motivational quotes
- **Goals & Milestones** — 12 monthly milestones toward 18+ LPA offer
- **Daily Journal** — Mood/energy tracker, timeline view, search
- **Import/Export** — Excel (.xlsx) and JSON full backup/restore

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TailwindCSS |
| Backend | Node.js + Express |
| Database | SQLite (persisted at ./data/db.sqlite) |
| Charts | Recharts |
| Excel | SheetJS (xlsx) |
| Container | Docker + docker-compose |

## Data Persistence

SQLite file lives at `./data/db.sqlite` on your host machine via Docker volume mount.
Stop container, restart — everything resumes exactly where you left off.

## Ports

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
