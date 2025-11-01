.PHONY: help fmt lint test up down seed clean install

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install dependencies for all apps
	cd apps/api && pip install -e .[dev]
	cd apps/worker && pip install -e .[dev]
	cd apps/web && npm install

fmt: ## Format code
	cd apps/api && ruff format .
	cd apps/worker && ruff format .
	cd apps/web && npm run format || true

lint: ## Lint code
	cd apps/api && ruff check . && mypy .
	cd apps/worker && ruff check . && mypy .
	cd apps/web && npm run lint || true

test: ## Run all tests
	cd apps/api && pytest
	cd apps/worker && pytest
	cd apps/web && npm run test:e2e

test-unit: ## Run unit tests only
	cd apps/api && pytest --ignore=tests/e2e
	cd apps/worker && pytest

test-e2e: ## Run E2E tests only
	cd apps/web && npm run test:e2e

up: ## Start all services
	docker compose up --build -d

down: ## Stop all services
	docker compose down

seed: ## Run database migrations and seed data
	cd apps/api && alembic upgrade head

clean: ## Clean up containers and volumes
	docker compose down -v
	docker system prune -f

logs: ## Show logs for all services
	docker compose logs -f

logs-api: ## Show API logs
	docker compose logs -f api

logs-worker: ## Show worker logs
	docker compose logs -f worker

logs-web: ## Show web logs
	docker compose logs -f web

shell-api: ## Open shell in API container
	docker compose exec api bash

shell-worker: ## Open shell in worker container
	docker compose exec worker bash

db-shell: ## Open database shell
	docker compose exec db psql -U postgres -d app

redis-shell: ## Open Redis shell
	docker compose exec redis redis-cli

dev-api: ## Run API in development mode
	cd apps/api && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

dev-worker: ## Run worker in development mode
	cd apps/worker && python -m worker.main

dev-web: ## Run web in development mode
	cd apps/web && npm run dev

check: fmt lint test ## Run all checks (format, lint, test)