"""Administrative CRUD endpoints secured by RBAC."""

from __future__ import annotations

import re
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_admin_user, get_db_session, require_admin, require_roles
from app.core.enums import AdminRole, RBACRole
from app.db.models import AdminUser
from app.db.models import (
    Event,
    HeroSlide,
    Leaderboard,
    NewsPost,
    Rule,
    ServerFeature,
    SocialLink,
    User,
    VoteLink,
)
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
    RuleReorder,
    SocialLinksRead,
    SocialLinksUpdate,
    VoteLinkCreate,
    VoteLinkRead,
    VoteLinkUpdate,
    HeroSlideCreate,
    HeroSlideRead,
    HeroSlideUpdate,
    ServerFeatureCreate,
    ServerFeatureRead,
    ServerFeatureUpdate,
)
from app.middleware.security import sanitize_markdown, sanitize_text


router = APIRouter()


def _generate_slug(value: str) -> str:
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", value.strip().lower()).strip("-")
    return slug or str(uuid.uuid4())


async def _ensure_unique_slug(
    session: AsyncSession,
    slug: str,
    exclude_id: uuid.UUID | None = None,
) -> str:
    candidate = slug
    suffix = 2

    while True:
        stmt = select(NewsPost).where(NewsPost.slug == candidate)
        if exclude_id is not None:
            stmt = stmt.where(NewsPost.id != exclude_id)
        result = await session.execute(stmt)
        existing = result.scalar_one_or_none()
        if existing is None:
            return candidate
        candidate = f"{slug}-{suffix}"
        suffix += 1


async def _generate_unique_slug(session: AsyncSession, title: str) -> str:
    base = _generate_slug(title)
    return await _ensure_unique_slug(session, base)


async def _get_news_or_404(session: AsyncSession, news_id: uuid.UUID) -> NewsPost:
    result = await session.execute(select(NewsPost).where(NewsPost.id == news_id))
    news = result.scalar_one_or_none()
    if news is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="News post not found")
    return news


@router.get("/news", response_model=list[NewsDetail])
async def list_news_admin(
    session: AsyncSession = Depends(get_db_session),
    _: AdminUser = Depends(require_admin()),
) -> list[NewsPost]:
    result = await session.execute(select(NewsPost).order_by(NewsPost.is_pinned.desc(), NewsPost.created_at.desc()))
    return result.scalars().all()


async def _get_event_or_404(session: AsyncSession, event_id: uuid.UUID) -> Event:
    result = await session.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if event is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    return event


@router.get("/events", response_model=list[EventRead])
async def list_events_admin(
    session: AsyncSession = Depends(get_db_session),
    _: AdminUser = Depends(require_admin()),
) -> list[Event]:
    result = await session.execute(select(Event).order_by(Event.start_at.desc(), Event.created_at.desc()))
    return result.scalars().all()


async def _get_rule_or_404(session: AsyncSession, rule_id: uuid.UUID) -> Rule:
    result = await session.execute(select(Rule).where(Rule.id == rule_id))
    rule = result.scalar_one_or_none()
    if rule is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rule not found")
    return rule


@router.get("/rules", response_model=list[RuleRead])
async def list_rules_admin(
    session: AsyncSession = Depends(get_db_session),
    _: AdminUser = Depends(require_admin()),
) -> list[Rule]:
    result = await session.execute(
        select(Rule).order_by(Rule.is_pinned.desc(), Rule.display_order, Rule.created_at)
    )
    return result.scalars().all()


async def _get_vote_link_or_404(session: AsyncSession, vote_id: uuid.UUID) -> VoteLink:
    result = await session.execute(select(VoteLink).where(VoteLink.id == vote_id))
    vote_link = result.scalar_one_or_none()
    if vote_link is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vote link not found")
    return vote_link


async def _get_hero_slide_or_404(session: AsyncSession, slide_id: uuid.UUID) -> HeroSlide:
    result = await session.execute(select(HeroSlide).where(HeroSlide.id == slide_id))
    slide = result.scalar_one_or_none()
    if slide is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hero slide not found")
    return slide


