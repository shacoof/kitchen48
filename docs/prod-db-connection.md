# Production Database Connection Guide

## Overview

The production database is a **Cloud SQL PostgreSQL 16** instance hosted on Google Cloud Platform. Access from a local machine is achieved via the `cloud-sql-proxy`, which creates a secure tunnel to the database.

---

## Infrastructure Details

| Property | Value |
|----------|-------|
| GCP Project | `kitchen48-app-1769028672` |
| GCP Region | `us-central1` |
| Cloud SQL Instance | `kitchen48-db` |
| Instance Connection Name | `kitchen48-app-1769028672:us-central1:kitchen48-db` |
| Public IP | `104.198.246.162` |
| Database Name | `kitchen48_prod` |
| Database User | `kitchen48_user` |
| Database Password | `k48shacoof123` |
| PostgreSQL Version | 16 |
| Tier | `db-f1-micro` |

---

## Cloud SQL Proxy

The proxy binary is installed at `/home/owner/cloud-sql-proxy` (v2.15.2, linux/amd64).

It authenticates using the active `gcloud` session (user: `shacoof@gmail.com`).

### Start the Proxy

```bash
/home/owner/cloud-sql-proxy \
  "kitchen48-app-1769028672:us-central1:kitchen48-db" \
  --port 5434 \
  --address 0.0.0.0 \
  --gcloud-auth &
```

- Listens on **port 5434** (chosen to avoid conflict with local dev DB on 5433)
- Bound to `0.0.0.0` so Docker containers can also reach it
- Runs in the background; stop with `kill $(lsof -t -i :5434)`

### Verify the Proxy is Running

```bash
lsof -i :5434
```

### Connection String (from WSL2 host)

```
postgresql://kitchen48_user:k48shacoof123@127.0.0.1:5434/kitchen48_prod
```

---

## Access Methods

### 1. CLI Script (`prod-db.sh`)

Location: `scripts/prod-db.sh`

Uses Node.js `pg` module to run queries. Auto-starts the proxy if not running.

```bash
# List tables
./scripts/prod-db.sh

# Run a query
./scripts/prod-db.sh "SELECT count(*) FROM users"
./scripts/prod-db.sh "SELECT id, email, nickname FROM users LIMIT 10"
```

### 2. pgAdmin (Browser GUI)

pgAdmin is running via Docker at **http://localhost:5052**.

**pgAdmin Login:**

| Field | Value |
|-------|-------|
| Email | `admin@kitchen48.com` |
| Password | `admin123` |

**Add a new server connection for production:**

| Setting | Value |
|---------|-------|
| Name | `Kitchen48 Production` |
| Host | *(WSL2 eth0 IP -- see note below)* |
| Port | `5434` |
| Maintenance DB | `kitchen48_prod` |
| Username | `kitchen48_user` |
| Password | `k48shacoof123` |

**Finding the WSL2 IP (needed for pgAdmin):**

pgAdmin runs inside Docker and cannot use `127.0.0.1` to reach the WSL2 host. Instead, use the WSL2 `eth0` address:

```bash
ip addr show eth0 | grep 'inet ' | awk '{print $2}' | cut -d/ -f1
```

This IP may change after a WSL2 reboot. Update the pgAdmin server connection if it stops working.

### 3. Node.js / Prisma (Programmatic)

From any Node.js script in the project (requires `pg` package, installed as devDependency):

```javascript
const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://kitchen48_user:k48shacoof123@127.0.0.1:5434/kitchen48_prod'
});
await client.connect();
const result = await client.query('SELECT * FROM users LIMIT 5');
console.log(result.rows);
await client.end();
```

### 4. Prisma Studio (pointing at production)

```bash
DATABASE_URL="postgresql://kitchen48_user:k48shacoof123@127.0.0.1:5434/kitchen48_prod" \
  npx prisma studio --browser none
```

Opens on http://localhost:5555 by default.

---

## Port Assignments

| Port | Service |
|------|---------|
| 5432 | PostgreSQL default (not used directly) |
| 5433 | Local dev database (Docker) |
| 5434 | Production database (via cloud-sql-proxy) |
| 5052 | pgAdmin web UI |
| 5555 | Prisma Studio (when running) |

---

## Networking Notes (WSL2 + Docker)

- `cloud-sql-proxy` runs on the WSL2 host, not inside Docker
- Docker containers cannot reach `127.0.0.1` on the host; they must use the WSL2 `eth0` IP (e.g., `172.26.74.205`)
- The proxy binds to `0.0.0.0` to accept connections from Docker bridge networks
- `host.docker.internal` resolves to an IPv6 address on this setup and does not reliably work for port 5434
- The WSL2 `eth0` IP changes on reboot; run `ip addr show eth0` to get the current one

---

## Prerequisites

- **gcloud CLI** authenticated: `gcloud auth list` should show `shacoof@gmail.com` as active
- **cloud-sql-proxy** binary at `/home/owner/cloud-sql-proxy`
- **Node.js `pg` package** installed in `kitchen48/` (devDependency)
- **Docker** running (for pgAdmin)

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Proxy won't start | Check gcloud auth: `gcloud auth login` |
| `connection refused` on 5434 | Proxy not running. Start it (see above) |
| pgAdmin can't connect | WSL2 IP may have changed. Run `ip addr show eth0` and update server config |
| `database does not exist` | Use `kitchen48_prod` (not `kitchen48_dev`) |
| Proxy dies after inactivity | Restart it. Consider a systemd user service for persistence |
| Permission denied on Cloud SQL | Ensure `kitchen48_user` role exists and `gcloud` user has `cloudsql.client` IAM role |

---

## Safety Reminders

- This is the **production database** with real user data
- Always `BEGIN` / `ROLLBACK` when testing write queries
- Back up before bulk updates: `./scripts/backup-database.sh before-fix`
- Prefer `SELECT` first to verify scope before running `UPDATE` / `DELETE`
- Never run `DROP`, `TRUNCATE`, or unqualified `DELETE FROM`
