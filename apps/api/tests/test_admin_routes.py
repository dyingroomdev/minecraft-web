import uuid
from datetime import datetime, timezone
from decimal import Decimal

import pytest

from sqlalchemy import select

from app.core.enums import RBACRole
from app.db.models import (
    AuditLog,
    Event,
    HeroSlide,
    Leaderboard,
    NewsPost,
    PaymentRequest,
    Rule,
    RankProduct,
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
async def test_admin_news_slug_auto_and_publish_timestamp(client, db_session, settings_override):
    _, access_token = await _issue_token_for_user(db_session, settings_override, [RBACRole.ADMIN.value])

    response = await client.post(
        "/admin/news",
        headers={"Authorization": f"Bearer {access_token}"},
        json={
            "title": "Mega Update",
            "content": "<script>alert(1)</script><p>Content</p>",
            "is_draft": False,
        },
    )
    assert response.status_code == 201, response.text
    payload = response.json()
    assert payload["slug"].startswith("mega-update")
    assert payload["published_at"] is not None
    assert "<script>" not in payload["content"]

    response_dupe = await client.post(
        "/admin/news",
        headers={"Authorization": f"Bearer {access_token}"},
        json={
            "title": "Mega Update",
            "content": "Details",
            "is_draft": False,
        },
    )
    assert response_dupe.status_code == 201
    assert response_dupe.json()["slug"] != payload["slug"]


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
async def test_admin_rules_reorder(client, db_session, settings_override):
    _, access_token = await _issue_token_for_user(db_session, settings_override, [RBACRole.ADMIN.value])

    pinned = Rule(slug="pinned", title="Pinned", content="Pinned", is_pinned=True, display_order=0)
    first = Rule(slug="first", title="First", content="First", display_order=1)
    second = Rule(slug="second", title="Second", content="Second", display_order=2)
    db_session.add_all([pinned, first, second])
    await db_session.commit()

    response = await client.post(
        "/admin/rules/reorder",
        headers={"Authorization": f"Bearer {access_token}"},
        json={"order": [str(second.id), str(first.id)]},
    )

    assert response.status_code == 204
    await db_session.refresh(first)
    await db_session.refresh(second)
    await db_session.refresh(pinned)
    assert pinned.display_order == 0
    assert second.display_order == 1
    assert first.display_order == 2


@pytest.mark.asyncio
async def test_admin_rules_reorder_validates_input(client, db_session, settings_override):
    _, access_token = await _issue_token_for_user(db_session, settings_override, [RBACRole.ADMIN.value])

    rule = Rule(slug="rule-a", title="Rule A", content="Content", display_order=0)
    db_session.add(rule)
    await db_session.commit()

    response = await client.post(
        "/admin/rules/reorder",
        headers={"Authorization": f"Bearer {access_token}"},
        json={"order": []},
    )

    assert response.status_code == 400


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


@pytest.mark.asyncio
async def test_admin_retry_payment_enqueue(client, db_session, settings_override):
    _, access_token = await _issue_token_for_user(db_session, settings_override, [RBACRole.ADMIN.value])

    product = RankProduct(
        rank_code="VIP",
        display_name="VIP",
        price_bdt=Decimal("500.00"),
        duration_days=None,
        luckperms_group="vip",
    )
    db_session.add(product)
    await db_session.flush()

    payment = PaymentRequest(
        rank_product_id=product.id,
        mc_username="PlayerOne",
        bkash_txid="TX123",
        amount_bdt=Decimal("500.00"),
        status="approved",
    )
    db_session.add(payment)
    await db_session.commit()

    response = await client.post(
        f"/admin/retry/{payment.id}",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["payment_id"] == str(payment.id)

    dummy_redis = client.app.state.test_dummy_redis
    assert dummy_redis.lists["fulfill_rank_queue"][0] == str(payment.id)

    audit_result = await db_session.execute(
        select(AuditLog).where(AuditLog.action == "payment_retry")
    )
    audit_entry = audit_result.scalar_one()
    assert audit_entry.meta_data["payment_request_id"] == str(payment.id)


@pytest.mark.asyncio
async def test_admin_retry_payment_validates_status(client, db_session, settings_override):
    _, access_token = await _issue_token_for_user(db_session, settings_override, [RBACRole.ADMIN.value])

    product = RankProduct(
        rank_code="MVP",
        display_name="MVP",
        price_bdt=Decimal("800.00"),
        duration_days=None,
        luckperms_group="mvp",
    )
    db_session.add(product)
    await db_session.flush()

    payment = PaymentRequest(
        rank_product_id=product.id,
        mc_username="PlayerTwo",
        bkash_txid="TX124",
        amount_bdt=Decimal("800.00"),
        status="pending",
    )
    db_session.add(payment)
    await db_session.commit()

    response = await client.post(
        f"/admin/retry/{payment.id}",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_admin_audit_export_returns_csv(client, db_session, settings_override):
    admin_user, access_token = await _issue_token_for_user(
        db_session, settings_override, [RBACRole.ADMIN.value]
    )

    audit = AuditLog(
        user_id=admin_user.id,
        action="test_action",
        meta_data={"foo": "bar"},
        notes="sample",
    )
    db_session.add(audit)
    await db_session.commit()

    response = await client.get(
        "/admin/audit/export?limit=10",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/csv")
    body = response.text
    assert "test_action" in body

    export_audit = await db_session.execute(
        select(AuditLog).where(AuditLog.action == "audit_export")
    )
    assert export_audit.scalar_one() is not None


@pytest.mark.asyncio
async def test_admin_leaderboard_upload_csv(client, db_session, settings_override):
    _, access_token = await _issue_token_for_user(db_session, settings_override, [RBACRole.ADMIN.value])

    csv_content = "player,score\nHero,25\nChampion,20\n"
    response = await client.post(
        "/admin/leaderboards/upload",
        headers={"Authorization": f"Bearer {access_token}"},
        data={"season": "s1", "leaderboard_type": "kills", "title": "Top Kills"},
        files={"file": ("kills.csv", csv_content, "text/csv")},
    )

    assert response.status_code == 201, response.text
    payload = response.json()
    assert payload["season"] == "s1"
    assert payload["leaderboard_type"] == "kills"
    assert payload["metadata"]["available_types"] == ["kills"]
    assert len(payload["entries"]) == 2

    stored = await db_session.execute(
        select(Leaderboard).where(Leaderboard.season == "s1", Leaderboard.leaderboard_type == "kills")
    )
    leaderboard = stored.scalar_one()
    assert leaderboard.title == "Top Kills"


@pytest.mark.asyncio
async def test_leaderboard_cache_invalidates_after_upload(client, db_session, settings_override):
    leaderboard = Leaderboard(
        season="s2",
        leaderboard_type="overall",
        entries=[{"player": "Alpha", "score": 100, "position": 1, "metadata": {}}],
    )
    db_session.add(leaderboard)
    await db_session.commit()

    first = await client.get("/api/leaderboards/s2/overall")
    assert first.status_code == 200
    assert first.json()["entries"][0]["score"] == 100

    leaderboard.entries = [{"player": "Alpha", "score": 150, "position": 1, "metadata": {}}]
    await db_session.commit()

    second = await client.get("/api/leaderboards/s2/overall")
    assert second.status_code == 200
    assert second.json()["entries"][0]["score"] == 100  # cached value

    _, access_token = await _issue_token_for_user(db_session, settings_override, [RBACRole.ADMIN.value])
    csv_content = "player,score\nAlpha,175\n"
    response = await client.post(
        "/admin/leaderboards/upload",
        headers={"Authorization": f"Bearer {access_token}"},
        data={"season": "s2", "leaderboard_type": "overall"},
        files={"file": ("overall.csv", csv_content, "text/csv")},
    )
    assert response.status_code == 201

    third = await client.get("/api/leaderboards/s2/overall")
    assert third.status_code == 200
    assert third.json()["entries"][0]["score"] == 175