async def _get_server_feature_or_404(session: AsyncSession, feature_id: uuid.UUID) -> ServerFeature:
    result = await session.execute(select(ServerFeature).where(ServerFeature.id == feature_id))
    feature = result.scalar_one_or_none()
    if feature is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Server feature not found")
    return feature


@router.post("/news", response_model=NewsDetail, status_code=status.HTTP_201_CREATED)
async def create_news(
    payload: NewsCreate,
    session: AsyncSession = Depends(get_db_session),
    _: AdminUser = Depends(require_admin(AdminRole.SUPER_ADMIN)),
) -> NewsPost:
    data = payload.model_dump()
    requested_slug = data.get("slug")

    if requested_slug:
        data["slug"] = await _ensure_unique_slug(session, _generate_slug(requested_slug))
    else:
        data["slug"] = await _generate_unique_slug(session, payload.title)

    if data.get("content"):
        data["content"] = sanitize_markdown(data["content"])

    data["title"] = sanitize_text(data.get("title"))
    if data.get("summary") is not None:
        data["summary"] = sanitize_text(data.get("summary"))
    if data.get("cover_image_url") is not None:
        data["cover_image_url"] = sanitize_text(data.get("cover_image_url"))

    now = datetime.now(timezone.utc)
    scheduled = data.get("scheduled_publish_at")
    if not data.get("is_draft"):
        if scheduled and scheduled <= now:
            data.setdefault("published_at", scheduled)
        elif not scheduled and data.get("published_at") is None:
            data["published_at"] = now

    news = NewsPost(**data)
    session.add(news)
    await session.commit()
    await session.refresh(news)
    return news


@router.patch("/news/{news_id}", response_model=NewsDetail)
async def update_news(
    news_id: uuid.UUID,
    payload: NewsUpdate,
    session: AsyncSession = Depends(get_db_session),
    _: AdminUser = Depends(require_admin(AdminRole.SUPER_ADMIN)),
) -> NewsPost:
    news = await _get_news_or_404(session, news_id)
    updates = payload.model_dump(exclude_unset=True)
    if updates.get("content"):
        updates["content"] = sanitize_markdown(updates["content"])
    if updates.get("title"):
        updates["title"] = sanitize_text(updates["title"])
    if "summary" in updates and updates["summary"] is not None:
        updates["summary"] = sanitize_text(updates["summary"])
    if "cover_image_url" in updates and updates["cover_image_url"] is not None:
        updates["cover_image_url"] = sanitize_text(updates["cover_image_url"])
    if updates.get("slug"):
        updates["slug"] = await _ensure_unique_slug(session, _generate_slug(updates["slug"]), exclude_id=news.id)

    for field, value in updates.items():
        setattr(news, field, value)

    if not news.is_draft:
        now = datetime.now(timezone.utc)
        if news.scheduled_publish_at and news.scheduled_publish_at <= now:
            news.published_at = news.scheduled_publish_at
        elif news.published_at is None and news.scheduled_publish_at is None:
            news.published_at = now

    await session.commit()
    await session.refresh(news)
    return news


@router.delete("/news/{news_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_news(
    news_id: uuid.UUID,
    session: AsyncSession = Depends(get_db_session),
    _: AdminUser = Depends(require_admin(AdminRole.SUPER_ADMIN)),
) -> None:
    news = await _get_news_or_404(session, news_id)
    await session.delete(news)
    await session.commit()
    return None


@router.post("/events", response_model=EventRead, status_code=status.HTTP_201_CREATED)
async def create_event(
    payload: EventCreate,
    session: AsyncSession = Depends(get_db_session),
    _: AdminUser = Depends(require_admin(AdminRole.SUPER_ADMIN)),
) -> Event:
    event = Event(**payload.model_dump())
    session.add(event)
    await session.commit()
    await session.refresh(event)
    return event


