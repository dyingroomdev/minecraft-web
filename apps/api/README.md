# AMZCraft API

FastAPI application providing backend APIs for the AMZCraft platform.

## Local development

Install dependencies and run the application:

```bash
pip install -e .[dev]
uvicorn app.main:app --reload
```

Run the test suite:

```bash
pytest
```

## Database migrations

Alembic is configured under `alembic/`. Generate and apply migrations from this directory:

```bash
alembic revision --autogenerate -m "describe change"
alembic upgrade head
```

## Auth endpoints

- `GET /auth/discord/login` – Redirects to Discord OAuth consent.
- `GET /auth/discord/callback` – Handles Discord redirect, issues JWT access + refresh tokens, and sets HTTP-only refresh cookie.
- `POST /auth/refresh` – Rotates refresh token and returns a new access token.
- `POST /auth/logout` – Revokes refresh token and clears cookies.
- `GET /me` – Returns the authenticated user's profile.

## Public API

- `GET /api/status` – Latest server status snapshot.
- `GET /api/news` / `GET /api/news/{slug}` – News listings and detail pages.
- `GET /api/rules` – Ordered list of published rules (pinned first).
- `GET /api/events/active` – Events that are currently live or scheduled.
- `GET /api/leaderboards/{season}/{type}` – Leaderboard entries by season + type.
- `GET /api/players/{uuid}` – Player card keyed by Minecraft UUID.
- `GET /api/social` – Public social link JSON payload.
- `GET /api/votes` – Vote links and rewards for player voting portals.
- `GET /api/hero-slides`, `GET /api/features` – Dynamic homepage slider and server feature content.

## Admin API (RBAC)

- `POST /admin/news`, `PATCH /admin/news/{news_id}`, `DELETE /admin/news/{news_id}` – Manage news posts (ADMIN/OWNER).
- `POST /admin/events`, `PATCH /admin/events/{event_id}`, `DELETE /admin/events/{event_id}` – Manage events (ADMIN/OWNER, MOD allowed for create/update).
- `POST /admin/rules`, `PATCH /admin/rules/{rule_id}`, `DELETE /admin/rules/{rule_id}` – Manage rules (ADMIN/OWNER, MOD allowed for create/update).
- `GET /admin/social`, `PATCH /admin/social` – View or update social links (MOD read, ADMIN/OWNER write).
- `GET /admin/votes`, `POST /admin/votes`, `PATCH /admin/votes/{vote_id}`, `DELETE /admin/votes/{vote_id}` – Manage vote links and rewards.
- `GET/POST/PATCH/DELETE /admin/hero-slides` – Manage homepage hero slider.
- `GET/POST/PATCH/DELETE /admin/features` – Manage server feature highlight cards.

## Background services

- `ENABLE_STATUS_POLLER=true` enables the Redis-backed Minecraft status poller (disable in local test runs when Redis isn't reachable).
