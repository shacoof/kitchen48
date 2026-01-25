#!/bin/bash
set -e

# ============================================================================
# Kitchen48 One-Click Deployment Script
# ============================================================================
# Deploys the complete Kitchen48 application to Google Cloud:
#   - Cloud SQL (PostgreSQL 16)
#   - Backend (Cloud Run)
#   - Frontend (Cloud Run)
#
# Usage:
#   ./scripts/deploy.sh                    # Interactive mode
#   ./scripts/deploy.sh --env-file FILE    # Use env file for secrets
#   ./scripts/deploy.sh --skip-db          # Skip Cloud SQL setup
#   ./scripts/deploy.sh --backend-only     # Deploy backend only
#   ./scripts/deploy.sh --frontend-only    # Deploy frontend only
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Default configuration
REGION="${GCP_REGION:-us-central1}"
CLOUD_SQL_INSTANCE="kitchen48-db"
DB_NAME="kitchen48_prod"
DB_USER="kitchen48_user"
DB_TIER="db-f1-micro"

# Service names
BACKEND_SERVICE="kitchen48-backend"
FRONTEND_SERVICE="kitchen48-frontend"

# Flags
SKIP_DB=false
BACKEND_ONLY=false
FRONTEND_ONLY=false
ENV_FILE=""

# ============================================================================
# Helper Functions
# ============================================================================

print_banner() {
    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC}           ${BOLD}Kitchen48 One-Click Deployment${NC}                      ${CYAN}║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_step() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}▶ ${BOLD}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ $1${NC}"
}

# ============================================================================
# Parse Arguments
# ============================================================================

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-db)
            SKIP_DB=true
            shift
            ;;
        --backend-only)
            BACKEND_ONLY=true
            shift
            ;;
        --frontend-only)
            FRONTEND_ONLY=true
            shift
            ;;
        --env-file)
            ENV_FILE="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --env-file FILE    Load secrets from environment file"
            echo "  --skip-db          Skip Cloud SQL setup (use existing)"
            echo "  --backend-only     Deploy backend only"
            echo "  --frontend-only    Deploy frontend only"
            echo "  --help, -h         Show this help message"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# ============================================================================
# Load Environment File
# ============================================================================

load_env_file() {
    local env_file="$1"
    if [[ -f "$env_file" ]]; then
        print_info "Loading environment from $env_file"
        set -a
        source "$env_file"
        set +a
        return 0
    fi
    return 1
}

# Try to load env file
if [[ -n "$ENV_FILE" ]]; then
    if ! load_env_file "$ENV_FILE"; then
        print_error "Environment file not found: $ENV_FILE"
        exit 1
    fi
elif [[ -f "$SCRIPT_DIR/.env.production" ]]; then
    load_env_file "$SCRIPT_DIR/.env.production"
elif [[ -f "$PROJECT_ROOT/.env.production" ]]; then
    load_env_file "$PROJECT_ROOT/.env.production"
fi

# ============================================================================
# Prerequisites Check
# ============================================================================

check_prerequisites() {
    print_step "Checking Prerequisites"

    # Check gcloud CLI
    if ! command -v gcloud &> /dev/null; then
        print_error "Google Cloud SDK (gcloud) is not installed."
        echo "Install it from: https://cloud.google.com/sdk/docs/install"
        exit 1
    fi
    print_success "gcloud CLI installed"

    # Check authentication
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>/dev/null | head -n1 | grep -q "@"; then
        print_error "Not authenticated with gcloud."
        echo "Run: gcloud auth login"
        exit 1
    fi
    print_success "gcloud authenticated"

    # Check/set project
    if [[ -z "$GCP_PROJECT_ID" ]]; then
        GCP_PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
    fi

    if [[ -z "$GCP_PROJECT_ID" ]]; then
        print_error "No GCP project set."
        echo "Set GCP_PROJECT_ID in your env file or run: gcloud config set project YOUR_PROJECT_ID"
        exit 1
    fi

    # Verify project exists and we have access
    if ! gcloud projects describe "$GCP_PROJECT_ID" &>/dev/null; then
        print_error "Cannot access project: $GCP_PROJECT_ID"
        exit 1
    fi
    print_success "GCP Project: $GCP_PROJECT_ID"

    # Set project for subsequent commands
    gcloud config set project "$GCP_PROJECT_ID" --quiet

    # Update region from env if set
    REGION="${GCP_REGION:-$REGION}"
    print_success "Region: $REGION"
}