@router.patch("/events/{event_id}", response_model=EventRead)
async def update_event(
    event_id: uuid.UUID,
    payload: EventUpdate,
    session: AsyncSession = Depends(get_db_session),
    _: AdminUser = Depends(require_admin(AdminRole.SUPER_ADMIN)),
) -> Event:
    event = await _get_event_or_404(session, event_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(event, field, value)
    await session.commit()
    await session.refresh(event)
    return event


@router.delete("/events/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event(
    event_id: uuid.UUID,
    session: AsyncSession = Depends(get_db_session),
    _: AdminUser = Depends(require_admin(AdminRole.SUPER_ADMIN)),
) -> None:
    event = await _get_event_or_404(session, event_id)
    await session.delete(event)
    await session.commit()
    return None


@router.post("/rules", response_model=RuleRead, status_code=status.HTTP_201_CREATED)
async def create_rule(
    payload: RuleCreate,
    session: AsyncSession = Depends(get_db_session),
    _: AdminUser = Depends(require_admin(AdminRole.SUPER_ADMIN)),
) -> Rule:
    data = payload.model_dump()
    data["title"] = sanitize_text(data["title"])
    data["content"] = sanitize_markdown(data["content"])
    if data.get("category") is not None:
        data["category"] = sanitize_text(data["category"])

    rule = Rule(**data)
    session.add(rule)
    await session.commit()
    await session.refresh(rule)
    return rule


@router.patch("/rules/{rule_id}", response_model=RuleRead)
async def update_rule(
    rule_id: uuid.UUID,
    payload: RuleUpdate,
    session: AsyncSession = Depends(get_db_session),
    _: AdminUser = Depends(require_admin(AdminRole.SUPER_ADMIN)),
) -> Rule:
    rule = await _get_rule_or_404(session, rule_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        if field == "content" and value is not None:
            value = sanitize_markdown(value)
        if field == "title" and value is not None:
            value = sanitize_text(value)
        if field == "category" and value is not None:
            value = sanitize_text(value)
        setattr(rule, field, value)
    await session.commit()
    await session.refresh(rule)
    return rule


@router.delete("/rules/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_rule(
    rule_id: uuid.UUID,
    session: AsyncSession = Depends(get_db_session),
    _: AdminUser = Depends(require_admin(AdminRole.SUPER_ADMIN)),
) -> None:
    rule = await _get_rule_or_404(session, rule_id)
    await session.delete(rule)
    await session.commit()
    return None


@router.post("/rules/reorder", status_code=status.HTTP_204_NO_CONTENT)
async def reorder_rules(
    payload: RuleReorder,
    session: AsyncSession = Depends(get_db_session),
    _: AdminUser = Depends(require_admin(AdminRole.SUPER_ADMIN)),
) -> None:
    result = await session.execute(
        select(Rule).order_by(Rule.is_pinned.desc(), Rule.display_order, Rule.created_at)
    )
    rules = result.scalars().all()

    pinned = [rule for rule in rules if rule.is_pinned]
    movable = [rule for rule in rules if not rule.is_pinned]
    movable_ids = {rule.id for rule in movable}

    if set(payload.order) != movable_ids or len(payload.order) != len(movable):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Order must include all non-pinned rules")

    for index, pinned_rule in enumerate(pinned):
        pinned_rule.display_order = index

    offset = len(pinned)
    lookup = {rule.id: rule for rule in movable}
    for position, rule_id in enumerate(payload.order, start=offset):
        lookup[rule_id].display_order = position

    await session.commit()
    return None


@router.get("/votes", response_model=list[VoteLinkRead])
async def list_vote_links(
    session: AsyncSession = Depends(get_db_session),
    _: AdminUser = Depends(require_admin()),
) -> list[VoteLink]:
    result = await session.execute(select(VoteLink).order_by(VoteLink.display_order, VoteLink.created_at))
    return result.scalars().all()


@router.post("/votes", response_model=VoteLinkRead, status_code=status.HTTP_201_CREATED)
async def create_vote_link(
    payload: VoteLinkCreate,
    session: AsyncSession = Depends(get_db_session),
    _: AdminUser = Depends(require_admin()),
) -> VoteLink:
    import json
    from sqlalchemy import text
    
    # Use raw SQL to bypass MutableList issues
    vote_id = uuid.uuid4()
    rewards_json = json.dumps(payload.rewards or [])
    
    await session.execute(
        text("""
            INSERT INTO vote_links (id, title, description, url, button_text, rewards, display_order, is_active, created_at, updated_at)
            VALUES (:id, :title, :description, :url, :button_text, :rewards, :display_order, :is_active, NOW(), NOW())
        """),
        {
            "id": vote_id,
            "title": payload.title,
            "description": payload.description,
            "url": payload.url,
            "button_text": payload.button_text,
            "rewards": rewards_json,
            "display_order": payload.display_order,
            "is_active": payload.is_active
        }
    )
    await session.commit()
    
    # Fetch the created record
    result = await session.execute(select(VoteLink).where(VoteLink.id == vote_id))
    return result.scalar_one()


@router.patch("/votes/{vote_id}", response_model=VoteLinkRead)
async def update_vote_link(
    vote_id: uuid.UUID,
    payload: VoteLinkUpdate,
    session: AsyncSession = Depends(get_db_session),
    _: AdminUser = Depends(require_admin()),
) -> VoteLink:
    vote_link = await _get_vote_link_or_404(session, vote_id)
    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(vote_link, field, value)
    await session.commit()
    await session.refresh(vote_link)
    return vote_link


@router.delete("/votes/{vote_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vote_link(
    vote_id: uuid.UUID,
    session: AsyncSession = Depends(get_db_session),
    _: AdminUser = Depends(require_admin()),
) -> None:
    vote_link = await _get_vote_link_or_404(session, vote_id)
    await session.delete(vote_link)
    await session.commit()
    return None


async def _collect_social_links(session: AsyncSession) -> SocialLinksRead:
    result = await session.execute(select(SocialLink).order_by(SocialLink.display_order))
    links = {link.platform.lower(): link.url for link in result.scalars().all()}
    return SocialLinksRead(**links)


@router.get("/social", response_model=SocialLinksRead)
async def get_social_links_admin(
    session: AsyncSession = Depends(get_db_session),
    _: AdminUser = Depends(require_admin()),
) -> SocialLinksRead:
    return await _collect_social_links(session)


@router.patch("/social", response_model=SocialLinksRead)
async def update_social_links(
    payload: SocialLinksUpdate,
    session: AsyncSession = Depends(get_db_session),
    _: AdminUser = Depends(require_admin(AdminRole.SUPER_ADMIN)),
) -> SocialLinksRead:
    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields provided")

    for platform_key, url in updates.items():
        if not url:  # Skip null/empty URLs
            continue
        normalized = platform_key.lower()
        result = await session.execute(select(SocialLink).where(SocialLink.platform == normalized))
        record = result.scalar_one_or_none()
        if record is None:
            record = SocialLink(platform=normalized, url=url)
            session.add(record)
        else:
            record.url = url
    await session.commit()
    return await _collect_social_links(session)


@router.get("/hero-slides", response_model=list[HeroSlideRead])
async def list_hero_slides_admin(
    session: AsyncSession = Depends(get_db_session),
    _: AdminUser = Depends(require_admin()),
) -> list[HeroSlide]:
    result = await session.execute(select(HeroSlide).order_by(HeroSlide.display_order, HeroSlide.created_at))
    return result.scalars().all()


@router.post("/hero-slides", response_model=HeroSlideRead, status_code=status.HTTP_201_CREATED)
async def create_hero_slide(
    payload: HeroSlideCreate,
    session: AsyncSession = Depends(get_db_session),
    _: AdminUser = Depends(require_admin(AdminRole.SUPER_ADMIN)),
) -> HeroSlide:
    data = payload.model_dump()
    data["title"] = sanitize_text(data.get("title"))
    data["subtitle"] = sanitize_text(data.get("subtitle"))
    data["button_text"] = sanitize_text(data.get("button_text"))
    slide = HeroSlide(**data)
    session.add(slide)
    await session.commit()
    await session.refresh(slide)
    return slide


@router.patch("/hero-slides/{slide_id}", response_model=HeroSlideRead)
async def update_hero_slide(
    slide_id: uuid.UUID,
    payload: HeroSlideUpdate,
    session: AsyncSession = Depends(get_db_session),
    _: AdminUser = Depends(require_admin(AdminRole.SUPER_ADMIN)),
) -> HeroSlide:
    slide = await _get_hero_slide_or_404(session, slide_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        if field in {"title", "subtitle", "button_text"} and value is not None:
            value = sanitize_text(value)
        setattr(slide, field, value)
    await session.commit()
    await session.refresh(slide)
    return slide


@router.delete("/hero-slides/{slide_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_hero_slide(
    slide_id: uuid.UUID,
    session: AsyncSession = Depends(get_db_session),
    _: AdminUser = Depends(require_admin(AdminRole.SUPER_ADMIN)),
) -> None:
    slide = await _get_hero_slide_or_404(session, slide_id)
    await session.delete(slide)
    await session.commit()
    return None


@router.get("/features", response_model=list[ServerFeatureRead])
async def list_server_features_admin(
    session: AsyncSession = Depends(get_db_session),
    _: AdminUser = Depends(require_admin()),
) -> list[ServerFeature]:
    result = await session.execute(select(ServerFeature).order_by(ServerFeature.display_order, ServerFeature.created_at))
    return result.scalars().all()


@router.post("/features", response_model=ServerFeatureRead, status_code=status.HTTP_201_CREATED)
async def create_server_feature(
    payload: ServerFeatureCreate,
    session: AsyncSession = Depends(get_db_session),
    _: AdminUser = Depends(require_admin(AdminRole.SUPER_ADMIN)),
) -> ServerFeature:
    data = payload.model_dump()
    data["description"] = sanitize_markdown(data["description"])
    data["title"] = sanitize_text(data.get("title"))
    data["icon"] = sanitize_text(data.get("icon"))
    feature = ServerFeature(**data)
    session.add(feature)
    await session.commit()
    await session.refresh(feature)
    return feature


@router.patch("/features/{feature_id}", response_model=ServerFeatureRead)
async def update_server_feature(
    feature_id: uuid.UUID,
    payload: ServerFeatureUpdate,
    session: AsyncSession = Depends(get_db_session),
    _: AdminUser = Depends(require_admin(AdminRole.SUPER_ADMIN)),
) -> ServerFeature:
    feature = await _get_server_feature_or_404(session, feature_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        if field == "description" and value is not None:
            value = sanitize_markdown(value)
        if field in {"title", "icon"} and value is not None:
            value = sanitize_text(value)
        setattr(feature, field, value)
    await session.commit()
    await session.refresh(feature)
    return feature


@router.delete("/features/{feature_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_server_feature(
    feature_id: uuid.UUID,
    session: AsyncSession = Depends(get_db_session),
    _: AdminUser = Depends(require_admin(AdminRole.SUPER_ADMIN)),
) -> None:
    feature = await _get_server_feature_or_404(session, feature_id)
    await session.delete(feature)
    await session.commit()
    return None


@router.post("/leaderboards/upload", status_code=status.HTTP_200_OK)
async def upload_leaderboard(
    session: AsyncSession = Depends(get_db_session),
    _: AdminUser = Depends(require_admin()),
) -> dict[str, str]:
    """Placeholder endpoint for leaderboard upload functionality."""
    # This is a minimal implementation to prevent 404 errors
    # Add actual leaderboard upload logic here when needed
    return {"message": "Leaderboard upload endpoint - not yet implemented"}
