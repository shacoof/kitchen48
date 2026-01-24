# CLAUDE.md
This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Structure

- **frontend/**: React + Vite application (builds to nginx container)
- **backend/**: Node.js + Express API server
- Both services use npm workspaces from the root

---

## Development Commands

```bash
# Install dependencies
npm install

# Run both frontend and backend in dev mode
npm run dev

# Run individually
npm run dev:frontend   # Vite dev server
npm run dev:backend    # tsx watch mode
```

---

## Build Commands

```bash
# Build all
npm run build

# Build individually
npm run build:frontend
npm run build:backend
```

---

## Google Cloud Deployment

### Prerequisites
- Google Cloud SDK installed (`gcloud`)
- Authenticated: `gcloud auth login`
- Project set: `gcloud config set project PROJECT_ID`

### Build and Deploy to Cloud Run

```bash
# Deploy frontend
gcloud run deploy kitchen48-frontend \
  --source ./frontend \
  --region us-central1 \
  --allow-unauthenticated

# Deploy backend
gcloud run deploy kitchen48-backend \
  --source ./backend \
  --region us-central1 \
  --allow-unauthenticated
```

### Manual Docker Build and Push (Artifact Registry)

```bash
# Configure Docker for Artifact Registry
gcloud auth configure-docker REGION-docker.pkg.dev

# Build images
docker build -t REGION-docker.pkg.dev/PROJECT_ID/REPO/kitchen48-frontend:latest ./frontend
docker build -t REGION-docker.pkg.dev/PROJECT_ID/REPO/kitchen48-backend:latest ./backend

# Push images
docker push REGION-docker.pkg.dev/PROJECT_ID/REPO/kitchen48-frontend:latest
docker push REGION-docker.pkg.dev/PROJECT_ID/REPO/kitchen48-backend:latest

# Deploy from image
gcloud run deploy kitchen48-frontend \
  --image REGION-docker.pkg.dev/PROJECT_ID/REPO/kitchen48-frontend:latest \
  --region us-central1 \
  --allow-unauthenticated

gcloud run deploy kitchen48-backend \
  --image REGION-docker.pkg.dev/PROJECT_ID/REPO/kitchen48-backend:latest \
  --region us-central1 \
  --allow-unauthenticated
```

### Environment Variables
Set environment variables during deployment:
```bash
gcloud run deploy SERVICE_NAME \
  --set-env-vars "KEY1=value1,KEY2=value2"
```

---

# ⚠️ MANDATORY WORKFLOW CHECKLIST - READ BEFORE EVERY TASK ⚠️

**STOP. Before making ANY code changes, complete this checklist. NO EXCEPTIONS.**

## Pre-Work Checklist (BEFORE touching any code)

- [ ] **Create pre-edit commit**
  ```bash
  git add -A
  git commit -m "Before [task description]"
  ```
## During Work

- [ ] **Commit after each logical unit**
  - Don't batch unrelated changes
  - Write descriptive commit messages

---

**THIS CHECKLIST IS MANDATORY. Following it prevents:**
- ❌ Data loss from missing pre-edit commits
- ❌ Repeated bugs from undocumented lessons
- ❌ Lost context from missing implementation plans
- ❌ Merge conflicts from batched changes
- ❌ Guideline violations from skipping reviews

**NO SHORTCUTS. NO EXCEPTIONS. EVERY TIME.**

---