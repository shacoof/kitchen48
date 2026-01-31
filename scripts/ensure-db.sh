#!/bin/bash
#
# Ensures the PostgreSQL database is running before starting the application
#

CONTAINER_NAME="kitchen48-postgres"

# Check if Docker daemon is running
if ! docker info >/dev/null 2>&1; then
    echo "Docker is not running. Starting Docker Desktop..."

    # Start Docker Desktop (Windows path from WSL)
    "/mnt/c/Program Files/Docker/Docker/Docker Desktop.exe" &

    # Wait for Docker to become available
    echo "Waiting for Docker to start..."
    timeout=60
    elapsed=0
    while ! docker info >/dev/null 2>&1; do
        if [ $elapsed -ge $timeout ]; then
            echo "Error: Docker failed to start within ${timeout} seconds"
            exit 1
        fi
        sleep 2
        elapsed=$((elapsed + 2))
        echo "  Still waiting... (${elapsed}s)"
    done
    echo "Docker is now running"
fi

# Check if container is running
if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "Database already running"
else
    echo "Starting database..."
    docker compose up -d postgres

    # Wait for healthy status
    echo "Waiting for database to be ready..."
    until docker compose ps postgres | grep -q "healthy"; do
        sleep 1
    done
    echo "Database is ready"
fi
