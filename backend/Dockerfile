# ListWorks PRO — Backend Dockerfile (FastAPI + ffmpeg)
FROM python:3.11-slim

# Install ffmpeg + DejaVu fonts (needed by the video engine)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    fonts-dejavu-core \
    fonts-dejavu \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Cache deps separately for faster rebuilds
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt \
 && pip install --no-cache-dir emergentintegrations --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/

# Copy the rest of the backend
COPY . .

# Railway provides $PORT
ENV PORT=8001
EXPOSE 8001

CMD ["sh", "-c", "uvicorn server:app --host 0.0.0.0 --port ${PORT:-8001}"]
