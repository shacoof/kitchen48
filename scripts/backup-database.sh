#!/bin/bash
#
# Database Backup Script for Kitchen48
#
# Usage:
#   ./scripts/backup-database.sh [backup-name]
#
# Examples:
#   ./scripts/backup-database.sh                    # Creates: backup_20240115_143022.dump
#   ./scripts/backup-database.sh before-migration   # Creates: before-migration_20240115_143022.dump
#

set -e

# Configuration
BACKUP_DIR="backups"
CONTAINER_NAME="kitchen48-postgres"
DB_NAME="kitchen48_dev"
DB_USER="kitchen48_user"

# Generate backup filename
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="${1:-backup}"
BACKUP_FILE="${BACKUP_DIR}/${BACKUP_NAME}_${TIMESTAMP}.dump"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "Starting database backup..."
echo "  Database: $DB_NAME"
echo "  Output: $BACKUP_FILE"

# Check if Docker container is running
if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "  Using Docker container: $CONTAINER_NAME"
    docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" -d "$DB_NAME" -Fc > "$BACKUP_FILE"
else
    # Fall back to local pg_dump
    echo "  Using local pg_dump"

    # Load DATABASE_URL from .env if available
    if [ -f "backend/.env" ]; then
        source backend/.env
    fi

    if [ -z "$DATABASE_URL" ]; then
        echo "Error: DATABASE_URL not set and Docker container not running"
        exit 1
    fi

    pg_dump "$DATABASE_URL" -Fc > "$BACKUP_FILE"
fi

# Report results
BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo ""
echo "Backup completed successfully!"
echo "  File: $BACKUP_FILE"
echo "  Size: $BACKUP_SIZE"
