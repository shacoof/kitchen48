#!/bin/bash
# Run script for worktree: feature/cloudflare-media
WORKTREE_DIR="$(cd "$(dirname "$0")" && pwd)"
MAIN_REPO="$(cd "$WORKTREE_DIR" && git worktree list | head -1 | awk '{print $1}')"
cd "$WORKTREE_DIR"

# Load backend environment variables
if [ -f backend/.env ]; then
  export $(grep -v '^#' backend/.env | grep -v '^$' | xargs)
fi

# Install dependencies if needed
if [ ! -d node_modules ]; then
  echo "Installing dependencies..."
  npm install
fi

# Start database from main repo (shared container)
CONTAINER_NAME="kitchen48-postgres"
if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "Database already running"
else
  echo "Starting database from main repo..."
  (cd "$MAIN_REPO" && docker compose up -d postgres)
  echo "Waiting for database to be ready..."
  until docker compose -f "$MAIN_REPO/docker-compose.yml" ps postgres 2>/dev/null | grep -q "healthy"; do
    sleep 1
  done
  echo "Database is ready"
fi

# Kill any existing dev server ports
fuser -k 3000/tcp 5173/tcp 5174/tcp 5175/tcp 5176/tcp 2>/dev/null || true

# Start frontend and backend directly (skip npm run dev to avoid re-triggering db:start)
npm run dev:frontend &
npm run dev:backend &

echo ""
echo "Dev servers starting..."
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:3000"
echo ""

wait
