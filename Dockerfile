# Multi-stage build for Medical Study Hub

# Stage 1: Python backend
FROM python:3.12-slim as python-backend

WORKDIR /app/python_worker

# Install Python dependencies
COPY python_worker/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy Python source code
COPY python_worker/ .

# Expose Python worker port
EXPOSE 8000

# Stage 2: Node.js frontend and backend
FROM node:18-slim as node-app

WORKDIR /app

# Copy package.json and install dependencies
COPY package.json .
RUN npm install

# Copy source code
COPY ui/ ./ui/
COPY backend/ ./backend/
COPY src/ ./src/
COPY public/ ./public/
COPY tailwind.config.js .

# Build frontend if needed
# RUN npm run build

# Expose backend port
EXPOSE 5000
EXPOSE 3000

# Final stage: Multi-service container
FROM python:3.12-slim

# Install Node.js
RUN apt-get update && apt-get install -y \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy Python application
COPY --from=python-backend /app/python_worker ./python_worker

# Copy Node.js application
COPY --from=node-app /app ./

# Install Python dependencies
RUN pip install --no-cache-dir -r python_worker/requirements.txt

# Create startup script
RUN echo '#!/bin/bash\n\
# Start Python FastAPI server in background\n\
cd /app/python_worker && python -m uvicorn main:app --host 0.0.0.0 --port 8000 &\n\
\n\
# Start Node.js Express server in background\n\
cd /app && node backend/server.js &\n\
\n\
# Wait for all background processes\n\
wait' > /app/start.sh && chmod +x /app/start.sh

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Expose ports
EXPOSE 8000 5000

# Start all services
CMD ["/app/start.sh"]