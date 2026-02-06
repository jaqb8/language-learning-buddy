.PHONY: pr dev migrate test e2e help

dev:
	npm run dev

pr:
	@if [ -z "$(TITLE)" ]; then \
		echo "Error: TITLE is required. Usage: make pr TITLE=\"your title\" [BODY=\"your body\"] [BASE=master] [HEAD=staging]"; \
		exit 1; \
	fi
	gh pr create \
		--base $(BASE) \
		--head $(HEAD) \
		--title "$(TITLE)" \
		$(if $(BODY),--body "$(BODY)",)

migrate:
	npx supabase migration up --linked

test:
	npm run test

e2e:
	npm run test:e2e

.DEFAULT_GOAL := dev

help:
	@echo "Available commands:"
	@echo "  make dev              - Start development server (default)"
	@echo "  make test             - Run vitest"
	@echo "  make e2e              - Run e2e tests in dev mode"
	@echo "  make migrate          - Run Supabase migrations"
	@echo "  make pr TITLE=\"<title>\" [BODY=\"<body>\"] [BASE=master] [HEAD=staging]"
	@echo ""
	@echo "Examples:"
	@echo "  make pr TITLE=\"v1.9.4\""
	@echo "  make pr TITLE=\"v1.9.4\" BODY=\"Release notes here\""
	@echo "  make pr TITLE=\"v1.9.4\" BASE=main HEAD=develop"