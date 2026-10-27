#!/bin/bash
set -e

# ============================================================================
# Kitchen48 Mobile OTA Update Script
# ============================================================================
# Publishes the current JS/assets as an over-the-air update (EAS Update) to
# APKs already installed on phones, and bumps the app version like a build.
#
# Usage:
#   ./scripts/publish-mobile-update.sh "what changed"             # small change: 2.0.0 -> 2.0.1
#   ./scripts/publish-mobile-update.sh --feature "what changed"   # major feature: 2.0.1 -> 2.1.0
#   ./scripts/publish-mobile-update.sh "what changed" production  # production channel
#   ./scripts/publish-mobile-update.sh --help
#
# Each publish:
#   1. Bumps expo.version in mobile/app.json: patch for small changes, minor
#      with --feature (major is reserved for APK builds)
#   2. Publishes to the channel (only reaches APKs with the same native
#      fingerprint — native changes need a new APK via build-mobile-apk.sh)
#   3. Commits the bump (reverted if publishing fails)
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
MOBILE_DIR="$PROJECT_ROOT/mobile"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

MESSAGE=""
CHANNEL="preview"
BUMP="patch"

for arg in "$@"; do
  case "$arg" in
    -h|--help)
      sed -n '3,22p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    preview|production|development) CHANNEL="$arg" ;;
    --feature) BUMP="minor" ;;
    *)
      if [ -z "$MESSAGE" ]; then
        MESSAGE="$arg"
      else
        echo -e "${RED}Unexpected argument: $arg${NC}"
        echo "Run with --help for usage."
        exit 1
      fi
      ;;
  esac
done

if [ -z "$MESSAGE" ]; then
  echo -e "${RED}A message describing the update is required.${NC}"
  echo "Run with --help for usage."
  exit 1
fi

cd "$MOBILE_DIR"

GIT_DIR="$(git rev-parse --git-dir)"
if [ -f "$GIT_DIR/MERGE_HEAD" ] || [ -d "$GIT_DIR/rebase-merge" ] || [ -d "$GIT_DIR/rebase-apply" ]; then
  echo -e "${RED}A git merge/rebase is in progress. Finish it before publishing.${NC}"
  exit 1
fi
if [ -n "$(git status --porcelain app.json)" ]; then
  echo -e "${RED}mobile/app.json has uncommitted changes. Commit or stash them first.${NC}"
  exit 1
fi

OLD_VERSION=$(node -p "require('./app.json').expo.version")
NEW_VERSION=$(node -p "
const [maj, min = 0, pat = 0] = '$OLD_VERSION'.split('.').map(Number);
'$BUMP' === 'minor' ? maj + '.' + (min + 1) + '.0' : maj + '.' + min + '.' + (pat + 1)
")

echo -e "${CYAN}${BOLD}Kitchen48 OTA Update${NC}"
echo "============================================================================"
echo -e "Channel:    ${YELLOW}$CHANNEL${NC}"
echo -e "Version:    ${YELLOW}$OLD_VERSION -> $NEW_VERSION${NC} ($BUMP)"
echo -e "Message:    $MESSAGE"
echo "============================================================================"

echo -e "\n${CYAN}Running TypeScript check...${NC}"
if ! npx tsc --noEmit; then
  echo -e "${RED}TypeScript errors found. Fix before publishing.${NC}"
  exit 1
fi

if [ -n "$(git status --porcelain .)" ]; then
  echo -e "${YELLOW}Warning: uncommitted changes in mobile/ — they will be included in the update${NC}"
fi

node -e "
const fs = require('fs');
const cfg = JSON.parse(fs.readFileSync('app.json', 'utf8'));
cfg.expo.version = '$NEW_VERSION';
fs.writeFileSync('app.json', JSON.stringify(cfg, null, 2) + '\n');
"
trap 'echo -e "${RED}Publish failed — reverting version bump${NC}"; git checkout -- app.json' ERR

npx eas-cli@latest update --channel "$CHANNEL" --environment "$CHANNEL" --platform android \
  --message "v$NEW_VERSION: $MESSAGE" --non-interactive

trap - ERR

git add app.json
git commit -q -m "chore(mobile): OTA update v$NEW_VERSION ($CHANNEL)" -- app.json
echo -e "${GREEN}Committed version bump to v$NEW_VERSION${NC}"

echo -e "\n${GREEN}${BOLD}Update v$NEW_VERSION published.${NC}"
echo "On the phone: open the app, wait a few seconds, close it fully, reopen."
