FROM python:3.11-slim

WORKDIR /app

# Install Node.js for frontend build
RUN apt-get update && apt-get install -y curl gnupg && \
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# Copy dependency files first (layer caching)
COPY backend/requirements.txt backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy frontend deps and build
COPY frontend/package.json frontend/
WORKDIR /app/frontend
RUN npm install --legacy-peer-deps
COPY frontend/ .
RUN npm run build || true

# Copy backend
WORKDIR /app
COPY backend/ backend/
COPY main.py .

# Start FastAPI
CMD uvicorn main:app --host 0.0.0.0 --port $PORT