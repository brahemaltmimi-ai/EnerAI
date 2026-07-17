FROM python:3.11-slim

WORKDIR /app

# Install Python dependencies first (better layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY backend/app.py .

# Default runtime configuration (overridable via docker-compose / .env)
ENV PYTHONUNBUFFERED=1 \
    DB_PATH=/app/data/energyw.db \
    PORT=8001

# The SQLite DB is normally provided via a bind mount (see docker-compose.yml).
# Create the data directory so the app can still boot (and create an empty DB)
# even if no volume is mounted.
RUN mkdir -p /app/data

EXPOSE 8001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8001/api/health')" || exit 1

CMD ["python", "app.py"]
