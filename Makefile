# Shortcuts. Run `make help` for the list.
.DEFAULT_GOAL := help
COMPOSE := docker compose

.PHONY: help install dev test test-watch coverage lint format build preview check \
        env up down logs restart rebuild sh up-prod down-prod

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

# ---- local (needs Node 22.12+; see .nvmrc) ----
install: ## Install dependencies (npm ci)
	npm ci

dev: ## Start the Vite dev server on http://localhost:5173
	npm run dev

test: ## Run the unit tests once
	npm run test:run

test-watch: ## Run the unit tests in watch mode
	npm test

coverage: ## Unit tests with a coverage report in coverage/
	npm run test:coverage

lint: ## ESLint
	npm run lint

format: ## Prettier (write)
	npm run format

build: ## Production bundle in dist/
	npm run build

preview: ## Serve dist/ on http://localhost:4173
	npm run preview

check: ## Lint, format check, tests and build (what CI should run)
	npm run check

# ---- Docker ----
env: ## Create .env from .env.example
	@test -f .env && echo ".env already exists" || cp .env.example .env

up: ## Dev server in Docker with hot reload (http://localhost:5173)
	$(COMPOSE) up -d --build

down: ## Stop the Docker dev server
	$(COMPOSE) down

logs: ## Follow the dev server's log
	$(COMPOSE) logs -f ui

restart: ## Restart the dev server container
	$(COMPOSE) restart ui

rebuild: ## Rebuild after package.json changes (refreshes the node_modules volume)
	$(COMPOSE) build ui
	$(COMPOSE) run --rm --no-deps ui npm ci
	$(COMPOSE) up -d --force-recreate ui

sh: ## Shell in the dev container
	$(COMPOSE) exec ui sh

up-prod: ## Production image (nginx) on http://localhost:8082
	$(COMPOSE) --profile prod up -d --build ui-prod

down-prod: ## Stop the production container
	$(COMPOSE) --profile prod stop ui-prod