# ============================================================================
# Collect Required Secrets
# ============================================================================

collect_secrets() {
    print_step "Collecting Required Secrets"

    # Database password
    if [[ -z "$DB_PASSWORD" ]] && [[ "$SKIP_DB" != "true" ]] && [[ "$FRONTEND_ONLY" != "true" ]]; then
        echo -e "${YELLOW}Enter database password (min 8 characters):${NC}"
        read -s DB_PASSWORD
        echo ""
        if [[ ${#DB_PASSWORD} -lt 8 ]]; then
            print_error "Password must be at least 8 characters."
            exit 1
        fi
    fi

    # JWT Secret
    if [[ -z "$JWT_SECRET" ]] && [[ "$FRONTEND_ONLY" != "true" ]]; then
        echo -e "${YELLOW}Enter JWT secret (min 32 characters, or press Enter to generate):${NC}"
        read -s JWT_SECRET
        echo ""
        if [[ -z "$JWT_SECRET" ]]; then
            JWT_SECRET=$(openssl rand -base64 48)
            print_info "Generated JWT secret"
        elif [[ ${#JWT_SECRET} -lt 32 ]]; then
            print_error "JWT secret must be at least 32 characters."
            exit 1
        fi
    fi

    # Email configuration
    if [[ -z "$EMAIL_SERVER_PASSWORD" ]] && [[ "$FRONTEND_ONLY" != "true" ]]; then
        print_warning "EMAIL_SERVER_PASSWORD not set - email functionality will be disabled"
        EMAIL_SERVER_PASSWORD=""
    fi

    print_success "Secrets collected"
}

# ============================================================================
# Enable GCP APIs
# ============================================================================

enable_apis() {
    print_step "Enabling Required GCP APIs"

    local apis=(
        "run.googleapis.com"
        "sqladmin.googleapis.com"
        "secretmanager.googleapis.com"
        "cloudbuild.googleapis.com"
    )

    for api in "${apis[@]}"; do
        echo -n "  Enabling $api... "
        gcloud services enable "$api" --quiet
        echo -e "${GREEN}done${NC}"
    done

    print_success "All APIs enabled"
}

# ============================================================================
# Setup Cloud SQL
# ============================================================================

setup_cloud_sql() {
    if [[ "$SKIP_DB" == "true" ]] || [[ "$FRONTEND_ONLY" == "true" ]]; then
        print_info "Skipping Cloud SQL setup"
        return
    fi

    print_step "Setting Up Cloud SQL"

    # Check if instance exists
    if gcloud sql instances describe "$CLOUD_SQL_INSTANCE" --project="$GCP_PROJECT_ID" &>/dev/null; then
        print_info "Cloud SQL instance '$CLOUD_SQL_INSTANCE' already exists"
    else
        print_info "Creating Cloud SQL instance '$CLOUD_SQL_INSTANCE'..."
        echo "This may take 5-10 minutes..."

        gcloud sql instances create "$CLOUD_SQL_INSTANCE" \
            --project="$GCP_PROJECT_ID" \
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
            --quiet

        print_success "Cloud SQL instance created"
    fi

    # Create database
    if gcloud sql databases describe "$DB_NAME" --instance="$CLOUD_SQL_INSTANCE" --project="$GCP_PROJECT_ID" &>/dev/null; then
        print_info "Database '$DB_NAME' already exists"
    else
        gcloud sql databases create "$DB_NAME" \
            --instance="$CLOUD_SQL_INSTANCE" \
            --project="$GCP_PROJECT_ID"
        print_success "Database '$DB_NAME' created"
    fi

    # Create/update user
    if gcloud sql users list --instance="$CLOUD_SQL_INSTANCE" --project="$GCP_PROJECT_ID" --format="value(name)" 2>/dev/null | grep -q "^${DB_USER}$"; then
        gcloud sql users set-password "$DB_USER" \
            --instance="$CLOUD_SQL_INSTANCE" \
            --project="$GCP_PROJECT_ID" \
            --password="$DB_PASSWORD" \
            --quiet
        print_info "Database user password updated"
    else
        gcloud sql users create "$DB_USER" \
            --instance="$CLOUD_SQL_INSTANCE" \
            --project="$GCP_PROJECT_ID" \
            --password="$DB_PASSWORD" \
            --quiet
        print_success "Database user '$DB_USER' created"
    fi

    # Get connection name
    CONNECTION_NAME=$(gcloud sql instances describe "$CLOUD_SQL_INSTANCE" --project="$GCP_PROJECT_ID" --format="value(connectionName)")
    print_success "Connection name: $CONNECTION_NAME"
}

# ============================================================================
# Setup Secret Manager
# ============================================================================

create_or_update_secret() {
    local secret_name="$1"
    local secret_value="$2"

    if [[ -z "$secret_value" ]]; then
        print_warning "Skipping empty secret: $secret_name"
        return
    fi

    if gcloud secrets describe "$secret_name" --project="$GCP_PROJECT_ID" &>/dev/null; then
        echo -n "$secret_value" | gcloud secrets versions add "$secret_name" \
            --data-file=- \
            --project="$GCP_PROJECT_ID" \
            --quiet
        print_info "Updated secret: $secret_name"
    else
        echo -n "$secret_value" | gcloud secrets create "$secret_name" \
            --data-file=- \
            --project="$GCP_PROJECT_ID" \
            --quiet
        print_success "Created secret: $secret_name"
    fi
}

setup_secrets() {
    if [[ "$FRONTEND_ONLY" == "true" ]]; then
        print_info "Skipping secrets setup for frontend-only deployment"
        return
    fi

    print_step "Setting Up Secret Manager"

    create_or_update_secret "kitchen48-db-password" "$DB_PASSWORD"
    create_or_update_secret "kitchen48-jwt-secret" "$JWT_SECRET"

    if [[ -n "$EMAIL_SERVER_PASSWORD" ]]; then
        create_or_update_secret "kitchen48-email-password" "$EMAIL_SERVER_PASSWORD"
    fi

    if [[ -n "$GOOGLE_CLIENT_SECRET" ]]; then
        create_or_update_secret "kitchen48-google-client-secret" "$GOOGLE_CLIENT_SECRET"
    fi

    print_success "Secrets configured"
}

# ============================================================================
# Deploy Backend
# ============================================================================

deploy_backend() {
    if [[ "$FRONTEND_ONLY" == "true" ]]; then
        print_info "Skipping backend deployment"
        return
    fi

    print_step "Deploying Backend to Cloud Run"

    # Get Cloud SQL connection name
    CONNECTION_NAME=$(gcloud sql instances describe "$CLOUD_SQL_INSTANCE" --project="$GCP_PROJECT_ID" --format="value(connectionName)" 2>/dev/null || echo "")

    if [[ -z "$CONNECTION_NAME" ]]; then
        print_error "Cloud SQL instance not found. Run without --skip-db first."
        exit 1
    fi

    # Build environment variables string (NOTE: PORT is reserved by Cloud Run, don't set it)
    local env_vars="NODE_ENV=production"
    env_vars+=",DATABASE_URL=postgresql://${DB_USER}:\${DB_PASSWORD}@localhost/${DB_NAME}?host=/cloudsql/${CONNECTION_NAME}"
    env_vars+=",JWT_EXPIRES_IN=7d"

    # Email config
    env_vars+=",EMAIL_SERVER_HOST=${EMAIL_SERVER_HOST:-smtp.gmail.com}"
    env_vars+=",EMAIL_SERVER_PORT=${EMAIL_SERVER_PORT:-587}"
    env_vars+=",EMAIL_SERVER_USER=${EMAIL_SERVER_USER:-}"
    env_vars+=",EMAIL_FROM=${EMAIL_FROM:-}"

    # Google OAuth
    if [[ -n "$GOOGLE_CLIENT_ID" ]]; then
        env_vars+=",GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}"
        env_vars+=",GOOGLE_CALLBACK_URL=https://${BACKEND_SERVICE}-${GCP_PROJECT_ID}.${REGION}.run.app/api/auth/google/callback"
    fi

    # Build secrets string
    local secrets="DB_PASSWORD=kitchen48-db-password:latest"
    secrets+=",JWT_SECRET=kitchen48-jwt-secret:latest"

    if gcloud secrets describe "kitchen48-email-password" --project="$GCP_PROJECT_ID" &>/dev/null; then
        secrets+=",EMAIL_SERVER_PASSWORD=kitchen48-email-password:latest"
    fi

    if gcloud secrets describe "kitchen48-google-client-secret" --project="$GCP_PROJECT_ID" &>/dev/null; then
        secrets+=",GOOGLE_CLIENT_SECRET=kitchen48-google-client-secret:latest"
    fi

    print_info "Building and deploying backend..."

    gcloud run deploy "$BACKEND_SERVICE" \
        --source "$PROJECT_ROOT/backend" \
        --project="$GCP_PROJECT_ID" \
        --region="$REGION" \
        --platform=managed \
        --add-cloudsql-instances="$CONNECTION_NAME" \
        --set-env-vars="$env_vars" \
        --set-secrets="$secrets" \
        --allow-unauthenticated \
        --memory=512Mi \
        --cpu=1 \
        --min-instances=0 \
        --max-instances=10 \
        --quiet

    # Get backend URL
    BACKEND_URL=$(gcloud run services describe "$BACKEND_SERVICE" --project="$GCP_PROJECT_ID" --region="$REGION" --format="value(status.url)")
    print_success "Backend deployed: $BACKEND_URL"

    # Update FRONTEND_URL in backend for email links
    print_info "Updating FRONTEND_URL environment variable..."

    # We'll set this after frontend is deployed or use a placeholder
    if [[ -n "$FRONTEND_DOMAIN" ]]; then
        gcloud run services update "$BACKEND_SERVICE" \
            --project="$GCP_PROJECT_ID" \
            --region="$REGION" \
            --update-env-vars="FRONTEND_URL=https://${FRONTEND_DOMAIN}" \
            --quiet
    fi
}

# ============================================================================
# Run Database Migrations
# ============================================================================

run_migrations() {
    if [[ "$FRONTEND_ONLY" == "true" ]]; then
        return
    fi

    print_step "Running Database Migrations"

    print_info "Migrations will run automatically on first backend request"
    print_info "Or you can run them manually using Cloud SQL Auth Proxy"

    # Test backend health
    if [[ -n "$BACKEND_URL" ]]; then
        print_info "Testing backend health endpoint..."
        sleep 5  # Give the service a moment to start

        if curl -sf "${BACKEND_URL}/api/health" > /dev/null 2>&1; then
            print_success "Backend is healthy"
        else
            print_warning "Backend health check failed - service may still be starting"
        fi
    fi
}

# ============================================================================
# Deploy Frontend
# ============================================================================

deploy_frontend() {
    if [[ "$BACKEND_ONLY" == "true" ]]; then
        print_info "Skipping frontend deployment"
        return
    fi

    print_step "Deploying Frontend to Cloud Run"

    # Get backend URL if not already set
    if [[ -z "$BACKEND_URL" ]]; then
        BACKEND_URL=$(gcloud run services describe "$BACKEND_SERVICE" --project="$GCP_PROJECT_ID" --region="$REGION" --format="value(status.url)" 2>/dev/null || echo "")
    fi

    if [[ -z "$BACKEND_URL" ]]; then
        print_warning "Backend URL not found - frontend will need manual API configuration"
        BACKEND_URL="https://${BACKEND_SERVICE}-${GCP_PROJECT_ID}.${REGION}.run.app"
    fi

    print_info "Building and deploying frontend..."
    print_info "API URL: $BACKEND_URL"

    # Frontend doesn't need secrets, just the API URL
    gcloud run deploy "$FRONTEND_SERVICE" \
        --source "$PROJECT_ROOT/frontend" \
        --project="$GCP_PROJECT_ID" \
        --region="$REGION" \
        --platform=managed \
        --set-env-vars="VITE_API_URL=${BACKEND_URL}" \
        --allow-unauthenticated \
        --memory=256Mi \
        --cpu=1 \
        --min-instances=0 \
        --max-instances=10 \
        --quiet

    # Get frontend URL
    FRONTEND_URL=$(gcloud run services describe "$FRONTEND_SERVICE" --project="$GCP_PROJECT_ID" --region="$REGION" --format="value(status.url)")
    print_success "Frontend deployed: $FRONTEND_URL"

    # Update backend with frontend URL for email links
    if [[ "$BACKEND_ONLY" != "true" ]] && [[ -n "$FRONTEND_URL" ]]; then
        print_info "Updating backend FRONTEND_URL..."
        gcloud run services update "$BACKEND_SERVICE" \
            --project="$GCP_PROJECT_ID" \
            --region="$REGION" \
            --update-env-vars="FRONTEND_URL=${FRONTEND_URL}" \
            --quiet 2>/dev/null || true
    fi
}

# ============================================================================
# Print Summary
# ============================================================================

print_summary() {
    print_step "Deployment Complete!"

    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                    DEPLOYMENT SUMMARY                          ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    echo -e "${BOLD}Project:${NC} $GCP_PROJECT_ID"
    echo -e "${BOLD}Region:${NC}  $REGION"
    echo ""

    if [[ "$FRONTEND_ONLY" != "true" ]]; then
        echo -e "${BOLD}Cloud SQL:${NC}"
        echo "  Instance: $CLOUD_SQL_INSTANCE"
        echo "  Database: $DB_NAME"
        echo "  User:     $DB_USER"
        echo ""

        echo -e "${BOLD}Backend:${NC}"
        if [[ -n "$BACKEND_URL" ]]; then
            echo "  URL:     $BACKEND_URL"
            echo "  Health:  ${BACKEND_URL}/api/health"
        fi
        echo ""
    fi

    if [[ "$BACKEND_ONLY" != "true" ]]; then
        echo -e "${BOLD}Frontend:${NC}"
        if [[ -n "$FRONTEND_URL" ]]; then
            echo "  URL:     $FRONTEND_URL"
        fi
        echo ""
    fi

    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}Next Steps:${NC}"
    echo ""
    echo "1. Test the deployment:"
    if [[ -n "$BACKEND_URL" ]]; then
        echo "   curl ${BACKEND_URL}/api/health"
    fi
    if [[ -n "$FRONTEND_URL" ]]; then
        echo "   Open: $FRONTEND_URL"
    fi
    echo ""
    echo "2. Set up custom domains (optional):"
    echo "   gcloud run domain-mappings create --service=$FRONTEND_SERVICE --domain=www.kitchen48.com --region=$REGION"
    echo "   gcloud run domain-mappings create --service=$BACKEND_SERVICE --domain=api.kitchen48.com --region=$REGION"
    echo ""
    echo "3. View logs:"
    echo "   gcloud run services logs read $BACKEND_SERVICE --region=$REGION --limit=50"
    echo ""
}

# ============================================================================
# Main Execution
# ============================================================================

main() {
    print_banner

    check_prerequisites
    collect_secrets
    enable_apis
    setup_cloud_sql
    setup_secrets
    deploy_backend
    run_migrations
    deploy_frontend
    print_summary
}

# Run main function
main
