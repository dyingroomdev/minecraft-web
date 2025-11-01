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
