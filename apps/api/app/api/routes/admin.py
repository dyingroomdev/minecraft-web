"""Administrative CRUD endpoints secured by RBAC."""

from __future__ import annotations

import re
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_admin_user, get_db_session, require_roles
from app.core.enums import RBACRole
from app.db.models import (
    Event,
    HeroSlide,
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


async def _get_news_or_404(session: AsyncSession, news_id: uuid.UUID) -> NewsPost:
    result = await session.execute(select(NewsPost).where(NewsPost.id == news_id))
    news = result.scalar_one_or_none()
    if news is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="News post not found")
    return news


async def _get_event_or_404(session: AsyncSession, event_id: uuid.UUID) -> Event:
    result = await session.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if event is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    return event


async def _get_rule_or_404(session: AsyncSession, rule_id: uuid.UUID) -> Rule:
    result = await session.execute(select(Rule).where(Rule.id == rule_id))
    rule = result.scalar_one_or_none()
    if rule is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rule not found")
    return rule


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
    _: User = Depends(get_admin_user),
) -> NewsPost:
    data = payload.model_dump()
    if not data.get("slug"):
        data["slug"] = _generate_slug(payload.title)
    if data.get("content"):
        data["content"] = sanitize_markdown(data["content"])

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
    _: User = Depends(get_admin_user),
) -> NewsPost:
    news = await _get_news_or_404(session, news_id)
    updates = payload.model_dump(exclude_unset=True)
    if updates.get("content"):
        updates["content"] = sanitize_markdown(updates["content"])
    for field, value in updates.items():
        setattr(news, field, value)
    await session.commit()
    await session.refresh(news)
    return news


@router.delete("/news/{news_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_news(
    news_id: uuid.UUID,
    session: AsyncSession = Depends(get_db_session),
    _: User = Depends(get_admin_user),
) -> None:
    news = await _get_news_or_404(session, news_id)
    await session.delete(news)
    await session.commit()
    return None


@router.post("/events", response_model=EventRead, status_code=status.HTTP_201_CREATED)
async def create_event(
    payload: EventCreate,
    session: AsyncSession = Depends(get_db_session),
    _: User = Depends(require_roles(RBACRole.ADMIN, RBACRole.OWNER, RBACRole.MOD)),
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
    _: User = Depends(require_roles(RBACRole.ADMIN, RBACRole.OWNER, RBACRole.MOD)),
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
    _: User = Depends(require_roles(RBACRole.ADMIN, RBACRole.OWNER)),
) -> None:
    event = await _get_event_or_404(session, event_id)
    await session.delete(event)
    await session.commit()
    return None


@router.post("/rules", response_model=RuleRead, status_code=status.HTTP_201_CREATED)
async def create_rule(
    payload: RuleCreate,
    session: AsyncSession = Depends(get_db_session),
    _: User = Depends(require_roles(RBACRole.ADMIN, RBACRole.OWNER, RBACRole.MOD)),
) -> Rule:
    rule = Rule(**payload.model_dump())
    rule.content = sanitize_markdown(rule.content)
    session.add(rule)
    await session.commit()
    await session.refresh(rule)
    return rule


