"""Administrative endpoints for rank products and LuckPerms integration."""

from __future__ import annotations

import asyncio
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_session, get_settings_dependency, require_admin
from app.core.config import Settings
from app.core.enums import AdminRole
from app.db.models.payment import RankProduct
from app.schemas.payment import RankProductRead, RankProductUpdate
from app.services.luckperms import LuckPermsService, RCONError

router = APIRouter(prefix="/admin", tags=["admin-ranks"])


@router.get("/rank-products", response_model=list[RankProductRead])
async def list_rank_products(
    session: AsyncSession = Depends(get_db_session),
    _: None = Depends(require_admin()),
) -> list[RankProduct]:
    """Return all rank products with LuckPerms mapping info."""

    result = await session.execute(select(RankProduct).order_by(RankProduct.display_name))
    return result.scalars().all()


@router.patch("/rank-products/{product_id}", response_model=RankProductRead)
async def update_rank_product(
    product_id: uuid.UUID,
    payload: RankProductUpdate,
    session: AsyncSession = Depends(get_db_session),
    _: None = Depends(require_admin(AdminRole.SUPER_ADMIN)),
) -> RankProduct:
    """Update LuckPerms mapping for a rank product."""

    product = await session.get(RankProduct, product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rank product not found")

    lp_group = payload.lp_group.strip() if payload.lp_group and payload.lp_group.strip() else None
    product.lp_group = lp_group
    product.stack_mode = payload.stack_mode.value

    await session.commit()
    await session.refresh(product)
    return product


@router.get("/luckperms/groups", response_model=list[str])
async def list_luckperms_groups(
    settings: Settings = Depends(get_settings_dependency),
    _: None = Depends(require_admin()),
) -> list[str]:
    """Fetch LuckPerms groups via RCON."""

    if not settings.minecraft_rcon_password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="RCON password not configured")

    service = LuckPermsService(
        host=settings.minecraft_rcon_host,
        port=settings.minecraft_rcon_port,
        password=settings.minecraft_rcon_password,
    )

    try:
        groups = await service.list_groups()
    except (OSError, RCONError, asyncio.TimeoutError) as exc:  # type: ignore[name-defined]
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc

    return groups
