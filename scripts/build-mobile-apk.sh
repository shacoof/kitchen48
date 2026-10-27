#!/bin/bash
set -e

# ============================================================================
# Kitchen48 Mobile APK Build Script
# ============================================================================
# Builds an Android APK, bumps the app version (v1.1, v1.2, ...), and uploads
# the result to the shared Google Drive builds folder.
#
# Profiles:
#   preview     — APK for internal distribution/sideload (default)
#   production  — AAB for Play Store submission
#   development — APK with dev client (connects to Metro, for debugging)
#
# Usage:
#   ./scripts/build-mobile-apk.sh                  # preview APK, local build
#   ./scripts/build-mobile-apk.sh production       # production AAB
#   ./scripts/build-mobile-apk.sh --cloud          # build on EAS servers instead
#   ./scripts/build-mobile-apk.sh --no-upload      # skip Google Drive upload
#   ./scripts/build-mobile-apk.sh --help           # show help
#
# Each build:
#   1. Bumps the major version in mobile/app.json (2.0.0 -> 3.0.0 ...); every
#      APK is a major version, OTA updates bump minor/patch
#      (scripts/publish-mobile-update.sh)
#   2. Builds (locally by default, needs JDK 17 + Android SDK)
#   3. Saves mobile/build-output/kitchen48-v<version>.apk
#   4. Uploads it to Google Drive via rclone (remote "gdrive")
#   5. Commits the version bump (reverted if the build fails)
#
# Prerequisites:
#   - Logged in to EAS (`npx eas-cli login`)
#   - rclone remote "gdrive" configured (`rclone config`)
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
MOBILE_DIR="$PROJECT_ROOT/mobile"
OUTPUT_DIR="$MOBILE_DIR/build-output"

# Google Drive destination folder
RCLONE_REMOTE="${K48_RCLONE_REMOTE:-gdrive}"
DRIVE_FOLDER_ID="${K48_DRIVE_FOLDER_ID:-1f6LyPM-VBpw2yD24RFSgwN1UoQFuU2aB}"

# Local toolchain defaults (see mobile/CLAUDE.md)
export JAVA_HOME="${JAVA_HOME:-$HOME/.local/jdk/jdk-17.0.21+9}"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$HOME/.local/bin:$PATH"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

PROFILE="preview"
MODE="local"
UPLOAD=true

for arg in "$@"; do
  case "$arg" in
    -h|--help)
      sed -n '3,32p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    preview|production|development) PROFILE="$arg" ;;
    --cloud) MODE="cloud" ;;
    --local) MODE="local" ;;
    --no-upload) UPLOAD=false ;;
    *)
      echo -e "${RED}Unknown argument: $arg${NC}"
      echo "Run with --help for usage."
      exit 1
      ;;
  esac
done

if [ ! -f "$MOBILE_DIR/eas.json" ]; then
  echo -e "${RED}eas.json not found in mobile/. Run 'npx eas-cli@latest build:configure' first.${NC}"
  exit 1
fi

cd "$MOBILE_DIR"

if [ "$MODE" = "local" ] && { [ ! -x "$JAVA_HOME/bin/java" ] || [ ! -d "$ANDROID_HOME" ]; }; then
  echo -e "${RED}Local build needs JDK 17 (JAVA_HOME=$JAVA_HOME) and Android SDK (ANDROID_HOME=$ANDROID_HOME).${NC}"
  echo "Install them or use --cloud."
  exit 1
fi

# Abort early if the repo is mid-merge/rebase — the bump commit would conclude it
GIT_DIR="$(git rev-parse --git-dir)"
if [ -f "$GIT_DIR/MERGE_HEAD" ] || [ -d "$GIT_DIR/rebase-merge" ] || [ -d "$GIT_DIR/rebase-apply" ]; then
  echo -e "${RED}A git merge/rebase is in progress. Finish it before building.${NC}"
  exit 1
fi
if [ -n "$(git status --porcelain app.json)" ]; then
  echo -e "${RED}mobile/app.json has uncommitted changes. Commit or stash them first.${NC}"
  exit 1
fi

# Every APK is a new major version: 2.3.1 -> 3.0.0
OLD_VERSION=$(node -p "require('./app.json').expo.version")
NEW_VERSION=$(node -p "const [maj] = '$OLD_VERSION'.split('.').map(Number); (maj + 1) + '.0.0'")

