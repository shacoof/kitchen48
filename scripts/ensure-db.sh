#!/bin/bash
#
# Ensures the PostgreSQL database is running before starting the application
#

CONTAINER_NAME="kitchen48-postgres"

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
