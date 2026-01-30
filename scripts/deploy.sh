#!/bin/bash
set -e

# ============================================================================
# Kitchen48 One-Click Deployment Script
# ============================================================================
# Deploys the complete Kitchen48 application to Google Cloud:
#   - Cloud SQL (PostgreSQL 16)
#   - Combined App (Cloud Run) - nginx + Node.js in single container
#
# Architecture: BFF (Backend-for-Frontend)
#   - Single Cloud Run service serves both frontend and API
#   - nginx proxies /api/* to Node.js backend
#   - Eliminates CORS issues and simplifies deployment
#
# Usage:
#   ./scripts/deploy.sh                    # Full deployment
#   ./scripts/deploy.sh --env-file FILE    # Use env file for secrets
#   ./scripts/deploy.sh --skip-db          # Skip Cloud SQL setup
#   ./scripts/deploy.sh --help             # Show help
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

# Service name (single combined service)
APP_SERVICE="kitchen48-app"

# Flags
SKIP_DB=false
ENV_FILE=""

# ============================================================================
# Helper Functions
# ============================================================================

print_banner() {
    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC}           ${BOLD}Kitchen48 One-Click Deployment${NC}                      ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}              (Combined BFF Architecture)                      ${CYAN}║${NC}"
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
            echo "  --help, -h         Show this help message"
            echo ""
            echo "Environment Variables (in .env.production):"
            echo "  GCP_PROJECT_ID     Google Cloud project ID"
            echo "  GCP_REGION         Deployment region (default: us-central1)"
            echo "  DB_PASSWORD        Database password (min 8 chars)"
            echo "  JWT_SECRET         JWT signing key (min 32 chars)"
            echo "  EMAIL_SERVER_*     Email configuration"
            echo "  GOOGLE_CLIENT_*    Google OAuth configuration"
            echo "  FRONTEND_DOMAIN    Custom domain (e.g., www.kitchen48.com)"
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
# Validate Local Build (catches errors before cloud build)
# ============================================================================

validate_local_build() {
    print_step "Validating Local Build"

    print_info "Building frontend..."
    cd "$PROJECT_ROOT/frontend"
    if ! npm run build > /tmp/frontend-build.log 2>&1; then
        print_error "Frontend build failed!"
        echo ""
        echo "Build output:"
        tail -30 /tmp/frontend-build.log
        exit 1
    fi
    print_success "Frontend build passed"

    print_info "Compiling backend TypeScript..."
    cd "$PROJECT_ROOT/backend"
    if ! npx tsc --noEmit > /tmp/backend-build.log 2>&1; then
        print_error "Backend TypeScript compilation failed!"
        echo ""
        echo "Build output:"
        cat /tmp/backend-build.log
        exit 1
    fi
    print_success "Backend TypeScript check passed"

    cd "$PROJECT_ROOT"
    print_success "Local build validation complete"
}

# ============================================================================
# Collect Required Secrets
# ============================================================================

