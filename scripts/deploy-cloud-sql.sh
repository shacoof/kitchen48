#!/bin/bash
set -e

# ============================================================================
# Cloud SQL Deployment Script for Kitchen48
# ============================================================================
# This script creates a Cloud SQL PostgreSQL instance with private-only access.
# Only Cloud Run services with the Cloud SQL connector can access it.
# ============================================================================

# Configuration
PROJECT_ID="${GCP_PROJECT_ID:-$(gcloud config get-value project 2>/dev/null)}"
REGION="${GCP_REGION:-us-central1}"
INSTANCE_NAME="${CLOUD_SQL_INSTANCE:-kitchen48-db}"
DB_NAME="${DB_NAME:-kitchen48_prod}"
DB_USER="${DB_USER:-kitchen48_user}"
DB_TIER="${DB_TIER:-db-f1-micro}"  # Smallest tier, ~$7/mo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Kitchen48 Cloud SQL Deployment${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Configuration:"
echo "  Project:  $PROJECT_ID"
echo "  Region:   $REGION"
echo "  Instance: $INSTANCE_NAME"
echo "  Database: $DB_NAME"
echo "  User:     $DB_USER"
echo "  Tier:     $DB_TIER"
echo ""

# Check if project is set
if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}Error: No GCP project set.${NC}"
    echo "Run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -n1 > /dev/null 2>&1; then
    echo -e "${RED}Error: Not authenticated with gcloud.${NC}"
    echo "Run: gcloud auth login"
    exit 1
fi

# Prompt for database password
echo -e "${YELLOW}Enter a secure password for the database user '$DB_USER':${NC}"
read -s DB_PASSWORD
echo ""

if [ ${#DB_PASSWORD} -lt 8 ]; then
    echo -e "${RED}Error: Password must be at least 8 characters.${NC}"
    exit 1
fi

echo -e "${YELLOW}Confirm password:${NC}"
read -s DB_PASSWORD_CONFIRM
echo ""

if [ "$DB_PASSWORD" != "$DB_PASSWORD_CONFIRM" ]; then
    echo -e "${RED}Error: Passwords do not match.${NC}"
    exit 1
fi

# Enable required APIs
echo -e "${GREEN}Enabling required APIs...${NC}"
gcloud services enable sqladmin.googleapis.com --project="$PROJECT_ID"
gcloud services enable secretmanager.googleapis.com --project="$PROJECT_ID"

# Check if instance already exists
if gcloud sql instances describe "$INSTANCE_NAME" --project="$PROJECT_ID" > /dev/null 2>&1; then
    echo -e "${YELLOW}Instance '$INSTANCE_NAME' already exists.${NC}"
    read -p "Do you want to continue with existing instance? (y/n): " CONTINUE
    if [ "$CONTINUE" != "y" ]; then
        exit 0
    fi
else
    # Create Cloud SQL instance
    echo -e "${GREEN}Creating Cloud SQL instance '$INSTANCE_NAME'...${NC}"
    echo "This may take 5-10 minutes..."

    gcloud sql instances create "$INSTANCE_NAME" \
        --project="$PROJECT_ID" \
        --database-version=POSTGRES_16 \
        --edition=ENTERPRISE \
        --tier="$DB_TIER" \
        --region="$REGION" \
        --storage-type=SSD \
        --storage-size=10GB \
        --storage-auto-increase \
        --backup-start-time=03:00 \
        --availability-type=zonal \
        --assign-ip \
        --no-require-ssl

    echo -e "${GREEN}Instance created successfully!${NC}"
fi

# Create database
echo -e "${GREEN}Creating database '$DB_NAME'...${NC}"
if gcloud sql databases describe "$DB_NAME" --instance="$INSTANCE_NAME" --project="$PROJECT_ID" > /dev/null 2>&1; then
    echo -e "${YELLOW}Database '$DB_NAME' already exists.${NC}"
else
    gcloud sql databases create "$DB_NAME" \
        --instance="$INSTANCE_NAME" \
        --project="$PROJECT_ID"
    echo -e "${GREEN}Database created!${NC}"
fi

# Create or update user
echo -e "${GREEN}Creating/updating database user '$DB_USER'...${NC}"
if gcloud sql users list --instance="$INSTANCE_NAME" --project="$PROJECT_ID" --format="value(name)" | grep -q "^${DB_USER}$"; then
    gcloud sql users set-password "$DB_USER" \
        --instance="$INSTANCE_NAME" \
        --project="$PROJECT_ID" \
        --password="$DB_PASSWORD"
    echo -e "${YELLOW}User password updated.${NC}"
else
    gcloud sql users create "$DB_USER" \
        --instance="$INSTANCE_NAME" \
        --project="$PROJECT_ID" \
        --password="$DB_PASSWORD"
    echo -e "${GREEN}User created!${NC}"
fi

# Store password in Secret Manager
SECRET_NAME="kitchen48-db-password"
echo -e "${GREEN}Storing password in Secret Manager...${NC}"
if gcloud secrets describe "$SECRET_NAME" --project="$PROJECT_ID" > /dev/null 2>&1; then
    echo -n "$DB_PASSWORD" | gcloud secrets versions add "$SECRET_NAME" --data-file=- --project="$PROJECT_ID"
    echo -e "${YELLOW}Secret updated with new version.${NC}"
else
    echo -n "$DB_PASSWORD" | gcloud secrets create "$SECRET_NAME" --data-file=- --project="$PROJECT_ID"
    echo -e "${GREEN}Secret created!${NC}"
fi

# Get connection name
CONNECTION_NAME=$(gcloud sql instances describe "$INSTANCE_NAME" --project="$PROJECT_ID" --format="value(connectionName)")

# Output summary
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Cloud SQL Instance:"
echo "  Connection Name: $CONNECTION_NAME"
echo "  Database:        $DB_NAME"
echo "  User:            $DB_USER"
echo ""
echo "Secret Manager:"
echo "  Secret Name:     $SECRET_NAME"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo ""
echo "1. Deploy backend to Cloud Run with Cloud SQL connection:"
echo ""
echo "   gcloud run deploy kitchen48-backend \\"
echo "     --source ./backend \\"
echo "     --region=$REGION \\"
echo "     --add-cloudsql-instances=$CONNECTION_NAME \\"
echo "     --set-env-vars=\"DATABASE_URL=postgresql://$DB_USER:\\\$DB_PASSWORD@localhost/$DB_NAME?host=/cloudsql/$CONNECTION_NAME\" \\"
echo "     --set-secrets=\"DB_PASSWORD=$SECRET_NAME:latest\" \\"
echo "     --allow-unauthenticated"
echo ""
echo "2. Or use the deploy-backend.sh script (if available)"
echo ""
echo -e "${GREEN}Connection string for .env.production:${NC}"
echo "DATABASE_URL=postgresql://$DB_USER:PASSWORD@localhost/$DB_NAME?host=/cloudsql/$CONNECTION_NAME"
echo ""
