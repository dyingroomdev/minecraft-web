# AMZCraft Monorepo

Monorepo containing the AMZCraft backend API, background worker, and React front-end.

## Structure

- `apps/api` – FastAPI service exposing core APIs.
- `apps/worker` – Async worker for background jobs.
- `apps/web` – Vite + React front-end with Tailwind and shadcn/ui.

## Getting started

1. Copy the environment template and adjust values:
   ```bash
   cp .env.template .env
   ```
2. Install pre-commit hooks:
   ```bash
   pip install pre-commit && pre-commit install
   ```
3. (Optional) Create Python virtual environments per app and install dependencies:
   ```bash
   cd apps/api && pip install -e .[dev]
   cd apps/worker && pip install -e .[dev]
   ```
4. Start the stack with Docker Compose:
   ```bash
   docker compose up --build
   ```
5. Apply database migrations (run from `apps/api`):
   ```bash
   alembic upgrade head
   ```

## Testing

- Backend tests:
  ```bash
  pytest
  ```
  (run from the repository root with the desired virtual environment active)

- Front-end:
  ```bash
  cd apps/web
  npm install
  npm run dev
  ```

## Tooling

- Ruff and mypy settings live in `pyproject.toml` and `mypy.ini`.
- Pre-commit hooks enforce formatting and type checks.
- Tailwind and shadcn/ui are preconfigured with sample components.
- Background Minecraft status poller can be toggled via `ENABLE_STATUS_POLLER` (disable during tests if Redis isn't available).

## API highlights

- Discord OAuth2 login `/auth/discord/login` plus callback `/auth/discord/callback`.
- JWT access/refresh lifecycle with rotation via `/auth/refresh`, `/auth/logout`, and `/me` profile endpoint.
- Alembic migrations cover `users`, `refresh_tokens`, and `audit_logs`.
- Content and gameplay data models for players, ranks, guilds, events, rules, leaderboards, tickets, and social links.
- Public content endpoints under `/api` for status, news, rules, events, leaderboards, players, and social metadata.
- Vote links and rewards managed via `/admin/votes` and exposed at `/api/votes` for the `/vote` front-end page.
- Hero slider and server features managed through admin endpoints and delivered via `/api/hero-slides` & `/api/features` for a dynamic homepage.
- Admin-protected CRUD endpoints under `/admin` for managing news, events, rules, and social links (RBAC enforced for OWNER/ADMIN/MOD roles).
- Worker includes a nightly Discord role-sync stub ready for future implementation.
- Payment system with bKash integration and rank fulfillment.
- Real-time server status via WebSocket.
- Admin diagnostics and management tools.

## Operations

See [RUNBOOK.md](RUNBOOK.md) for detailed operational procedures including:
- Purchase lifecycle and troubleshooting
- Rollback procedures for failed payments
- Social media link management
- RCON failure handling and recovery
- System monitoring and emergency procedures
