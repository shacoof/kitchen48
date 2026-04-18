# Kitchen48 Scripts

Operational scripts for deploying, backing up, and building Kitchen48.

## Web / Backend

| Script | Purpose |
|--------|---------|
| [`deploy.sh`](./deploy.sh) | One-click deploy of the combined app (frontend + backend) to Cloud Run + Cloud SQL. See header for flags. |
| [`deploy-cloud-sql.sh`](./deploy-cloud-sql.sh) | Provision/update the Cloud SQL instance only. |
| [`ensure-db.sh`](./ensure-db.sh) | Start the local Docker Postgres container if not already running. Used by `npm run dev`. |
| [`backup-database.sh`](./backup-database.sh) | Create a pg_dump of the local database to `backups/`. |
| [`restore-database.sh`](./restore-database.sh) | Restore a dump from `backups/` into the local database (requires confirmation). |
| [`prod-db.sh`](./prod-db.sh) | Open a psql session against the production Cloud SQL DB via Cloud SQL Proxy. |
| [`copy-recipe-to-prod.js`](./copy-recipe-to-prod.js) | Copy a specific recipe (and its steps/ingredients/media refs) from dev DB to prod DB. |

## Mobile

| Script | Purpose |
|--------|---------|
| [`build-mobile-apk.sh`](./build-mobile-apk.sh) | Build a standalone Android APK for the Expo mobile app via EAS Build (cloud, ~10-15 min). Default profile is `preview` (sideloadable APK). |

### Mobile build usage

```bash
./scripts/build-mobile-apk.sh                  # preview APK (default) — for sideload
./scripts/build-mobile-apk.sh production       # AAB for Play Store
./scripts/build-mobile-apk.sh development      # dev client APK
./scripts/build-mobile-apk.sh --help           # show help
```

The script runs `tsc --noEmit` first to catch type errors before burning a cloud build slot, then submits the build. When complete, open the build URL on your phone and tap to install the APK.

**Prerequisite (one-time):** `cd mobile && npx eas-cli@latest login`

Build profiles are defined in [`mobile/eas.json`](../mobile/eas.json).