@router.patch("/rules/{rule_id}", response_model=RuleRead)
async def update_rule(
    rule_id: uuid.UUID,
    payload: RuleUpdate,
    session: AsyncSession = Depends(get_db_session),
    _: User = Depends(require_roles(RBACRole.ADMIN, RBACRole.OWNER, RBACRole.MOD)),
) -> Rule:
    rule = await _get_rule_or_404(session, rule_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        if field == "content" and value is not None:
            value = sanitize_markdown(value)
        setattr(rule, field, value)
    await session.commit()
    await session.refresh(rule)
    return rule


@router.delete("/rules/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_rule(
    rule_id: uuid.UUID,
    session: AsyncSession = Depends(get_db_session),
    _: User = Depends(require_roles(RBACRole.ADMIN, RBACRole.OWNER)),
) -> None:
    rule = await _get_rule_or_404(session, rule_id)
    await session.delete(rule)
    await session.commit()
    return None


@router.get("/votes", response_model=list[VoteLinkRead])
async def list_vote_links(
    session: AsyncSession = Depends(get_db_session),
    _: User = Depends(require_roles(RBACRole.ADMIN, RBACRole.OWNER, RBACRole.MOD)),
) -> list[VoteLink]:
    result = await session.execute(select(VoteLink).order_by(VoteLink.display_order, VoteLink.created_at))
    return result.scalars().all()


@router.post("/votes", response_model=VoteLinkRead, status_code=status.HTTP_201_CREATED)
async def create_vote_link(
    payload: VoteLinkCreate,
    session: AsyncSession = Depends(get_db_session),
    _: User = Depends(require_roles(RBACRole.ADMIN, RBACRole.OWNER)),
) -> VoteLink:
    vote_link = VoteLink(**payload.model_dump())
    session.add(vote_link)
    await session.commit()
    await session.refresh(vote_link)
    return vote_link


@router.patch("/votes/{vote_id}", response_model=VoteLinkRead)
async def update_vote_link(
    vote_id: uuid.UUID,
    payload: VoteLinkUpdate,
    session: AsyncSession = Depends(get_db_session),
    _: User = Depends(require_roles(RBACRole.ADMIN, RBACRole.OWNER)),
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
    _: User = Depends(require_roles(RBACRole.ADMIN, RBACRole.OWNER)),
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
    _: User = Depends(require_roles(RBACRole.ADMIN, RBACRole.OWNER, RBACRole.MOD)),
) -> SocialLinksRead:
    return await _collect_social_links(session)


@router.patch("/social", response_model=SocialLinksRead)
async def update_social_links(
    payload: SocialLinksUpdate,
    session: AsyncSession = Depends(get_db_session),
    _: User = Depends(require_roles(RBACRole.ADMIN, RBACRole.OWNER)),
) -> SocialLinksRead:
    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields provided")

    for platform_key, url in updates.items():
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
    _: User = Depends(require_roles(RBACRole.ADMIN, RBACRole.OWNER, RBACRole.MOD)),
) -> list[HeroSlide]:
    result = await session.execute(select(HeroSlide).order_by(HeroSlide.display_order, HeroSlide.created_at))
    return result.scalars().all()


@router.post("/hero-slides", response_model=HeroSlideRead, status_code=status.HTTP_201_CREATED)
async def create_hero_slide(
    payload: HeroSlideCreate,
    session: AsyncSession = Depends(get_db_session),
    _: User = Depends(require_roles(RBACRole.ADMIN, RBACRole.OWNER)),
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
    _: User = Depends(require_roles(RBACRole.ADMIN, RBACRole.OWNER)),
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
    _: User = Depends(require_roles(RBACRole.ADMIN, RBACRole.OWNER)),
) -> None:
    slide = await _get_hero_slide_or_404(session, slide_id)
    await session.delete(slide)
    await session.commit()
    return None


@router.get("/features", response_model=list[ServerFeatureRead])
async def list_server_features_admin(
    session: AsyncSession = Depends(get_db_session),
    _: User = Depends(require_roles(RBACRole.ADMIN, RBACRole.OWNER, RBACRole.MOD)),
) -> list[ServerFeature]:
    result = await session.execute(select(ServerFeature).order_by(ServerFeature.display_order, ServerFeature.created_at))
    return result.scalars().all()


@router.post("/features", response_model=ServerFeatureRead, status_code=status.HTTP_201_CREATED)
async def create_server_feature(
    payload: ServerFeatureCreate,
    session: AsyncSession = Depends(get_db_session),
    _: User = Depends(require_roles(RBACRole.ADMIN, RBACRole.OWNER)),
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
    _: User = Depends(require_roles(RBACRole.ADMIN, RBACRole.OWNER)),
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
    _: User = Depends(require_roles(RBACRole.ADMIN, RBACRole.OWNER)),
) -> None:
    feature = await _get_server_feature_or_404(session, feature_id)
    await session.delete(feature)
    await session.commit()
    return None
