#!/bin/bash
# Run script for worktree: kitchen48
WORKTREE_DIR="$(cd "$(dirname "$0")" && pwd)"
MAIN_REPO="$(cd "$WORKTREE_DIR" && git worktree list | head -1 | awk '{print $1}')"
cd "$WORKTREE_DIR"

# Copy env if missing
if [ ! -f "$WORKTREE_DIR/backend/.env" ]; then
  cp "$MAIN_REPO/backend/.env" "$WORKTREE_DIR/backend/.env" 2>/dev/null || true
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
  sleep 3
  echo "Database started"
fi

# Kill any existing dev server ports
fuser -k 5173/tcp 3000/tcp 2>/dev/null || true

# Start dev server
npm run dev
