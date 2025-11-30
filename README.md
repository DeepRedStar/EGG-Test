# Egg Hunt (Ostereier-Suche) MVP

A self-hosted geocaching-style web app. Each deployment is a single-tenant instance with invited players only. Built with Node.js/Express/Prisma on the backend and React/Leaflet on the frontend, delivered as a PWA.

## Features
- Invite-only registration (invite tokens created by admins).
- Roles: `ADMIN` manages caches, invites, and instance settings; `PLAYER` finds caches on a map and logs discoveries.
- Privacy-aware location handling (client-side geolocation; only transient coordinates sent for cache checks).
- PWA with offline fallback for static content.
- Dockerized stack with PostgreSQL.

## Requirements
- Node.js 20+
- npm
- Docker & Docker Compose (for containerized setup)

## Quickstart (Docker Compose)
```bash
cd infra
docker compose up --build
```
- Backend: http://localhost:4000
- Frontend: http://localhost:5173
- PostgreSQL: localhost:5432 (user/password: ostereier)

## Manual development setup
1. Copy environment variables:
   ```bash
   cp backend/.env.example backend/.env
   ```
2. Install dependencies and run Prisma setup:
   ```bash
   cd backend
   npm install
   npx prisma generate
   npm run dev
   ```
3. Start frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## API highlights
- `POST /api/auth/register` – register with invite token.
- `POST /api/auth/login` / `POST /api/auth/logout` – session-based auth.
- `GET/POST/PUT/DELETE /api/admin/caches` – admin cache CRUD.
- `GET/POST/DELETE /api/admin/invites` – manage invite tokens.
- `GET/POST /api/admin/settings` – configure instance metadata (visibility/found radius, locales, legal URLs, info texts, etc.).
- `POST /api/player/caches/nearby` – caches within configured radius of provided location.
- `POST /api/player/caches/found` – validate proximity and mark as found.
- `GET /healthz` – health check for monitoring.

## Data model (Prisma)
See `backend/prisma/schema.prisma` for `User`, `InviteToken`, `Cache`, `FoundCache`, `Setting`, and `Role` definitions.

## Security & privacy notes
- Session cookies are `HttpOnly`, `SameSite=Strict`, and `Secure` in production.
- Input validated with Zod; rate limiting middleware can be added per route.
- Helmet plus additional security headers (CSP, frame/options) are enabled.
- No persistent storage of player coordinates; only cache finds are recorded.
- Admins must configure their own legal documents: Impressum URL, privacy URL, support email, and informational texts via settings.

## PWA
- Manifest available at `/manifest.webmanifest`.
- Simple service worker caches static assets and an offline page (`/offline.html`).

## Testing & linting
- ESLint + Prettier configs included for backend and frontend (`npm run lint`).
- Add Jest/Supertest or React Testing Library as needed for deeper coverage.

## Directory structure
- `backend/` – Express API, Prisma schema, Dockerfile.
- `frontend/` – React + Vite app with Leaflet map and PWA assets.
- `infra/` – docker-compose.yml wiring backend, frontend, and PostgreSQL.
