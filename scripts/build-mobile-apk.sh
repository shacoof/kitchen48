#!/bin/bash
set -e

# ============================================================================
# Kitchen48 Mobile APK Build Script
# ============================================================================
# Builds a standalone Android APK via EAS Build (cloud build, ~10-15 min).
# APK is suitable for sideloading onto a phone — no Play Store required.
#
# Profiles:
#   preview     — APK for internal distribution/sideload (default)
#   production  — AAB for Play Store submission
#   development — APK with dev client (connects to Metro, for debugging)
#
# Usage:
#   ./scripts/build-mobile-apk.sh                  # preview APK (default)
#   ./scripts/build-mobile-apk.sh preview          # same as above
#   ./scripts/build-mobile-apk.sh production       # production AAB
#   ./scripts/build-mobile-apk.sh development      # dev client APK
#   ./scripts/build-mobile-apk.sh --help           # show help
#
# Prerequisites:
#   - Logged in to EAS (`npx eas-cli login`)
#   - Clean git state in mobile/ (recommended but not enforced)
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
MOBILE_DIR="$PROJECT_ROOT/mobile"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

PROFILE="${1:-preview}"

if [ "$PROFILE" = "--help" ] || [ "$PROFILE" = "-h" ]; then
  sed -n '3,22p' "$0" | sed 's/^# \{0,1\}//'
  exit 0
fi

case "$PROFILE" in
  preview|production|development) ;;
  *)
    echo -e "${RED}Unknown profile: $PROFILE${NC}"
    echo "Valid profiles: preview, production, development"
    exit 1
    ;;
esac

if [ ! -d "$MOBILE_DIR" ]; then
  echo -e "${RED}mobile/ directory not found at: $MOBILE_DIR${NC}"
  exit 1
fi

if [ ! -f "$MOBILE_DIR/eas.json" ]; then
  echo -e "${RED}eas.json not found in mobile/. Run 'npx eas-cli@latest build:configure' first.${NC}"
  exit 1
fi

cd "$MOBILE_DIR"

echo -e "${CYAN}${BOLD}Kitchen48 Mobile APK Build${NC}"
echo "============================================================================"
echo -e "Profile:    ${YELLOW}$PROFILE${NC}"
echo -e "Platform:   ${YELLOW}android${NC}"
echo -e "Working in: $MOBILE_DIR"
echo "============================================================================"

# Verify EAS login
echo -e "\n${CYAN}Checking EAS login...${NC}"
if ! npx eas-cli@latest whoami > /dev/null 2>&1; then
  echo -e "${RED}Not logged in to EAS. Run: npx eas-cli@latest login${NC}"
  exit 1
fi
EAS_USER=$(npx eas-cli@latest whoami 2>/dev/null | head -1)
echo -e "${GREEN}Logged in as: $EAS_USER${NC}"

# TypeScript check before burning a cloud build slot
echo -e "\n${CYAN}Running TypeScript check...${NC}"
if ! npx tsc --noEmit; then
  echo -e "${RED}TypeScript errors found. Fix before building.${NC}"
  exit 1
fi
echo -e "${GREEN}TypeScript check passed${NC}"

# Show git state (informational)
if git rev-parse --git-dir > /dev/null 2>&1; then
  COMMIT=$(git rev-parse --short HEAD)
  BRANCH=$(git rev-parse --abbrev-ref HEAD)
  echo -e "\n${CYAN}Git:${NC} $BRANCH @ $COMMIT"
  if [ -n "$(git status --porcelain mobile/ 2>/dev/null)" ]; then
    echo -e "${YELLOW}Warning: uncommitted changes in mobile/ — they will be included in the build${NC}"
  fi
fi

# Kick off the build
echo -e "\n${CYAN}Starting EAS build (cloud, ~10-15 min)...${NC}"
echo -e "${YELLOW}The build will show a URL — you can leave this terminal or watch progress there.${NC}\n"

npx eas-cli@latest build --platform android --profile "$PROFILE" --non-interactive

echo -e "\n${GREEN}${BOLD}Build submitted.${NC}"
echo -e "View build: ${CYAN}https://expo.dev/accounts/shacoof/projects/kitchen48/builds${NC}"
echo -e "When the build completes, open the URL on your phone to download and install the APK."
