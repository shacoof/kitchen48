# Kitchen48 Deploy to Production

You are now in **One-Click Production Deployment Mode**.

## CRITICAL: NO QUESTIONS, NO CONFIRMATIONS

Execute ALL steps automatically. Do NOT ask for confirmation at any point.
If something fails, report the error and continue to the next step.

---

## AUTOMATIC EXECUTION

Run the following steps in sequence. Report progress but DO NOT wait for user input.

### Step 1: Verify Prerequisites (Silent)

```bash
gcloud config get-value project 2>/dev/null && gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>/dev/null | head -n1
```

If this fails, output: "ERROR: Run `gcloud auth login` first" and STOP.

### Step 2: Verify Environment File (Silent)

```bash
test -f /home/owner/recipe/kitchen48/scripts/.env.production && echo "Environment file exists" || echo "ERROR: Missing .env.production"
```

If missing, output instructions to create it and STOP.

### Step 3: Run Full Deployment

```bash
cd /home/owner/recipe/kitchen48 && ./scripts/deploy.sh 2>&1
```

**This script automatically:**
1. Validates local build (TypeScript, frontend)
2. Enables GCP APIs
3. Creates/updates Cloud SQL database
4. Stores secrets in Secret Manager
5. Builds Docker image
6. Deploys to Cloud Run
7. Runs schema migrations via Cloud SQL Proxy (port 5434)
8. Runs data migrations
9. Tests deployment health

**Timeout:** 10 minutes (600000ms)

### Step 4: Verify & Report

After script completes, verify production is working:

```bash
curl -s "https://www.kitchen48.com/api/health" && echo ""
```

---

## OUTPUT FORMAT

When deployment completes, report:

```
DEPLOYMENT COMPLETE

| Item | Status |
|------|--------|
| Frontend | https://www.kitchen48.com |
| API | https://www.kitchen48.com/api/health |
| Schema Migrations | Applied / Up to date |
| Data Migrations | Applied / Up to date |

[Any warnings or issues]
```

---

## ERROR HANDLING

If deployment fails:
1. Show the error message
2. Show the last 50 lines of relevant logs
3. Suggest a fix if obvious
4. Do NOT ask what to do next - just report and end

If migrations fail:
1. Report which migrations failed
2. Show the error
3. Remind user they can run manually:
   ```bash
   # Stop local DB, start proxy, run migrations
   cd /home/owner/recipe/kitchen48
   npm run db:stop
   source scripts/.env.production
   cloud_sql_proxy -instances=$(gcloud sql instances describe kitchen48-db --format="value(connectionName)")=tcp:5434 &
   cd backend
   DATABASE_URL="postgresql://kitchen48_user:${DB_PASSWORD}@localhost:5434/kitchen48_prod" DIRECT_DATABASE_URL="postgresql://kitchen48_user:${DB_PASSWORD}@localhost:5434/kitchen48_prod" npx prisma migrate deploy
   DATABASE_URL="postgresql://kitchen48_user:${DB_PASSWORD}@localhost:5434/kitchen48_prod" DIRECT_DATABASE_URL="postgresql://kitchen48_user:${DB_PASSWORD}@localhost:5434/kitchen48_prod" npm run migrate:data
   pkill cloud_sql_proxy
   npm run db:start
   ```

---

## QUICK REDEPLOY (Code Only)

If only code changed (no DB migrations needed):
```bash
cd /home/owner/recipe/kitchen48 && ./scripts/deploy.sh --skip-db 2>&1
```

---

## BEGIN NOW

Start Step 1 immediately. No questions. No confirmations.
