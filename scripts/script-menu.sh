#!/bin/bash
#
# Kitchen48 Script Menu
# Interactive launcher for all project scripts.
#
# Usage: ./scripts/script-menu.sh
#

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# ── Colors ─────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
WHITE='\033[1;37m'
DIM='\033[2m'
RESET='\033[0m'

# ── Script Registry ────────────────────────────────────────────────────────
# Format: "script_file|description|args_hint|needs_args"
SCRIPTS=(
  "backup-database.sh|Backup the local dev database|[backup-name]|no"
  "restore-database.sh|Restore a database backup|<backups/file.dump>|yes"
  "ensure-db.sh|Ensure the dev database container is running||no"
  "copy-recipe-to-prod.js|Copy recipes from dev to production|<nickname/slug> [...]|yes"
  "copy-recipe-to-dev.js|Copy recipes from production to dev|<nickname/slug> [...]|yes"
  "deploy.sh|One-click deploy to Google Cloud Run||no"
  "deploy-cloud-sql.sh|Deploy/update Cloud SQL instance||no"
  "gcp-services.sh|Interactive GCP services dashboard||no"
  "prod-db.sh|Connect to production database||no"
)

show_menu() {
  clear
  echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${RESET}"
  echo -e "${GREEN}║${WHITE}           Kitchen48 Script Menu                            ${GREEN}║${RESET}"
  echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${RESET}"
  echo ""

  local idx=1
  local category=""

  # Database
  echo -e "  ${YELLOW}Database${RESET}"
  for i in 0 1 2; do
    IFS='|' read -r file desc args needs_args <<< "${SCRIPTS[$i]}"
    printf "    ${CYAN}%2d)${RESET} %-28s ${DIM}%s${RESET}\n" "$idx" "$desc" "$file"
    ((idx++))
  done
  echo ""

  # Recipe Copy
  echo -e "  ${YELLOW}Recipe Copy${RESET}"
  for i in 3 4; do
    IFS='|' read -r file desc args needs_args <<< "${SCRIPTS[$i]}"
    printf "    ${CYAN}%2d)${RESET} %-28s ${DIM}%s${RESET}\n" "$idx" "$desc" "$file"
    ((idx++))
  done
  echo ""

  # Deployment
  echo -e "  ${YELLOW}Deployment${RESET}"
  for i in 5 6; do
    IFS='|' read -r file desc args needs_args <<< "${SCRIPTS[$i]}"
    printf "    ${CYAN}%2d)${RESET} %-28s ${DIM}%s${RESET}\n" "$idx" "$desc" "$file"
    ((idx++))
  done
  echo ""

  # GCP Management
  echo -e "  ${YELLOW}Google Cloud${RESET}"
  for i in 7 8; do
    IFS='|' read -r file desc args needs_args <<< "${SCRIPTS[$i]}"
    printf "    ${CYAN}%2d)${RESET} %-28s ${DIM}%s${RESET}\n" "$idx" "$desc" "$file"
    ((idx++))
  done
  echo ""

  echo -e "    ${CYAN} q)${RESET} Quit"
  echo ""
}

run_script() {
  local choice=$1
  local idx=$((choice - 1))

  if [ "$idx" -lt 0 ] || [ "$idx" -ge "${#SCRIPTS[@]}" ]; then
    echo -e "\n  ${YELLOW}Invalid choice.${RESET}"
    read -rp "  Press Enter to continue..."
    return
  fi

  IFS='|' read -r file desc args needs_args <<< "${SCRIPTS[$idx]}"
  local script_path="$SCRIPT_DIR/$file"

  if [ ! -f "$script_path" ]; then
    echo -e "\n  ${YELLOW}Script not found: $file${RESET}"
    read -rp "  Press Enter to continue..."
    return
  fi

  echo ""
  echo -e "  ${GREEN}Running:${RESET} $file"

  # Determine how to run the script
  local runner=""
  case "$file" in
    *.js)  runner="node" ;;
    *.sh)  runner="bash" ;;
    *.ts)  runner="npx tsx" ;;
  esac

  # Ask for arguments if needed
  local user_args=""
  if [ "$needs_args" = "yes" ]; then
    echo -e "  ${DIM}Arguments: $args${RESET}"
    read -rp "  Enter arguments: " user_args
    if [ -z "$user_args" ]; then
      echo -e "\n  ${YELLOW}No arguments provided. Cancelled.${RESET}"
      read -rp "  Press Enter to continue..."
      return
    fi
  fi

  echo -e "  ${DIM}────────────────────────────────────────${RESET}"
  echo ""

  # Run from project root
  cd "$PROJECT_DIR"
  # shellcheck disable=SC2086
  $runner "$script_path" $user_args
  local exit_code=$?

  echo ""
  echo -e "  ${DIM}────────────────────────────────────────${RESET}"
  if [ $exit_code -eq 0 ]; then
    echo -e "  ${GREEN}Done.${RESET}"
  else
    echo -e "  ${YELLOW}Exited with code $exit_code${RESET}"
  fi
  read -rp "  Press Enter to continue..."
}

# ── Main Loop ──────────────────────────────────────────────────────────────
while true; do
  show_menu
  read -rp "  Choose a script (1-${#SCRIPTS[@]}) or q to quit: " input

  case "$input" in
    q|Q|quit|exit) echo ""; exit 0 ;;
    [0-9]*)        run_script "$input" ;;
    *)             ;;
  esac
done
