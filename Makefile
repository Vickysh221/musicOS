.PHONY: validate-episode validate-tracklist validate-connections validate-transcripts validate-episode-connections validate-python-tests validate-build help

SLUG ?=
EXHIBITION_DIR := musicos-exhibition

help:
	@echo "Targets (SLUG= required unless noted):"
	@echo "  make validate-episode SLUG=<slug>            Run all phase validators in order"
	@echo "  make validate-tracklist SLUG=<slug>          Phase 0 only"
	@echo "  make validate-connections SLUG=<slug>        Phase 1 only"
	@echo "  make validate-transcripts SLUG=<slug>        Phase 2 transcript validator"
	@echo "  make validate-episode-connections SLUG=<slug> Phase 2 connections cross-check"
	@echo "  make validate-python-tests                   Run pytest suite (no SLUG needed)"
	@echo "  make validate-build                          Phase 3 build + tests (no SLUG needed)"

_check_slug:
	@if [ -z "$(SLUG)" ]; then echo "ERROR: SLUG=<slug> required"; exit 2; fi

validate-tracklist: _check_slug
	@echo "==> Phase 0: tracklist"
	python3 tools/validate_tracklist.py $(SLUG)

validate-connections: _check_slug
	@echo "==> Phase 1: connections"
	cd $(EXHIBITION_DIR) && npx tsx scripts/check-connections.ts $(SLUG)

validate-transcripts: _check_slug
	@echo "==> Phase 2a: transcripts"
	python3 tools/validate_episode_transcripts.py $(SLUG)

validate-episode-connections: _check_slug
	@echo "==> Phase 2b: episode/connections cross-check"
	python3 -m tools.validate_episode_connections \
		playlists/$(SLUG).connections.json \
		episodes/$(SLUG).episode.md

validate-python-tests:
	@echo "==> Python tests: pytest"
	python3 -m pytest tests/ -q

validate-build:
	@echo "==> Phase 3: build + tests"
	cd $(EXHIBITION_DIR) && npm run build-data && npm test

validate-episode: _check_slug validate-tracklist validate-connections validate-transcripts validate-episode-connections validate-python-tests validate-build
	@echo ""
	@echo "ALL GREEN: $(SLUG)"
