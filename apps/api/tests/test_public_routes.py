import uuid
from datetime import datetime, timedelta, timezone

import pytest

from app.db.models import (
    Event,
    Guild,
    GuildMember,
    Leaderboard,
    NewsPost,
    Player,
    Rank,
    Rule,
    ServerStatus,
    SocialLink,
    VoteLink,
    HeroSlide,
    ServerFeature,
)


@pytest.mark.asyncio
async def test_status_endpoint_returns_latest_snapshot(client, db_session):
    status_row = ServerStatus(status="online", players_online=10, players_max=100, motd="Welcome")
    db_session.add(status_row)
    await db_session.commit()

    response = await client.get("/api/status")
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "online"
    assert payload["players_online"] == 10


@pytest.mark.asyncio
async def test_news_listing_excludes_drafts(client, db_session):
    published = NewsPost(slug="hello", title="Hello", content="World", summary="Summary", is_draft=False)
    draft = NewsPost(slug="draft", title="Draft", content="Hidden", is_draft=True)
    db_session.add_all([published, draft])
    await db_session.commit()

    response = await client.get("/api/news")
    assert response.status_code == 200
    news_items = response.json()
    assert len(news_items) == 1
    assert news_items[0]["slug"] == "hello"


@pytest.mark.asyncio
async def test_news_listing_excludes_future_scheduled(client, db_session):
    future = datetime.now(timezone.utc) + timedelta(days=1)
    scheduled = NewsPost(slug="future", title="Future", content="Soon", is_draft=False, scheduled_publish_at=future)
    db_session.add(scheduled)
    await db_session.commit()

    response = await client.get("/api/news")
    assert response.status_code == 200
    assert response.json() == []

    detail = await client.get("/api/news/future")
    assert detail.status_code == 404


@pytest.mark.asyncio
async def test_rules_endpoint_returns_ordered_rules(client, db_session):
    rule = Rule(
        slug="inform-officials-before-war",
        title="Inform Officials Before War",
        content="Before going to war, inform Server Officials in the designated Discord channel: <your link>.",
        is_pinned=True,
        display_order=0,
    )
    db_session.add(rule)
    await db_session.commit()

    response = await client.get("/api/rules")
    assert response.status_code == 200
    rules = response.json()
    assert rules[0]["is_pinned"] is True


@pytest.mark.asyncio
async def test_events_active_endpoint_filters_by_activity(client, db_session):
    now = datetime.now(timezone.utc)
    active = Event(slug="active", title="Active", description="Desc", is_active=True)
    scheduled = Event(
        slug="scheduled",
        title="Scheduled",
        description="Desc",
        start_at=now,
        end_at=now,
        is_active=False,
    )
    inactive = Event(slug="inactive", title="Inactive", description="Desc", is_active=False)
    db_session.add_all([active, scheduled, inactive])
    await db_session.commit()

    response = await client.get("/api/events/active")
    assert response.status_code == 200
    events = {item["slug"] for item in response.json()}
    assert "active" in events
    assert "scheduled" in events
    assert "inactive" not in events


@pytest.mark.asyncio
async def test_events_calendar_and_listing_endpoints(client, db_session):
    now = datetime.now(timezone.utc)
    first_event = Event(slug="build", title="Build Jam", description="Collaborative build night", start_at=now, is_active=True)
    second_event = Event(slug="tournament", title="PvP Cup", description="Competitive bracket", start_at=now + timedelta(days=7), location="Arena")
    db_session.add_all([first_event, second_event])
    await db_session.commit()

    listing = await client.get("/api/events")
    assert listing.status_code == 200
    assert len(listing.json()) == 2

    ics = await client.get("/api/events/calendar.ics")
    assert ics.status_code == 200
    assert ics.headers["content-type"].startswith("text/calendar")
    assert "SUMMARY:Build Jam" in ics.text


@pytest.mark.asyncio
async def test_leaderboards_endpoint_returns_entries(client, db_session):
    leaderboard = Leaderboard(
        season="s1",
        leaderboard_type="kills",
        entries=[{"player": "Player1", "score": 20, "position": 1}],
        meta_data={"mode": "pvp"},
    )
    db_session.add(leaderboard)
    await db_session.commit()

    response = await client.get("/api/leaderboards/s1/kills")
    assert response.status_code == 200
    payload = response.json()
    assert payload["season"] == "s1"
    assert payload["entries"][0]["player"] == "Player1"


@pytest.mark.asyncio
async def test_players_endpoint_returns_player_profile(client, db_session):
    player_uuid = uuid.uuid4()
    rank = Rank(name="KNIGHT", display_name="Knight", priority=10)
    player = Player(minecraft_uuid=player_uuid, username="Hero", rank=rank, stats={"kills": 5})
    guild = Guild(name="GuildName", tag="GUILD")
    db_session.add_all([rank, player, guild])
    await db_session.flush()

    membership = GuildMember(guild_id=guild.id, player_id=player.id)
    db_session.add(membership)
    await db_session.commit()

    response = await client.get(f"/api/players/{player_uuid}")
    assert response.status_code == 200
    payload = response.json()
    assert payload["username"] == "Hero"
    assert payload["rank"]["name"] == "KNIGHT"
    assert payload["guild"]["tag"] == "GUILD"


@pytest.mark.asyncio
async def test_social_endpoint_returns_links(client, db_session):
    db_session.add_all(
        [
            SocialLink(platform="discord", url="https://discord.gg/example"),
            SocialLink(platform="twitter", url="https://twitter.com/example"),
        ]
    )
    await db_session.commit()

    response = await client.get("/api/social")
    assert response.status_code == 200
    payload = response.json()
    assert payload["discord"] == "https://discord.gg/example"
    assert payload["twitter"] == "https://twitter.com/example"


@pytest.mark.asyncio
async def test_votes_endpoint_returns_active_links(client, db_session):
    active = VoteLink(
        title="Vote Site 1",
        url="https://vote1.example.com",
        button_text="Vote",
        rewards=["Reward 1"],
        display_order=1,
    )
    inactive = VoteLink(
        title="Vote Site 2",
        url="https://vote2.example.com",
        button_text="Vote",
        rewards=["Reward 2"],
        display_order=0,
        is_active=False,
    )
    db_session.add_all([active, inactive])
    await db_session.commit()

    response = await client.get("/api/votes")
    assert response.status_code == 200
    votes = response.json()
    assert len(votes) == 1
    assert votes[0]["title"] == "Vote Site 1"


@pytest.mark.asyncio
async def test_hero_slides_endpoint_returns_active_slides(client, db_session):
    slide = HeroSlide(
        title="Slide 1",
        subtitle="Subtitle",
        image_url="https://cdn.example.com/slide.jpg",
        button_text="Play Now",
        button_url="https://play.example.com",
        display_order=1,
    )
    inactive = HeroSlide(
        title="Slide Hidden",
        is_active=False,
    )
    db_session.add_all([slide, inactive])
    await db_session.commit()

    response = await client.get("/api/hero-slides")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["title"] == "Slide 1"


@pytest.mark.asyncio
async def test_features_endpoint_returns_active_features(client, db_session):
    feature = ServerFeature(
        title="Skyblock Adventures",
        description="Explore custom islands with friends.",
        icon="IslandIcon",
        display_order=0,
    )
    db_session.add(feature)
    await db_session.commit()

    response = await client.get("/api/features")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["title"] == "Skyblock Adventures"
