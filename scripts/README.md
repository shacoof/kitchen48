# Scripts

All utility scripts for Kitchen48 live in this directory. **Before creating a new script, check here first** to avoid duplicating existing functionality.

## Quick Start

Run the interactive menu to browse and launch any script:

```bash
./scripts/script-menu.sh
```

---

## Database Scripts

| Script | Description | Usage |
|--------|-------------|-------|
| `backup-database.sh` | Backup the local dev database | `./scripts/backup-database.sh [backup-name]` |
| `restore-database.sh` | Restore a database backup | `./scripts/restore-database.sh backups/<file>.dump` |
| `ensure-db.sh` | Ensure the dev database container is running | `./scripts/ensure-db.sh` |

## Recipe Copy Scripts

| Script | Description | Usage |
|--------|-------------|-------|
| `copy-recipe-to-prod.js` | Copy recipes from dev to production | `node scripts/copy-recipe-to-prod.js <nickname>/<slug>` |
| `copy-recipe-to-dev.js` | Copy recipes from production to dev | `node scripts/copy-recipe-to-dev.js <nickname>/<slug>` |

Both scripts accept multiple recipes and full URLs:
```bash
node scripts/copy-recipe-to-prod.js auser/borekas auser/bread
node scripts/copy-recipe-to-dev.js https://www.kitchen48.com/auser/borekas
```

**Requires**: Cloud SQL proxy running on port 5434 for prod access (see `docs/prod-db-connection.md`).

## Deployment Scripts

| Script | Description | Usage |
|--------|-------------|-------|
| `deploy.sh` | One-click deploy to Google Cloud Run | `./scripts/deploy.sh` |
| `deploy-cloud-sql.sh` | Deploy/update Cloud SQL instance | `./scripts/deploy-cloud-sql.sh` |

See main `CLAUDE.md` for deployment details and required `.env.production` setup.

## Google Cloud Management

| Script | Description | Usage |
|--------|-------------|-------|
| `gcp-services.sh` | Interactive GCP services dashboard | `./scripts/gcp-services.sh` |

Features:
- Shows status of all Cloud Run services and Cloud SQL instances
- Toggle individual services on/off by number
- Batch commands: `stop-all`, `start-all`, `stop <project>`, `start <project>`
- Manages Cloud Run via ingress settings and Cloud SQL via activation policies

## Recipe Export

| Script | Description | Usage |
|--------|-------------|-------|
| `export-recipes-to-drive.py` | Export all production recipes to local folders (or also upload to Google Drive). Each recipe becomes `{nickname}-{slug}/` with `kitchen48-recipe.yaml` + images | `./scripts/export-recipes-to-drive.py [--limit N] [--folder-id DRIVE_ID]` |

**Setup (one-time):**
```bash
# Install uv if not already (Python package manager)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Create the script's venv with required deps
uv venv scripts/.venv --python 3.12
uv pip install --python scripts/.venv/bin/python "psycopg[binary]" pyyaml requests google-api-python-client google-auth google-auth-oauthlib
```

**Local-only export (default — no auth needed):**
```bash
scripts/.venv/bin/python scripts/export-recipes-to-drive.py
```
Output goes to `./recipe-export/`. Auto-starts cloud-sql-proxy if `/home/owner/cloud-sql-proxy` exists.

**Upload to Drive (optional):**
```bash
gcloud auth application-default login \
  --scopes=https://www.googleapis.com/auth/drive.file,https://www.googleapis.com/auth/cloud-platform
scripts/.venv/bin/python scripts/export-recipes-to-drive.py --folder-id <DRIVE_FOLDER_ID>
```

**Note on videos:** Cloudflare Stream HLS streams aren't downloaded as MP4s (Stream's "downloads" feature isn't enabled). The HLS URL is preserved in the YAML under `introVideoSourceUrl` / `videoSourceUrl` so it can be fetched later (e.g. with `ffmpeg -i <url> output.mp4` once ffmpeg is installed).

## Mobile (Expo) Scripts

| Script | Description | Usage |
|--------|-------------|-------|
| `build-mobile-apk.sh` | Build a standalone Android APK via EAS Build (cloud, ~10-15 min) | `./scripts/build-mobile-apk.sh [profile]` |

**Profiles:**
- `preview` (default) — APK for sideloading
- `production` — AAB for Play Store
- `development` — dev client APK (connects to Metro)

The script runs `tsc --noEmit` first to catch type errors before burning a cloud build slot. When the build completes, open the URL on your phone to download and install the APK.

**One-time setup:** `cd mobile && npx eas-cli@latest login`. Build profiles are defined in [`mobile/eas.json`](../mobile/eas.json).

**For JS-only updates between rebuilds**, use OTA:
```bash
cd mobile && npx eas-cli@latest update --branch preview
```

## Script Menu

| Script | Description | Usage |
|--------|-------------|-------|
| `script-menu.sh` | Interactive launcher for all scripts | `./scripts/script-menu.sh` |

Shows a categorized menu of all available scripts, lets you pick one by number, prompts for arguments if needed, and runs it.

## Production Database Scripts

SQL scripts for one-time production data changes live in `backend/prisma/scripts/` — see [`backend/prisma/scripts/README.md`](../backend/prisma/scripts/README.md).

Automated data migrations (new LOV types, reference data) go in `backend/prisma/data-migrations/` — see main `CLAUDE.md` for details.