if [ "$PROFILE" = "production" ]; then EXT="aab"; else EXT="apk"; fi
SUFFIX=""
[ "$PROFILE" != "preview" ] && SUFFIX="-$PROFILE"
ARTIFACT_NAME="kitchen48-v${NEW_VERSION}${SUFFIX}.${EXT}"
ARTIFACT_PATH="$OUTPUT_DIR/$ARTIFACT_NAME"

echo -e "${CYAN}${BOLD}Kitchen48 Mobile Build${NC}"
echo "============================================================================"
echo -e "Profile:    ${YELLOW}$PROFILE${NC}"
echo -e "Mode:       ${YELLOW}$MODE${NC}"
echo -e "Version:    ${YELLOW}$OLD_VERSION -> $NEW_VERSION${NC}"
echo -e "Output:     $ARTIFACT_PATH"
echo "============================================================================"

# Verify EAS login
echo -e "\n${CYAN}Checking EAS login...${NC}"
if ! npx eas-cli@latest whoami > /dev/null 2>&1; then
  echo -e "${RED}Not logged in to EAS. Run: npx eas-cli@latest login${NC}"
  exit 1
fi
echo -e "${GREEN}Logged in as: $(npx eas-cli@latest whoami 2>/dev/null | head -1)${NC}"

# TypeScript check before spending build time
echo -e "\n${CYAN}Running TypeScript check...${NC}"
if ! npx tsc --noEmit; then
  echo -e "${RED}TypeScript errors found. Fix before building.${NC}"
  exit 1
fi
echo -e "${GREEN}TypeScript check passed${NC}"

if [ -n "$(git status --porcelain .)" ]; then
  echo -e "${YELLOW}Warning: uncommitted changes in mobile/ — they will be included in the build${NC}"
fi

# Bump version (reverted below if the build fails)
node -e "
const fs = require('fs');
const cfg = JSON.parse(fs.readFileSync('app.json', 'utf8'));
cfg.expo.version = '$NEW_VERSION';
fs.writeFileSync('app.json', JSON.stringify(cfg, null, 2) + '\n');
"
trap 'echo -e "${RED}Build failed — reverting version bump${NC}"; git checkout -- app.json' ERR

mkdir -p "$OUTPUT_DIR"

if [ "$MODE" = "local" ]; then
  echo -e "\n${CYAN}Starting local EAS build (~10-15 min)...${NC}\n"
  npx eas-cli@latest build --platform android --profile "$PROFILE" --local --non-interactive \
    --output "$ARTIFACT_PATH"
else
  echo -e "\n${CYAN}Starting cloud EAS build (~10-15 min, waiting for it to finish)...${NC}\n"
  BUILD_JSON=$(npx eas-cli@latest build --platform android --profile "$PROFILE" --non-interactive --wait --json)
  ARTIFACT_URL=$(echo "$BUILD_JSON" | node -e "
    const builds = JSON.parse(require('fs').readFileSync(0, 'utf8'));
    process.stdout.write(builds[0].artifacts.buildUrl);
  ")
  echo -e "${CYAN}Downloading $ARTIFACT_URL${NC}"
  curl -fsSL -o "$ARTIFACT_PATH" "$ARTIFACT_URL"
fi

trap - ERR

# Record the version bump
git add app.json
git commit -q -m "chore(mobile): build v$NEW_VERSION ($PROFILE)" -- app.json
echo -e "${GREEN}Committed version bump to v$NEW_VERSION${NC}"

# Upload to Google Drive
if [ "$UPLOAD" = true ]; then
  echo -e "\n${CYAN}Uploading to Google Drive...${NC}"
  if ! command -v rclone > /dev/null; then
    echo -e "${YELLOW}rclone not installed — skipping upload.${NC}"
  elif ! rclone listremotes 2>/dev/null | grep -q "^${RCLONE_REMOTE}:$"; then
    echo -e "${YELLOW}rclone remote '$RCLONE_REMOTE' not configured (run: rclone config) — skipping upload.${NC}"
  else
    rclone copy "$ARTIFACT_PATH" "${RCLONE_REMOTE}:" --drive-root-folder-id "$DRIVE_FOLDER_ID" --progress
    echo -e "${GREEN}Uploaded: https://drive.google.com/drive/folders/$DRIVE_FOLDER_ID${NC}"
  fi
fi

echo -e "\n${GREEN}${BOLD}Build v$NEW_VERSION complete.${NC}"
echo -e "Artifact: $ARTIFACT_PATH"
