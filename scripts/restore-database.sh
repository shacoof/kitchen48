#!/bin/bash
#
# Database Restore Script for Kitchen48
#
# Usage:
#   ./scripts/restore-database.sh <backup-file>
#
# Example:
#   ./scripts/restore-database.sh backups/before-migration_20240115_143022.dump
#
# WARNING: This will OVERWRITE the current database!
#

set -e

# Configuration
CONTAINER_NAME="kitchen48-postgres"
DB_NAME="kitchen48_dev"
DB_USER="kitchen48_user"

# Check arguments
if [ -z "$1" ]; then
    echo "Usage: $0 <backup-file>"
    echo ""
    echo "Available backups:"
    ls -la backups/*.dump 2>/dev/null || echo "  No backups found in backups/"
    exit 1
fi

BACKUP_FILE="$1"

# Verify backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Safety confirmation
echo ""
echo "========================================"
echo "  DATABASE RESTORE WARNING"
echo "========================================"
echo ""
echo "You are about to restore from: $BACKUP_FILE"
echo "This will OVERWRITE the current database: $DB_NAME"
echo ""
echo "All current data will be LOST!"
echo ""
read -p "Type 'yes' to confirm: " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo ""
    echo "Restore cancelled."
    exit 0
fi

echo ""
echo "Starting database restore..."

# Check if Docker container is running
if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "  Using Docker container: $CONTAINER_NAME"

    # Drop and recreate database
    docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS ${DB_NAME};"
    docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d postgres -c "CREATE DATABASE ${DB_NAME};"

    # Restore from backup
    cat "$BACKUP_FILE" | docker exec -i "$CONTAINER_NAME" pg_restore -U "$DB_USER" -d "$DB_NAME" --no-owner --no-acl
else
    # Fall back to local pg_restore
    echo "  Using local pg_restore"

    # Load DATABASE_URL from .env if available
    if [ -f "backend/.env" ]; then
        source backend/.env
    fi

    if [ -z "$DATABASE_URL" ]; then
        echo "Error: DATABASE_URL not set and Docker container not running"
        exit 1
    fi

    pg_restore "$DATABASE_URL" --clean --no-owner --no-acl < "$BACKUP_FILE"
fi

echo ""
echo "Restore completed successfully!"
echo ""
echo "IMPORTANT: Run migrations to ensure schema is up to date:"
echo "  cd backend && npx prisma migrate deploy"
