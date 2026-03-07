#!/bin/bash
#
# Production Database Query Helper
#
# Usage:
#   ./scripts/prod-db.sh "SELECT * FROM users LIMIT 5"
#   ./scripts/prod-db.sh                    # Interactive mode (lists tables)
#
# Prerequisites:
#   - cloud-sql-proxy running on port 5434
#   - Start it with: /home/owner/cloud-sql-proxy "kitchen48-app-1769028672:us-central1:kitchen48-db" --port 5434 --address 0.0.0.0 --gcloud-auth
#

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DB_URL="postgresql://kitchen48_user:k48shacoof123@127.0.0.1:5434/kitchen48_prod"

# Check if proxy is running
if ! lsof -i :5434 >/dev/null 2>&1; then
  echo "Starting cloud-sql-proxy..."
  /home/owner/cloud-sql-proxy "kitchen48-app-1769028672:us-central1:kitchen48-db" --port 5434 --address 0.0.0.0 --gcloud-auth &
  sleep 3
fi

if [ -z "$1" ]; then
  echo "Production Database - kitchen48_prod"
  echo "======================================"
  node -e "
    const { Client } = require('pg');
    const client = new Client({ connectionString: '$DB_URL' });
    client.connect()
      .then(() => client.query(\"SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename\"))
      .then(res => { console.log('Tables:'); res.rows.forEach(r => console.log('  ' + r.tablename)); client.end(); })
      .catch(err => { console.error('ERROR:', err.message); client.end(); });
  "
else
  node -e "
    const { Client } = require('pg');
    const client = new Client({ connectionString: '$DB_URL' });
    client.connect()
      .then(() => client.query(process.argv[1]))
      .then(res => {
        if (res.command === 'SELECT') {
          console.log(JSON.stringify(res.rows, null, 2));
          console.log('(' + res.rowCount + ' rows)');
        } else {
          console.log(res.command + ': ' + res.rowCount + ' rows affected');
        }
        client.end();
      })
      .catch(err => { console.error('ERROR:', err.message); client.end(); });
  " "$1"
fi
