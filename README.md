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
   The wizard will ask for:
   - Database URL (e.g., `postgresql://user:pass@localhost:5432/ostereier`)
   - Public/Base URL (e.g., `http://localhost:5173`)
   - Instance name
   - Default/Enabled locales (e.g., `de` and `de,en`)
   - Cache visibility/found radii
   - Impressum URL, Privacy URL, Support email
   - Optionally run Prisma migrations right away
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
   - After saving, you are logged in as admin and forwarded to the dashboard.
6. **Next steps**
   - If you skipped migrations in the wizard: `cd backend && npx prisma migrate deploy`.
   - Use the admin dashboard to create invite tokens, caches, and update settings.

## Quickstart (Docker Compose)
```bash
cd infra
docker compose up --build
```
- Backend: http://localhost:4000
- Frontend: http://localhost:5173
- PostgreSQL: localhost:5432 (user/password: ostereier)

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
- `GET/POST/PUT/DELETE /api/admin/caches` – admin cache CRUD.
- `GET/POST/DELETE /api/admin/invites` – manage invite tokens.
- `GET/POST /api/admin/settings` – configure instance metadata (visibility/found radius, locales, legal URLs, info texts, etc.).
- `POST /api/player/caches/nearby` – caches within configured radius of provided location.
- `POST /api/player/caches/found` – validate proximity and mark as found.
- `GET /healthz` – health check for monitoring.
- `GET /api/setup/status` / `POST /api/setup/initialize` – first-run detection and initial admin creation.

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
- `infra/setup` – interactive CLI wizard for environment files and migrations.
