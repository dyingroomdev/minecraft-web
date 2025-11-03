"""Public brand and SEO endpoints."""

from __future__ import annotations

import hashlib
from datetime import datetime

from fastapi import APIRouter, Depends, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_session
from app.db.models.brand import BrandSettings, SEOSettings
from app.schemas.brand import BrandRead, SEORead

router = APIRouter()


def generate_etag(data: str) -> str:
    """Generate ETag from data."""
    return hashlib.md5(data.encode()).hexdigest()


@router.get("/brand", response_model=BrandRead)
async def get_brand_settings(
    response: Response,
    session: AsyncSession = Depends(get_db_session),
) -> BrandRead:
    """Get public brand settings with caching."""
    result = await session.execute(select(BrandSettings).where(BrandSettings.id == 1))
    brand = result.scalar_one_or_none()
    
    if not brand:
        # Create default if not exists
        brand = BrandSettings(id=1)
        session.add(brand)
        await session.commit()
        await session.refresh(brand)
    
    brand_data = BrandRead(
        site_name=brand.site_name,
        tagline=brand.tagline,
        logo_url_light=brand.logo_url_light,
        logo_url_dark=brand.logo_url_dark,
        favicon_url=brand.favicon_url,
        theme_primary=brand.theme_primary,
        theme_bg=brand.theme_bg,
        theme_surface=brand.theme_surface,
        updated_at=brand.updated_at,
    )
    
    # Set caching headers
    etag = generate_etag(brand_data.model_dump_json())
    response.headers["ETag"] = f'"{etag}"'
    response.headers["Cache-Control"] = "public, max-age=300"
    
    return brand_data


@router.get("/seo", response_model=SEORead)
async def get_seo_settings(
    response: Response,
    session: AsyncSession = Depends(get_db_session),
) -> SEORead:
    """Get public SEO settings with caching."""
    result = await session.execute(select(SEOSettings).where(SEOSettings.id == 1))
    seo = result.scalar_one_or_none()
    
    if not seo:
        # Create default if not exists
        seo = SEOSettings(id=1)
        session.add(seo)
        await session.commit()
        await session.refresh(seo)
    
    seo_data = SEORead(
        default_title=seo.default_title,
        title_template=seo.title_template,
        meta_description=seo.meta_description,
        canonical_base_url=seo.canonical_base_url,
        og_image_url=seo.og_image_url,
        twitter_handle=seo.twitter_handle,
        robots_policy=seo.robots_policy,
        sitemap_enabled=seo.sitemap_enabled,
        updated_at=seo.updated_at,
    )
    
    # Set caching headers
    etag = generate_etag(seo_data.model_dump_json())
    response.headers["ETag"] = f'"{etag}"'
    response.headers["Cache-Control"] = "public, max-age=300"
    
    return seo_data


@router.get("/robots.txt", response_class=Response)
async def get_robots_txt(
    session: AsyncSession = Depends(get_db_session),
) -> Response:
    """Generate robots.txt from SEO settings."""
    result = await session.execute(select(SEOSettings).where(SEOSettings.id == 1))
    seo = result.scalar_one_or_none()
    
    if not seo:
        seo = SEOSettings(id=1)
    
    robots_content = f"""User-agent: *
Disallow:
Allow: /
Sitemap: {seo.canonical_base_url}/sitemap.xml
# Policy: {seo.robots_policy}
"""
    
    return Response(
        content=robots_content,
        media_type="text/plain",
        headers={"Cache-Control": "public, max-age=3600"}
    )


@router.get("/manifest.webmanifest")
async def get_web_manifest(
    session: AsyncSession = Depends(get_db_session),
) -> dict:
    """Generate web app manifest from brand settings."""
    result = await session.execute(select(BrandSettings).where(BrandSettings.id == 1))
    brand = result.scalar_one_or_none()
    
    if not brand:
        brand = BrandSettings(id=1)
    
    manifest = {
        "name": brand.site_name,
        "short_name": brand.site_name,
        "description": brand.tagline,
        "theme_color": brand.theme_primary,
        "background_color": brand.theme_bg,
        "display": "standalone",
        "start_url": "/",
        "icons": []
    }
    
    if brand.favicon_url:
        manifest["icons"].append({
            "src": brand.favicon_url,
            "sizes": "192x192",
            "type": "image/png"
        })
    
    return manifest