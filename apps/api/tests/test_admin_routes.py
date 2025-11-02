import uuid
from datetime import datetime, timezone

import pytest

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
from app.services.auth import AuthService


async def _issue_token_for_user(db_session, settings, roles) -> tuple[User, str]:
    user = User(
        discord_id=str(uuid.uuid4()),
        username="Admin",
        email="admin@example.com",
        avatar=None,
        roles=roles,
    )
    db_session.add(user)
    await db_session.flush()

    service = AuthService(session=db_session, settings=settings)
    bundle = await service.issue_tokens(user=user)
    await db_session.commit()
    return user, bundle.access_token


@pytest.mark.asyncio
async def test_admin_news_create_requires_admin_role(client, db_session, settings_override):
    _, access_token = await _issue_token_for_user(db_session, settings_override, [RBACRole.ADMIN.value])

    response = await client.post(
        "/admin/news",
        headers={"Authorization": f"Bearer {access_token}"},
        json={
            "slug": "new-update",
            "title": "New Update",
            "content": "Details",
            "summary": "Summary",
            "published_at": datetime.now(timezone.utc).isoformat(),
            "is_pinned": True,
        },
    )

    assert response.status_code == 201, response.text
    payload = response.json()
    assert payload["slug"] == "new-update"

    # Ensure persistence
    created = await db_session.get(NewsPost, uuid.UUID(payload["id"]))
    assert created is not None


@pytest.mark.asyncio
async def test_admin_news_create_forbidden_for_player(client, db_session, settings_override):
    _, access_token = await _issue_token_for_user(db_session, settings_override, [RBACRole.PLAYER.value])

    response = await client.post(
        "/admin/news",
        headers={"Authorization": f"Bearer {access_token}"},
        json={
            "slug": "should-fail",
            "title": "Fail",
            "content": "Nope",
        },
    )

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_admin_social_update(client, db_session, settings_override):
    _, access_token = await _issue_token_for_user(
        db_session, settings_override, [RBACRole.ADMIN.value]
    )

    db_session.add(SocialLink(platform="discord", url="https://discord.gg/old"))
    await db_session.commit()

    response = await client.patch(
        "/admin/social",
        headers={"Authorization": f"Bearer {access_token}"},
        json={"discord": "https://discord.gg/new", "twitter": "https://twitter.com/new"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["discord"] == "https://discord.gg/new"
    assert payload["twitter"] == "https://twitter.com/new"


@pytest.mark.asyncio
async def test_admin_event_delete_requires_admin_or_owner(client, db_session, settings_override):
    _, access_token_admin = await _issue_token_for_user(
        db_session, settings_override, [RBACRole.ADMIN.value]
    )
    event = Event(slug="event", title="Event", description="Desc")
    db_session.add(event)
    await db_session.commit()

    response = await client.delete(
        f"/admin/events/{event.id}",
        headers={"Authorization": f"Bearer {access_token_admin}"},
    )

    assert response.status_code == 204
    assert await db_session.get(Event, event.id) is None


@pytest.mark.asyncio
async def test_admin_rule_update_accepts_mod_role(client, db_session, settings_override):
    _, access_token = await _issue_token_for_user(
        db_session, settings_override, [RBACRole.MOD.value]
    )
    rule = Rule(slug="rule", title="Rule", content="Original")
    db_session.add(rule)
    await db_session.commit()

    response = await client.patch(
        f"/admin/rules/{rule.id}",
        headers={"Authorization": f"Bearer {access_token}"},
        json={"content": "Updated"},
    )

    assert response.status_code == 200
    updated = await db_session.get(Rule, rule.id)
    assert updated.content == "Updated"


@pytest.mark.asyncio
async def test_admin_vote_link_crud(client, db_session, settings_override):
    _, access_token = await _issue_token_for_user(
        db_session, settings_override, [RBACRole.ADMIN.value]
    )

    # Create
    response = await client.post(
        "/admin/votes",
        headers={"Authorization": f"Bearer {access_token}"},
        json={
            "title": "Vote Site",
            "description": "Help the server",
            "url": "https://vote.example.com",
            "button_text": "Vote Now",
            "rewards": ["1x Key", "500 Coins"],
            "display_order": 1,
        },
    )
    assert response.status_code == 201, response.text
    vote_payload = response.json()
    vote_id = vote_payload["id"]

    # Update
    response = await client.patch(
        f"/admin/votes/{vote_id}",
        headers={"Authorization": f"Bearer {access_token}"},
        json={"button_text": "Vote Today", "rewards": ["2x Key"]},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["button_text"] == "Vote Today"
    assert payload["rewards"] == ["2x Key"]

    # Delete
    response = await client.delete(
        f"/admin/votes/{vote_id}",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert response.status_code == 204
    assert await db_session.get(VoteLink, vote_id) is None


@pytest.mark.asyncio
async def test_admin_hero_slide_crud(client, db_session, settings_override):
    _, access_token = await _issue_token_for_user(
        db_session, settings_override, [RBACRole.ADMIN.value]
    )

    response = await client.post(
        "/admin/hero-slides",
        headers={"Authorization": f"Bearer {access_token}"},
        json={
            "title": "Welcome",
            "subtitle": "Join us",
            "image_url": "https://cdn.example.com/hero.jpg",
            "button_text": "Play",
            "button_url": "https://play.example.com",
        },
    )
    assert response.status_code == 201
    slide_id = response.json()["id"]

    response = await client.patch(
        f"/admin/hero-slides/{slide_id}",
        headers={"Authorization": f"Bearer {access_token}"},
        json={"button_text": "Join Now", "is_active": False},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["button_text"] == "Join Now"
    assert payload["is_active"] is False

    response = await client.delete(
        f"/admin/hero-slides/{slide_id}",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert response.status_code == 204
    assert await db_session.get(HeroSlide, slide_id) is None


@pytest.mark.asyncio
async def test_admin_server_feature_crud(client, db_session, settings_override):
    _, access_token = await _issue_token_for_user(
        db_session, settings_override, [RBACRole.ADMIN.value]
    )

    response = await client.post(
        "/admin/features",
        headers={"Authorization": f"Bearer {access_token}"},
        json={
            "title": "Custom Dungeons",
            "description": "Explore unique PvE challenges.",
            "icon": "SwordsIcon",
        },
    )
    assert response.status_code == 201
    feature_id = response.json()["id"]

    response = await client.patch(
        f"/admin/features/{feature_id}",
        headers={"Authorization": f"Bearer {access_token}"},
        json={"description": "Explore hand-crafted dungeons."},
    )
    assert response.status_code == 200
    assert response.json()["description"] == "Explore hand-crafted dungeons."

    response = await client.delete(
        f"/admin/features/{feature_id}",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert response.status_code == 204
    assert await db_session.get(ServerFeature, feature_id) is None
