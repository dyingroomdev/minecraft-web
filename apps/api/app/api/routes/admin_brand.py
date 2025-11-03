"""Admin brand and SEO management endpoints."""

from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_session, require_admin
from app.core.enums import AdminRole
from app.db.models import AdminUser
from app.db.models.brand import BrandSettings, SEOSettings
from app.schemas.brand import BrandRead, BrandUpdate, SEORead, SEOUpdate

router = APIRouter()


@router.get("/brand", response_model=BrandRead)
async def get_brand_settings_admin(
    session: AsyncSession = Depends(get_db_session),
    _: AdminUser = Depends(require_admin()),
) -> BrandRead:
    """Get brand settings for admin (ADMIN, SUPER_ADMIN)."""
    result = await session.execute(select(BrandSettings).where(BrandSettings.id == 1))
    brand = result.scalar_one_or_none()
    
    if not brand:
        brand = BrandSettings(id=1)
        session.add(brand)
        await session.commit()
        await session.refresh(brand)
    
    return BrandRead(
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


@router.patch("/brand", response_model=BrandRead)
async def update_brand_settings(
    payload: BrandUpdate,
    session: AsyncSession = Depends(get_db_session),
    _: AdminUser = Depends(require_admin(AdminRole.SUPER_ADMIN)),
) -> BrandRead:
    """Update brand settings (SUPER_ADMIN only)."""
    result = await session.execute(select(BrandSettings).where(BrandSettings.id == 1))
    brand = result.scalar_one_or_none()
    
    if not brand:
        brand = BrandSettings(id=1)
        session.add(brand)
    
    # Update fields
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if hasattr(brand, field):
            setattr(brand, field, value)
    
    brand.updated_at = datetime.utcnow()
    await session.commit()
    await session.refresh(brand)
    
    return BrandRead(
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


@router.get("/seo", response_model=SEORead)
async def get_seo_settings_admin(
    session: AsyncSession = Depends(get_db_session),
    _: AdminUser = Depends(require_admin()),
) -> SEORead:
    """Get SEO settings for admin (ADMIN, SUPER_ADMIN)."""
    result = await session.execute(select(SEOSettings).where(SEOSettings.id == 1))
    seo = result.scalar_one_or_none()
    
    if not seo:
        seo = SEOSettings(id=1)
        session.add(seo)
        await session.commit()
        await session.refresh(seo)
    
    return SEORead(
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


@router.patch("/seo", response_model=SEORead)
async def update_seo_settings(
    payload: SEOUpdate,
    session: AsyncSession = Depends(get_db_session),
    _: AdminUser = Depends(require_admin(AdminRole.SUPER_ADMIN)),
) -> SEORead:
    """Update SEO settings (SUPER_ADMIN only)."""
    result = await session.execute(select(SEOSettings).where(SEOSettings.id == 1))
    seo = result.scalar_one_or_none()
    
    if not seo:
        seo = SEOSettings(id=1)
        session.add(seo)
    
    # Update fields
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if hasattr(seo, field):
            setattr(seo, field, value)
    
    seo.updated_at = datetime.utcnow()
    await session.commit()
    await session.refresh(seo)
    
    return SEORead(
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


@router.post("/seo/sitemap/rebuild")
async def rebuild_sitemap(
    session: AsyncSession = Depends(get_db_session),
    _: AdminUser = Depends(require_admin(AdminRole.SUPER_ADMIN)),
) -> dict:
    """Rebuild sitemap cache (SUPER_ADMIN only)."""
    # TODO: Implement sitemap cache invalidation
    return {"message": "Sitemap rebuild triggered"}


@router.post("/seo/og-image")
async def upload_og_image(
    file: bytes = Depends(lambda: b""),  # Placeholder for file upload
    session: AsyncSession = Depends(get_db_session),
    _: AdminUser = Depends(require_admin(AdminRole.SUPER_ADMIN)),
) -> dict:
    """Upload OG image (SUPER_ADMIN only)."""
    # TODO: Implement file upload and update SEO settings
    return {"message": "OG image upload not yet implemented"}