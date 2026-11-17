.PHONY: help install dev build test lint clean docker-up docker-down

help:
	@echo "NoteNest — AI Lecture Notes Summarizer"
	@echo ""
	@echo "Available commands:"
	@echo "  make install     Install backend and frontend dependencies"
	@echo "  make dev         Run backend and frontend servers in development mode"
	@echo "  make build       Build frontend bundle"
	@echo "  make test        Run pytest test suite with coverage"
	@echo "  make lint        Run ruff linter"
	@echo "  make docker-up   Start application using Docker Compose"
	@echo "  make docker-down Stop Docker Compose application"

install:
	pip install -r backend/requirements.txt
	cd frontend && npm install

build:
	cd frontend && npm run build

dev: build
	uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload

test:
	pytest backend/tests -v --cov=backend/app --cov-report=term-missing

lint:
	ruff check backend

docker-up:
	docker compose up --build -d

docker-down:
	docker compose down
