# Toolhedge

**Find the right software, without the guesswork.**

Toolhedge is a browse-first software directory. Visitors can search and sort useful software, preview a listing, and open its full details. The browse-only first phase has no accounts, likes, reviews, comparisons, or alternatives.

## Stack

- Frontend: React, Vite, TypeScript, React Router, Tailwind CSS
- Backend: Node.js, Express, TypeScript, Zod
- Database: PostgreSQL 16, Prisma
- Monorepo: npm workspaces in `apps/web` and `apps/api`

## Run locally

1. Copy `.env.example` to `.env` and set `DATABASE_URL` to a direct PostgreSQL connection URL (for Prisma Postgres, use its direct connection URL — for example, `POSTGRES_URL` — not an Accelerate URL). For local PostgreSQL, start the included database with `docker compose up -d`.
2. Install dependencies from the repository root: `npm install`.
3. Apply the existing migrations: `npx prisma migrate deploy --schema apps/api/prisma/schema.prisma`.
4. Run the frontend and API together: `npm run dev`.

The frontend is at http://localhost:5173 and the API at http://localhost:4000. The API always talks to PostgreSQL via Prisma; there is no JSON fallback.

## Useful scripts

- `npm run dev` — run web and API together
- `npm run build` — build both workspaces
- `npm run db:migrate` — run Prisma migrations in development

API routes are versioned under `/api/v1`; `GET /api/v1/software` accepts `q`, `sort`, `page`, `limit`, `category`, `pricing`, `platform`, and `tag`, and returns facets alongside the page of results. `GET /api/v1/software/:slug` returns a listing, and `/api/v1/categories` provides category metadata and counts. In PostgreSQL mode, the initial migration enables `pg_trgm` and adds a trigram GIN index on the software name; the next migration adds category and tag relations.

Site name and tagline are maintained in one frontend source of truth: `apps/web/src/config/site.ts`. Tailwind's `hedge` palette is defined in `apps/web/tailwind.config.js`.
