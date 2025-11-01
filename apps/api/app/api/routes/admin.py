"""Admin API endpoints for content management."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_admin_user, get_db_session
from app.db.models import Event, NewsPost, Rule, SocialLink, User
from app.utils.slug_generator import generate_slug, ensure_unique_slug
from app.schemas.content import (
    EventCreate,
    EventRead,
    EventUpdate,
    NewsCreate,
    NewsDetail,
    NewsUpdate,
    RuleCreate,
    RuleRead,
    RuleUpdate,
    SocialLinksRead,
    SocialLinksUpdate,
)

router = APIRouter(prefix="/admin")


# News management
@router.post("/news", response_model=NewsDetail, status_code=status.HTTP_201_CREATED)
async def create_news(
    news_data: NewsCreate,
    session: AsyncSession = Depends(get_db_session),
    admin_user: User = Depends(get_admin_user),
) -> NewsPost:
    data = news_data.model_dump()
    
    # Auto-generate slug if not provided
    if not data.get('slug'):
        base_slug = generate_slug(data['title'])
        # Check for existing slugs
        existing_result = await session.execute(select(NewsPost.slug))
        existing_slugs = {row[0] for row in existing_result.fetchall()}
        data['slug'] = ensure_unique_slug(base_slug, existing_slugs)
    
    news_post = NewsPost(**data)
    session.add(news_post)
    await session.commit()
    await session.refresh(news_post)
    return news_post


@router.patch("/news/{news_id}", response_model=NewsDetail)
async def update_news(
    news_id: uuid.UUID,
    news_data: NewsUpdate,
    session: AsyncSession = Depends(get_db_session),
    admin_user: User = Depends(get_admin_user),
) -> NewsPost:
    stmt = select(NewsPost).where(NewsPost.id == news_id)
    result = await session.execute(stmt)
    news_post = result.scalar_one_or_none()
    if not news_post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="News post not found")
    
    for field, value in news_data.model_dump(exclude_unset=True).items():
        setattr(news_post, field, value)
    
    await session.commit()
    await session.refresh(news_post)
    return news_post


@router.delete("/news/{news_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_news(
    news_id: uuid.UUID,
    session: AsyncSession = Depends(get_db_session),
    admin_user: User = Depends(get_admin_user),
) -> None:
    stmt = select(NewsPost).where(NewsPost.id == news_id)
    result = await session.execute(stmt)
    news_post = result.scalar_one_or_none()
    if not news_post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="News post not found")
    
    await session.delete(news_post)
    await session.commit()


# Events management
@router.post("/events", response_model=EventRead, status_code=status.HTTP_201_CREATED)
async def create_event(
    event_data: EventCreate,
    session: AsyncSession = Depends(get_db_session),
    admin_user: User = Depends(get_admin_user),
) -> Event:
    event = Event(**event_data.model_dump())
    session.add(event)
    await session.commit()
    await session.refresh(event)
    return event


@router.patch("/events/{event_id}", response_model=EventRead)
async def update_event(
    event_id: uuid.UUID,
    event_data: EventUpdate,
    session: AsyncSession = Depends(get_db_session),
    admin_user: User = Depends(get_admin_user),
) -> Event:
    stmt = select(Event).where(Event.id == event_id)
    result = await session.execute(stmt)
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    
    for field, value in event_data.model_dump(exclude_unset=True).items():
        setattr(event, field, value)
    
    await session.commit()
    await session.refresh(event)
    return event


@router.delete("/events/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event(
    event_id: uuid.UUID,
    session: AsyncSession = Depends(get_db_session),
    admin_user: User = Depends(get_admin_user),
) -> None:
    stmt = select(Event).where(Event.id == event_id)
    result = await session.execute(stmt)
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    
    await session.delete(event)
    await session.commit()


# Rules management
@router.post("/rules", response_model=RuleRead, status_code=status.HTTP_201_CREATED)
async def create_rule(
    rule_data: RuleCreate,
    session: AsyncSession = Depends(get_db_session),
    admin_user: User = Depends(get_admin_user),
) -> Rule:
    rule = Rule(**rule_data.model_dump())
    session.add(rule)
    await session.commit()
    await session.refresh(rule)
    return rule


@router.patch("/rules/{rule_id}", response_model=RuleRead)
async def update_rule(
    rule_id: uuid.UUID,
    rule_data: RuleUpdate,
    session: AsyncSession = Depends(get_db_session),
    admin_user: User = Depends(get_admin_user),
) -> Rule:
    stmt = select(Rule).where(Rule.id == rule_id)
    result = await session.execute(stmt)
    rule = result.scalar_one_or_none()
    if not rule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rule not found")
    
    for field, value in rule_data.model_dump(exclude_unset=True).items():
        setattr(rule, field, value)
    
    await session.commit()
    await session.refresh(rule)
    return rule


@router.delete("/rules/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_rule(
    rule_id: uuid.UUID,
    session: AsyncSession = Depends(get_db_session),
    admin_user: User = Depends(get_admin_user),
) -> None:
    stmt = select(Rule).where(Rule.id == rule_id)
    result = await session.execute(stmt)
    rule = result.scalar_one_or_none()
    if not rule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rule not found")
    
    await session.delete(rule)
    await session.commit()


# Social links management
@router.get("/social", response_model=SocialLinksRead)
async def get_social_links_admin(
    session: AsyncSession = Depends(get_db_session),
    admin_user: User = Depends(get_admin_user),
) -> SocialLinksRead:
    stmt = select(SocialLink).order_by(SocialLink.display_order)
    result = await session.execute(stmt)
    links = result.scalars().all()
    payload = {link.platform.lower(): link.url for link in links}
    return SocialLinksRead(**payload)


@router.patch("/social", response_model=SocialLinksRead)
async def update_social_links(
    social_data: SocialLinksUpdate,
    session: AsyncSession = Depends(get_db_session),
    admin_user: User = Depends(get_admin_user),
) -> SocialLinksRead:
    platforms = ["facebook", "twitter", "discord", "youtube", "tiktok", "instagram"]
    
    for platform in platforms:
        url = getattr(social_data, platform)
        if url is not None:
            stmt = select(SocialLink).where(SocialLink.platform == platform.upper())
            result = await session.execute(stmt)
            link = result.scalar_one_or_none()
            
            if url:  # Update or create
                if link:
                    link.url = url
                else:
                    link = SocialLink(platform=platform.upper(), url=url)
                    session.add(link)
            elif link:  # Delete if empty string
                await session.delete(link)
    
    await session.commit()
    
    # Return updated links
    stmt = select(SocialLink).order_by(SocialLink.display_order)
    result = await session.execute(stmt)
    links = result.scalars().all()
    payload = {link.platform.lower(): link.url for link in links}
    return SocialLinksRead(**payload)