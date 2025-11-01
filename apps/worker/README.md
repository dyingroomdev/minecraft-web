# AMZCraft Worker

Asynchronous background worker that handles long-running jobs for the AMZCraft platform.

## Local development

Install dependencies and run the worker loop:

```bash
pip install -e .[dev]
python -m worker.main
```

Run the test suite:

```bash
pytest
```

## Scheduled jobs

- `example_job` – sample heartbeat loop invoked every cycle.
- `sync_discord_roles` – nightly stub that will eventually reconcile Discord guild roles to internal RBAC roles.
