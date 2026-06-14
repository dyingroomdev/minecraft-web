"""Google OpenID Connect integration helpers."""

from __future__ import annotations

import httpx
from pydantic import BaseModel

from app.core.config import GoogleOAuthConfig


class GoogleTokenResponse(BaseModel):
    access_token: str
    token_type: str
    expires_in: int


class GoogleUser(BaseModel):
    sub: str
    email: str
    email_verified: bool = False
    name: str | None = None
    picture: str | None = None


class GoogleOAuthService:
    def __init__(self, config: GoogleOAuthConfig, client: httpx.AsyncClient) -> None:
        self.config = config
        self.client = client

    async def exchange_code(self, *, code: str) -> GoogleTokenResponse:
        response = await self.client.post(
            self.config.token_url,
            data={
                "client_id": self.config.client_id,
                "client_secret": self.config.client_secret,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": self.config.redirect_uri,
            },
        )
        response.raise_for_status()
        return GoogleTokenResponse.model_validate(response.json())

    async def fetch_user(self, *, access_token: str) -> GoogleUser:
        response = await self.client.get(
            self.config.user_url,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        response.raise_for_status()
        return GoogleUser.model_validate(response.json())
