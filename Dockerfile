# Multi-stage Dockerfile for Medical Study Hub

# Stage 1: Build React frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Copy source code and build
COPY src/ ./src/
COPY public/ ./public/
COPY tailwind.config.js ./
RUN npm run build

# Stage 2: Setup Python worker
FROM python:3.11-alpine AS python-worker
WORKDIR /app/python_worker

# Install system dependencies
RUN apk add --no-cache \
    gcc \
    musl-dev \
    libffi-dev \
    openssl-dev

# Copy Python requirements and install
COPY python_worker/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy Python source code
COPY python_worker/ ./

# Stage 3: Setup Node.js backend
FROM node:18-alpine AS backend
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    sqlite \
    python3 \
    make \
    g++

# Copy backend package files
COPY backend/package.json backend/package-lock.json ./backend/
WORKDIR /app/backend
RUN npm ci --only=production

# Copy backend source code
COPY backend/ ./

# Stage 4: Final production image
FROM node:18-alpine
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    sqlite \
    python3 \
    py3-pip \
    supervisor

# Create app user
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

# Copy backend
COPY --from=backend /app/backend ./backend
COPY --from=backend /app/backend/node_modules ./backend/node_modules

# Copy Python worker
COPY --from=python-worker /app/python_worker ./python_worker
COPY --from=python-worker /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=python-worker /usr/local/bin /usr/local/bin

# Copy built frontend
COPY --from=frontend-builder /app/build ./frontend/build

# Copy database schema and create data directory
COPY data/ ./data/
RUN mkdir -p ./data && \
    chown -R appuser:appgroup ./data

# Copy configuration files
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Create log directories
RUN mkdir -p /var/log/supervisor /var/log/medstudyhub && \
    chown -R appuser:appgroup /var/log/medstudyhub

# Switch to non-root user
USER appuser

# Initialize database
RUN cd /app && python3 -c "
import sqlite3
import os
db_path = 'data/med-study.db'
if not os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    with open('data/schema.sql', 'r') as f:
        conn.executescript(f.read())
    conn.close()
    print('Database initialized')
"

# Expose ports
EXPOSE 5000 8000 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Set environment variables
ENV NODE_ENV=production
ENV PYTHONPATH=/app/python_worker
ENV DATABASE_PATH=/app/data/med-study.db

# Start services with supervisor
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]