# Toolhedge

**Find the right software, without the guesswork.**

Toolhedge is a browse-first software directory. Visitors can search and sort useful software, preview a listing, and open its full details. The browse-only first phase has no accounts, likes, reviews, comparisons, or alternatives.

## Stack

- Frontend: React, Vite, TypeScript, React Router, Tailwind CSS
- Backend: Node.js, Express, TypeScript, Zod
- Database: PostgreSQL 16, Prisma
- Monorepo: npm workspaces in `apps/web` and `apps/api`

## Run in JSON mode (no database required)

1. Copy `.env.example` to `.env`.
2. Install dependencies from the repository root: `npm install`.
3. Ensure `DATA_SOURCE=json` and `VITE_API_URL=http://localhost:4000/api/v1` are set in `.env`.
4. Run the frontend and API together: `npm run dev`.

The frontend is at http://localhost:5173 and the API at http://localhost:4000. The JSON dataset is loaded directly by the API; PostgreSQL does not need to be running.

## Switch to PostgreSQL

Set `DATA_SOURCE=db` in `.env`, start PostgreSQL with `docker compose up -d`, then run `npm run db:migrate` and `npm run db:seed`. The seed command reads the same `apps/api/data/software.json` used in JSON mode.

## Useful scripts

- `npm run dev` — run web and API together
- `npm run build` — build both workspaces
- `npm run db:migrate` — run Prisma migrations in development
- `npm run db:seed` — seed the software listings from JSON into PostgreSQL
- `npm run validate:data` — validate software JSON, pricing plans, and billing intervals

API routes are versioned under `/api/v1`; `GET /api/v1/software` accepts `q`, `sort`, `page`, `limit`, `category`, `pricing`, `platform`, and `tag`, and returns facets alongside the page of results. `GET /api/v1/software/:slug` returns a listing, and `/api/v1/categories` provides category metadata and counts. In PostgreSQL mode, the initial migration enables `pg_trgm` and adds a trigram GIN index on the software name; the next migration adds category and tag relations.

Site name and tagline are maintained in one frontend source of truth: `apps/web/src/config/site.ts`. Tailwind's `hedge` palette is defined in `apps/web/tailwind.config.js`.
