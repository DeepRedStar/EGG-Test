# Egg Hunt (Ostereier-Suche) MVP

A self-hosted geocaching-style web app. Each deployment is a single-tenant instance with invited players only. Built with Node.js/Express/Prisma on the backend and React/Leaflet on the frontend, delivered as a PWA.

## Requirements
- Node.js 20+
- npm
- Docker & Docker Compose (optional, for containerized setup)

## Step-by-step installation (friendly defaults)
1. **Clone the repo**
   ```bash
   git clone <this-repo-url>
   cd EGG-Test
   ```
2. **Install dependencies**
   - Install the setup wizard dependencies at the project root:
     ```bash
     npm install
     ```
   - If you want to run the app without Docker, also install backend/frontend deps:
     ```bash
     cd backend && npm install && cd ..
     cd frontend && npm install && cd ..
     ```
3. **Run the CLI setup wizard** (creates `.env` files and can run DB migrations)
   ```bash
   npm run setup
   ```
   The wizard keeps things simple:
   - It reads `DATABASE_URL` from `backend/.env` (copy `backend/.env.example` and edit manually if missing).
   - It asks for the public/base URL, instance name, and preferred locales.
   - It can run Prisma migrations if a database URL is present.
4. **Start the stack**
   - Without Docker:
     ```bash
     cd backend && npm run dev
     # in a second terminal
     cd frontend && npm run dev
     ```
   - With Docker:
     ```bash
     cd infra
     docker compose up --build
     ```
5. **First-run web wizard**
   - Open the frontend (default `http://localhost:5173`).
   - You will be redirected to `/setup` if no admin exists.
   - Create the first admin (email + password) and optionally set name/locales/legal links.
   - After saving, you are logged in as admin and forwarded to the dashboard. Players will choose an active event if more than one is available.
6. **Next steps**
   - If you skipped migrations in the wizard: `cd backend && npx prisma migrate deploy`.
   - Use the admin dashboard to create events, invite tokens, caches, and update settings (radii, locales, legal links, info texts).

## Quickstart (Docker Compose)
```bash
cd infra
docker compose up --build
```
- Backend: http://localhost:4000
- Frontend: http://localhost:5173
- PostgreSQL: localhost:5432 (user/password: ostereier)

## Sizing & Performance Recommendations

These are rough, conservative estimates for typical game usage (mobile clients polling the map, simple API traffic, low to moderate logging):

- **Up to ~10 players**
  - 1 vCPU
  - 512 MB – 1 GB RAM
  - Small PostgreSQL instance on the same host is fine.
- **Up to ~50 players**
  - 1–2 vCPUs
  - 2 GB RAM
  - PostgreSQL on the same host still fine, but consider separate DB if there are other apps on the server.
- **Up to ~100 players**
  - 2–4 vCPUs
  - 4 GB RAM
  - PostgreSQL with regular backups and basic monitoring recommended.
- **Up to ~200 players**
  - 4 vCPUs or more
  - 8 GB RAM or more
  - Consider running PostgreSQL either on a tuned instance / managed DB service and use a reverse proxy (like Nginx/Traefik) in front of the app.

These numbers are only guidelines. Actual requirements depend on:
- How often the clients poll the API for updates.
- Whether you run additional services on the same server.
- How detailed your logging and metrics are.

For small local events (10–50 players), a single small VPS (1–2 vCPUs, 2 GB RAM) is usually sufficient.

## Manual development setup (without the wizard)
1. Copy environment variables:
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
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
- `GET/POST/PUT/DELETE /api/admin/caches` – admin cache CRUD (per event).
- `GET/POST/DELETE /api/admin/invites` – manage invite tokens (per event).
- `GET/POST /api/admin/events` – manage multiple events/rounds on the same server.
- `GET/POST /api/admin/settings` – configure instance metadata (visibility/found radius, locales, legal URLs, info texts, etc.).
- `POST /api/player/caches/nearby` – caches within configured radius of provided location.
- `POST /api/player/caches/found` – validate proximity and mark as found.
- `GET /api/player/events` – list active events for player selection.
- `GET /healthz` – health check for monitoring.
- `GET /api/setup/status` / `POST /api/setup/initialize` – first-run detection and initial admin creation.

## Data model (Prisma)
See `backend/prisma/schema.prisma` for `User`, `InviteToken`, `Cache`, `FoundCache`, `Setting`, `Event`, and `Role` definitions.

Multiple events can live on one server instance. Each cache, invite token, and found log belongs to a specific event, so you can run separate game rounds without spinning up another deployment.

## Security & privacy notes
- Session cookies are `HttpOnly`, `SameSite=Strict`, and `Secure` in production.
- Input validated with Zod; rate limiting middleware can be added per route.
- Helmet plus additional security headers (CSP, frame/options) are enabled.
- No persistent storage of player coordinates; only cache finds are recorded.
- Admins must configure their own legal documents: Impressum URL, privacy URL, support email, and informational texts via settings.
- All gameplay parameters (radii, locales, info text, legal URLs, instance name) are stored as settings in the database and can be edited in the admin UI instead of environment files.

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
- `infra/setup` – interactive CLI wizard for environment files and migrations.
