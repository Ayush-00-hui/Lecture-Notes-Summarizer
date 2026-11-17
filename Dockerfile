# Multi-stage Dockerfile for NoteNest
# Stage 1: Build the React + Vite frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Python backend with static frontend assets
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies (including tesseract-ocr if available)
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    libreoffice-writer \
    libreoffice-calc \
    libreoffice-impress \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./backend/
COPY pytest.ini ./

# Copy built frontend from Stage 1 into frontend/dist
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

EXPOSE 8000

ENV PYTHONUNBUFFERED=1
ENV PORT=8000

CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
