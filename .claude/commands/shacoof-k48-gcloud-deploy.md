# Kitchen48 Google Cloud Deployment

You are now in **Automated Deployment Mode**.

## DEPLOYMENT INSTRUCTIONS

Execute the full Kitchen48 deployment to Google Cloud **without asking any questions**.

### What to Deploy
- Cloud SQL database (if not exists)
- Backend service to Cloud Run
- Frontend service to Cloud Run
- Run database migrations

### Configuration
All secrets are pre-configured in `scripts/.env.production`. Do NOT ask for any values.

---

## EXECUTION STEPS

**Execute these steps immediately without asking for confirmation:**

### Step 1: Verify Prerequisites

Run this command to verify gcloud is ready:
```bash
gcloud config get-value project && gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -n1
```

If this fails, inform the user they need to run `gcloud auth login` first.

### Step 2: Run Full Deployment

Execute the deployment script:
```bash
cd /home/owner/recipe/kitchen48 && ./scripts/deploy.sh
```

This script will:
1. Enable required GCP APIs
2. Create/update Cloud SQL instance
3. Store secrets in Secret Manager
4. Deploy backend to Cloud Run
5. Deploy frontend to Cloud Run

### Step 3: Run Database Migrations

After deployment, connect to Cloud SQL and run migrations:
```bash
cd /home/owner/recipe/kitchen48/backend && npx prisma migrate deploy
```

Note: If migrations require Cloud SQL Auth Proxy, use:
```bash
# Start proxy in background
cloud_sql_proxy -instances=$(gcloud sql instances describe kitchen48-db --format="value(connectionName)")=tcp:5432 &

# Run migrations
DATABASE_URL="postgresql://kitchen48_user:K48pr0d\$ecure2026!@localhost:5432/kitchen48_prod" npx prisma migrate deploy

# Kill proxy
pkill cloud_sql_proxy
```

### Step 4: Run Database Seed (if needed)

If this is a fresh deployment, run the seed:
```bash
DATABASE_URL="postgresql://kitchen48_user:K48pr0d\$ecure2026!@localhost:5432/kitchen48_prod" npx prisma db seed
```

### Step 5: Verify Deployment

After deployment completes, test the endpoints:
```bash
# Get service URLs
BACKEND_URL=$(gcloud run services describe kitchen48-backend --region=us-central1 --format="value(status.url)")
FRONTEND_URL=$(gcloud run services describe kitchen48-frontend --region=us-central1 --format="value(status.url)")

echo "Backend: $BACKEND_URL"
echo "Frontend: $FRONTEND_URL"

# Test health endpoint
curl -s "$BACKEND_URL/api/health"
```

---

## CRITICAL RULES

1. **NO QUESTIONS** - Do not ask for confirmation or values. Everything is pre-configured.
2. **RUN IMMEDIATELY** - Start executing Step 1 as soon as this command is invoked.
3. **REPORT PROGRESS** - Show output of each step as it runs.
4. **HANDLE ERRORS** - If a step fails, show the error and suggest fixes.

---

## BEGIN DEPLOYMENT NOW

Start by running Step 1 (verify prerequisites) immediately.
