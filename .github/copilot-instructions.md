# Toolhedge workspace

- Keep the browse-only software directory as the product focus; do not add authentication, likes, or reviews in this phase.
- Keep site name and tagline centralized in `apps/web/src/config/site.ts`.
- Keep frontend API calls in `apps/web/src/api/` and backend layering route → controller → service → repository.
- Use Prisma migrations for schema changes and preserve the PostgreSQL trigram extension/index.
