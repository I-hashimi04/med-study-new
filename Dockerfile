# Multi-stage Dockerfile for Med Study Hub
FROM node:18-alpine AS frontend-build

# Set working directory for frontend
WORKDIR /app/frontend

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy frontend source
COPY src/ ./src/
COPY public/ ./public/

# Build frontend
RUN npm run build

# Python backend stage
FROM python:3.12-slim AS backend

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy Python requirements
COPY python_worker/requirements.txt ./

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY python_worker/ ./python_worker/
COPY data/ ./data/

# Copy built frontend
COPY --from=frontend-build /app/frontend/build ./static

# Create database directory
RUN mkdir -p /app/data

# Expose port
EXPOSE 8000

# Set environment variables
ENV PYTHONPATH=/app
ENV DATABASE_PATH=/app/data/med-study.db

# Create startup script
RUN echo '#!/bin/bash\n\
cd /app/python_worker\n\
python -c "from app import init_db; init_db()"\n\
uvicorn app:app --host 0.0.0.0 --port 8000\n\
' > /app/start.sh && chmod +x /app/start.sh

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/ || exit 1

# Start the application
CMD ["/app/start.sh"]