collect_secrets() {
    print_step "Collecting Required Secrets"

    # Database password
    if [[ -z "$DB_PASSWORD" ]] && [[ "$SKIP_DB" != "true" ]]; then
        echo -e "${YELLOW}Enter database password (min 8 characters):${NC}"
        read -s DB_PASSWORD
        echo ""
        if [[ ${#DB_PASSWORD} -lt 8 ]]; then
            print_error "Password must be at least 8 characters."
            exit 1
        fi
    fi

    # JWT Secret
    if [[ -z "$JWT_SECRET" ]]; then
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
    if [[ -z "$EMAIL_SERVER_PASSWORD" ]]; then
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
    if [[ "$SKIP_DB" == "true" ]]; then
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
        # Check if secret value has changed before creating new version
        local current_value
        current_value=$(gcloud secrets versions access latest --secret="$secret_name" --project="$GCP_PROJECT_ID" 2>/dev/null || echo "")

        if [[ "$current_value" == "$secret_value" ]]; then
            print_info "Secret unchanged: $secret_name (skipped)"
            return
        fi

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
    print_step "Setting Up Secret Manager"

    create_or_update_secret "kitchen48-db-password" "$DB_PASSWORD"
    create_or_update_secret "kitchen48-jwt-secret" "$JWT_SECRET"

    # Create full DATABASE_URL as secret (Cloud Run doesn't expand nested vars)
    CONNECTION_NAME=$(gcloud sql instances describe "$CLOUD_SQL_INSTANCE" --project="$GCP_PROJECT_ID" --format="value(connectionName)" 2>/dev/null || echo "")
    if [[ -n "$CONNECTION_NAME" ]]; then
        local database_url="postgresql://${DB_USER}:${DB_PASSWORD}@localhost/${DB_NAME}?host=/cloudsql/${CONNECTION_NAME}"
        create_or_update_secret "kitchen48-database-url" "$database_url"
    fi

    if [[ -n "$EMAIL_SERVER_PASSWORD" ]]; then
        create_or_update_secret "kitchen48-email-password" "$EMAIL_SERVER_PASSWORD"
    fi

    if [[ -n "$GOOGLE_CLIENT_SECRET" ]]; then
        create_or_update_secret "kitchen48-google-client-secret" "$GOOGLE_CLIENT_SECRET"
    fi

    print_success "Secrets configured"
}

# ============================================================================
# Deploy Combined App
# ============================================================================

deploy_app() {
    print_step "Deploying Combined App to Cloud Run"

    # Get Cloud SQL connection name
    CONNECTION_NAME=$(gcloud sql instances describe "$CLOUD_SQL_INSTANCE" --project="$GCP_PROJECT_ID" --format="value(connectionName)" 2>/dev/null || echo "")

    if [[ -z "$CONNECTION_NAME" ]]; then
        print_error "Cloud SQL instance not found. Run without --skip-db first."
        exit 1
    fi

    # Determine frontend URL for email links
    local frontend_url=""
    if [[ -n "$FRONTEND_DOMAIN" ]]; then
        frontend_url="https://${FRONTEND_DOMAIN}"
    else
        # Will be the Cloud Run URL
        frontend_url="https://${APP_SERVICE}-${GCP_PROJECT_ID}.${REGION}.run.app"
    fi

    # Build environment variables string (DATABASE_URL is a secret)
    local env_vars="NODE_ENV=production"
    env_vars+=",JWT_EXPIRES_IN=7d"
    env_vars+=",FRONTEND_URL=${frontend_url}"

    # Email config
    env_vars+=",EMAIL_SERVER_HOST=${EMAIL_SERVER_HOST:-smtp.gmail.com}"
    env_vars+=",EMAIL_SERVER_PORT=${EMAIL_SERVER_PORT:-587}"
    env_vars+=",EMAIL_SERVER_USER=${EMAIL_SERVER_USER:-}"
    env_vars+=",EMAIL_FROM=${EMAIL_FROM:-}"

    # Google OAuth
    if [[ -n "$GOOGLE_CLIENT_ID" ]]; then
        env_vars+=",GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}"
        # OAuth callback goes to the same service
        if [[ -n "$FRONTEND_DOMAIN" ]]; then
            env_vars+=",GOOGLE_CALLBACK_URL=https://${FRONTEND_DOMAIN}/api/auth/google/callback"
        else
            env_vars+=",GOOGLE_CALLBACK_URL=https://${APP_SERVICE}-${GCP_PROJECT_ID}.${REGION}.run.app/api/auth/google/callback"
        fi
    fi

    # Build secrets string
    local secrets="DATABASE_URL=kitchen48-database-url:latest"
    secrets+=",JWT_SECRET=kitchen48-jwt-secret:latest"

    if gcloud secrets describe "kitchen48-email-password" --project="$GCP_PROJECT_ID" &>/dev/null; then
        secrets+=",EMAIL_SERVER_PASSWORD=kitchen48-email-password:latest"
    fi

    if gcloud secrets describe "kitchen48-google-client-secret" --project="$GCP_PROJECT_ID" &>/dev/null; then
        secrets+=",GOOGLE_CLIENT_SECRET=kitchen48-google-client-secret:latest"
    fi

    print_info "Building and deploying combined app..."
    print_info "This builds both frontend and backend into a single container"

    gcloud run deploy "$APP_SERVICE" \
        --source "$PROJECT_ROOT" \
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

    # Get app URL
    APP_URL=$(gcloud run services describe "$APP_SERVICE" --project="$GCP_PROJECT_ID" --region="$REGION" --format="value(status.url)")
    print_success "App deployed: $APP_URL"

    # Update FRONTEND_URL if using Cloud Run URL
    if [[ -z "$FRONTEND_DOMAIN" ]]; then
        print_info "Updating FRONTEND_URL to actual deployed URL..."
        gcloud run services update "$APP_SERVICE" \
            --project="$GCP_PROJECT_ID" \
            --region="$REGION" \
            --update-env-vars="FRONTEND_URL=${APP_URL}" \
            --quiet
    fi
}

# ============================================================================
# Test Deployment
# ============================================================================

test_deployment() {
    print_step "Testing Deployment"

    if [[ -z "$APP_URL" ]]; then
        APP_URL=$(gcloud run services describe "$APP_SERVICE" --project="$GCP_PROJECT_ID" --region="$REGION" --format="value(status.url)" 2>/dev/null || echo "")
    fi

    if [[ -n "$APP_URL" ]]; then
        print_info "Waiting for service to start..."
        sleep 10

        # Test frontend
        print_info "Testing frontend..."
        if curl -sf "${APP_URL}/" > /dev/null 2>&1; then
            print_success "Frontend is responding"
        else
            print_warning "Frontend not responding yet (may still be starting)"
        fi

        # Test API health
        print_info "Testing API health endpoint..."
        if curl -sf "${APP_URL}/api/health" > /dev/null 2>&1; then
            print_success "API is healthy"
        else
            print_warning "API health check failed (may still be starting)"
        fi
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

    echo -e "${BOLD}Architecture:${NC} BFF (Backend-for-Frontend)"
    echo "  - Single Cloud Run service"
    echo "  - nginx serves frontend + proxies /api/* to Node.js"
    echo ""

    echo -e "${BOLD}Cloud SQL:${NC}"
    echo "  Instance: $CLOUD_SQL_INSTANCE"
    echo "  Database: $DB_NAME"
    echo "  User:     $DB_USER"
    echo ""

    echo -e "${BOLD}Application:${NC}"
    if [[ -n "$APP_URL" ]]; then
        echo "  URL:        $APP_URL"
        echo "  API Health: ${APP_URL}/api/health"
    fi
    echo ""

    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}Next Steps:${NC}"
    echo ""
    echo "1. Test the deployment:"
    if [[ -n "$APP_URL" ]]; then
        echo "   curl ${APP_URL}/api/health"
        echo "   Open: $APP_URL"
    fi
    echo ""
    echo "2. Set up custom domain (optional):"
    echo "   gcloud beta run domain-mappings create --service=$APP_SERVICE --domain=www.kitchen48.com --region=$REGION"
    echo ""
    echo "3. View logs:"
    echo "   gcloud run services logs read $APP_SERVICE --region=$REGION --limit=50"
    echo ""
    echo "4. Clean up old services (if migrating from separate frontend/backend):"
    echo "   gcloud run services delete kitchen48-frontend --region=$REGION --quiet"
    echo "   gcloud run services delete kitchen48-backend --region=$REGION --quiet"
    echo ""
}

# ============================================================================
# Main Execution
# ============================================================================

main() {
    print_banner

    check_prerequisites
    validate_local_build
    collect_secrets
    enable_apis
    setup_cloud_sql
    setup_secrets
    deploy_app
    test_deployment
    print_summary
}

# Run main function
main
