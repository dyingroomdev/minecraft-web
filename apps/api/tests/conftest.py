import os

import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

# Ensure environment variables are present before importing the app settings.
os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///:memory:?cache=shared")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/0")
os.environ.setdefault("JWT_SECRET", "test-secret")
os.environ.setdefault("JWT_ALGORITHM", "HS256")
os.environ.setdefault("JWT_ACCESS_EXPIRE_MINUTES", "15")
os.environ.setdefault("JWT_REFRESH_EXPIRE_MINUTES", "4320")
os.environ.setdefault("JWT_REFRESH_COOKIE_NAME", "refresh_token")
os.environ.setdefault("JWT_REFRESH_COOKIE_SECURE", "false")
os.environ.setdefault("JWT_REFRESH_COOKIE_PATH", "/")
os.environ.setdefault("JWT_REFRESH_COOKIE_SAMESITE", "lax")
os.environ.setdefault("DISCORD_CLIENT_ID", "test-client")
os.environ.setdefault("DISCORD_CLIENT_SECRET", "test-secret")
os.environ.setdefault("DISCORD_REDIRECT_URI", "https://example.com/callback")
os.environ.setdefault("DISCORD_GUILD_ID", "1234567890")
os.environ.setdefault("DISCORD_API_BASE", "https://discord.com/api")
os.environ.setdefault("DISCORD_ROLE_MAPPING_JSON", "{\"OWNER\":[],\"ADMIN\":[],\"MOD\":[],\"PLAYER\":[]}")

from app.core.config import Settings, get_settings
from app.db.base import Base
from app.db.session import engine
from app.main import app

SessionTesting = async_sessionmaker(bind=engine, expire_on_commit=False, class_=AsyncSession)


@pytest_asyncio.fixture(scope="session", autouse=True)
async def prepare_database():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
def settings_override() -> Settings:
    get_settings.cache_clear()
    return get_settings()


@pytest_asyncio.fixture
async def db_session() -> AsyncSession:
    async with SessionTesting() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture
async def client(db_session: AsyncSession, settings_override: Settings):
    async def _override_session():
        async with SessionTesting() as session:
            yield session

    async def _override_settings():
        return settings_override

    from app.api import deps

    app.dependency_overrides.clear()

    class DummyDiscordClient:
        async def post(self, *args, **kwargs):  # pragma: no cover - defensive
            raise RuntimeError("Discord HTTP client not stubbed for this test")

        async def get(self, *args, **kwargs):  # pragma: no cover - defensive
            raise RuntimeError("Discord HTTP client not stubbed for this test")

        async def aclose(self) -> None:
            return None

    async def _override_http_client():
        yield DummyDiscordClient()

    app.dependency_overrides[deps.get_db_session] = _override_session
    app.dependency_overrides[deps.get_settings_dependency] = _override_settings
    app.dependency_overrides[deps.get_http_client] = _override_http_client

    async with AsyncClient(app=app, base_url="http://testserver") as api_client:
        yield api_client

    app.dependency_overrides.clear()
