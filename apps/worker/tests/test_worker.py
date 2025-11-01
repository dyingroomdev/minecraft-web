import asyncio

import pytest

from worker.main import run_worker
from worker.jobs import example_job


@pytest.mark.asyncio
async def test_example_job_produces_logs(caplog) -> None:
    caplog.set_level("INFO")

    await example_job()

    rendered_messages = [record.getMessage() for record in caplog.records]
    assert any("worker.job.complete" in message for message in rendered_messages)


@pytest.mark.asyncio
async def test_run_worker_stops_when_event_set(monkeypatch) -> None:
    calls = 0

    async def fake_job() -> None:
        nonlocal calls
        calls += 1

    monkeypatch.setattr("worker.main.example_job", fake_job)
    monkeypatch.setattr("worker.main.sync_discord_roles", fake_job)

    stop_event = asyncio.Event()

    async def trigger_stop() -> None:
        await asyncio.sleep(0.05)
        stop_event.set()

    trigger_task = asyncio.create_task(trigger_stop())
    worker_task = asyncio.create_task(run_worker(stop_event))

    await asyncio.wait_for(worker_task, timeout=1)
    await trigger_task

    assert calls >= 1
