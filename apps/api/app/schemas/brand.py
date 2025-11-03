"""Brand and SEO schemas."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, AnyUrl, constr, field_validator


class BrandRead(BaseModel):
    site_name: str
    tagline: str
    logo_url_light: str | None
    logo_url_dark: str | None
    favicon_url: str | None
    theme_primary: str
    theme_bg: str
    theme_surface: str
    updated_at: datetime


class BrandUpdate(BaseModel):
    site_name: str | None = None
    tagline: str | None = None
    logo_url_light: AnyUrl | None = None
    logo_url_dark: AnyUrl | None = None
    favicon_url: AnyUrl | None = None
    theme_primary: constr(pattern=r'^#(?:[0-9a-fA-F]{3}){1,2}$') | None = None
    theme_bg: constr(pattern=r'^#(?:[0-9a-fA-F]{3}){1,2}$') | None = None
    theme_surface: constr(pattern=r'^#(?:[0-9a-fA-F]{3}){1,2}$') | None = None

    @field_validator('tagline')
    @classmethod
    def validate_tagline(cls, v):
        if v and len(v) > 140:
            raise ValueError('Tagline must be 140 characters or less')
        return v


class SEORead(BaseModel):
    default_title: str
    title_template: str
    meta_description: str
    canonical_base_url: str
    og_image_url: str | None
    twitter_handle: str | None
    robots_policy: str
    sitemap_enabled: bool
    updated_at: datetime


class SEOUpdate(BaseModel):
    default_title: str | None = None
    title_template: str | None = None
    meta_description: str | None = None
    canonical_base_url: AnyUrl | None = None
    og_image_url: AnyUrl | None = None
    twitter_handle: str | None = None
    robots_policy: Literal['index,follow', 'noindex,nofollow', 'index,nofollow', 'noindex,follow'] | None = None
    sitemap_enabled: bool | None = None

    @field_validator('twitter_handle')
    @classmethod
    def validate_twitter_handle(cls, v):
        if v and not v.startswith('@'):
            return f'@{v}'
        return v