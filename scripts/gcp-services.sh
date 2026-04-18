#!/bin/bash
#
# GCP Services Manager
# Manage Cloud Run services and Cloud SQL databases across projects.
#

set -euo pipefail

# ── Project Configuration ────────────────────────────────────────────────────
declare -A PROJECTS=(
  [yeshplan]="yeshplan"
  [recipe]="kitchen48-app-1769028672"
)

# ── Colors ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

# ── Helpers ──────────────────────────────────────────────────────────────────
spinner() {
  local pid=$1 msg=$2
  local chars='⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'
  while kill -0 "$pid" 2>/dev/null; do
    for (( i=0; i<${#chars}; i++ )); do
      printf "\r  ${CYAN}%s${NC} %s" "${chars:$i:1}" "$msg"
      sleep 0.1
    done
  done
  printf "\r"
}

print_header() {
  echo ""
  echo -e "${BOLD}╔══════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BOLD}║              GCP Services Manager                          ║${NC}"
  echo -e "${BOLD}╚══════════════════════════════════════════════════════════════╝${NC}"
  echo ""
}

print_separator() {
  echo -e "${DIM}──────────────────────────────────────────────────────────────${NC}"
}

# ── Data Collection ──────────────────────────────────────────────────────────
declare -a ALL_SERVICES=()     # "type|project_key|project_id|name|region|status|detail"

collect_services() {
  echo -e "  ${CYAN}Scanning projects...${NC}"
  echo ""

  for project_key in "${!PROJECTS[@]}"; do
    local project_id="${PROJECTS[$project_key]}"
    echo -e "  ${BLUE}[$project_key]${NC} ${DIM}($project_id)${NC}"

    # Cloud Run services
    local run_output
    run_output=$(gcloud run services list \
      --project="$project_id" \
      --format="csv[no-heading](metadata.name,status.address.url,metadata.labels['cloud.googleapis.com/location'])" \
      2>/dev/null) || true

    if [[ -n "$run_output" ]]; then
      while IFS=',' read -r name url region; do
        # Get ingress setting to determine if service is disabled
        local ingress
        ingress=$(gcloud run services describe "$name" \
          --project="$project_id" \
          --region="$region" \
          --format="value(metadata.annotations['run.googleapis.com/ingress'])" \
          2>/dev/null) || ingress=""

        local status="SERVING"
        local detail="ingress=$ingress"
        if [[ "$ingress" == "internal" ]]; then
          status="DISABLED"
          detail="ingress=internal (blocked)"
        fi

        ALL_SERVICES+=("cloudrun|$project_key|$project_id|$name|$region|$status|$detail|$url")
        echo -e "    ${GREEN}✓${NC} Cloud Run: $name ${DIM}($region)${NC}"
      done <<< "$run_output"
    fi

    # Cloud SQL instances
    local sql_output
    sql_output=$(gcloud sql instances list \
      --project="$project_id" \
      --format="csv[no-heading](name,databaseVersion,gceZone,settings.tier,state)" \
      2>/dev/null) || true

    if [[ -n "$sql_output" ]]; then
      while IFS=',' read -r name version zone tier state; do
        local region="${zone%-*}"
        local detail="$version | $tier"
        ALL_SERVICES+=("cloudsql|$project_key|$project_id|$name|$region|$state|$detail|")
        echo -e "    ${GREEN}✓${NC} Cloud SQL: $name ${DIM}($region, $tier)${NC}"
      done <<< "$sql_output"
    fi
  done

  echo ""
}

# ── Display ──────────────────────────────────────────────────────────────────
status_color() {
  case "$1" in
    SERVING|RUNNABLE|RUNNING)  echo -e "${GREEN}● $1${NC}" ;;
    DISABLED|STOPPED|SUSPENDED) echo -e "${RED}○ $1${NC}" ;;
    *)                          echo -e "${YELLOW}◐ $1${NC}" ;;
  esac
}

show_services() {
  echo ""
  echo -e "${BOLD} #   Type        Project     Name                  Region          Status          Details${NC}"
  print_separator

  local i=1
  for entry in "${ALL_SERVICES[@]}"; do
    IFS='|' read -r type pkey pid name region status detail url <<< "$entry"

    local type_label
    case "$type" in
      cloudrun)  type_label="${CYAN}Cloud Run${NC}" ;;
      cloudsql)  type_label="${YELLOW}Cloud SQL${NC}" ;;
      *)         type_label="$type" ;;
    esac

    printf " ${BOLD}%-3s${NC} %-20b %-11s %-21s %-15s %-24b %s\n" \
      "$i" "$type_label" "$pkey" "$name" "$region" "$(status_color "$status")" "$detail"

    i=$((i + 1))
  done

  echo ""
}

# ── Actions ──────────────────────────────────────────────────────────────────
action_cloud_run_stop() {
  local project_id=$1 name=$2 region=$3
  echo -e "  ${YELLOW}Disabling${NC} Cloud Run service ${BOLD}$name${NC}..."
  echo -e "  ${DIM}Setting ingress=internal to block external traffic${NC}"
  gcloud run services update "$name" \
    --project="$project_id" \
    --region="$region" \
    --ingress=internal \
    --quiet 2>&1 | tail -1
  echo -e "  ${GREEN}Done.${NC} External traffic blocked, service will scale to zero."
}

action_cloud_run_start() {
  local project_id=$1 name=$2 region=$3
  echo -e "  ${GREEN}Enabling${NC} Cloud Run service ${BOLD}$name${NC}..."
  echo -e "  ${DIM}Setting ingress=all to allow external traffic${NC}"
  gcloud run services update "$name" \
    --project="$project_id" \
    --region="$region" \
    --ingress=all \
    --quiet 2>&1 | tail -1
  echo -e "  ${GREEN}Done.${NC} Service is now accepting external traffic."
}

action_cloud_sql_stop() {
  local project_id=$1 name=$2
  echo -e "  ${YELLOW}Stopping${NC} Cloud SQL instance ${BOLD}$name${NC}..."
  echo -e "  ${DIM}This may take a few minutes${NC}"
  gcloud sql instances patch "$name" \
    --project="$project_id" \
    --activation-policy=NEVER \
    --quiet 2>&1 | tail -1
  echo -e "  ${GREEN}Done.${NC} Database instance stopped."
}

action_cloud_sql_start() {
  local project_id=$1 name=$2
  echo -e "  ${GREEN}Starting${NC} Cloud SQL instance ${BOLD}$name${NC}..."
  echo -e "  ${DIM}This may take a few minutes${NC}"
  gcloud sql instances patch "$name" \
    --project="$project_id" \
    --activation-policy=ALWAYS \
    --quiet 2>&1 | tail -1
  echo -e "  ${GREEN}Done.${NC} Database instance started."
}

# ── Batch Operations ─────────────────────────────────────────────────────────
batch_stop_all() {
  echo ""
  echo -e "${BOLD}${RED}Stopping ALL services across all projects${NC}"
  print_separator
  for entry in "${ALL_SERVICES[@]}"; do
    IFS='|' read -r type pkey pid name region status detail url <<< "$entry"
    case "$type" in
      cloudrun)
        if [[ "$status" != "DISABLED" ]]; then
          action_cloud_run_stop "$pid" "$name" "$region"
        else
          echo -e "  ${DIM}Skip $name (already disabled)${NC}"
        fi
        ;;
      cloudsql)
        if [[ "$status" == "RUNNABLE" || "$status" == "RUNNING" ]]; then
          action_cloud_sql_stop "$pid" "$name"
        else
          echo -e "  ${DIM}Skip $name (already stopped)${NC}"
        fi
        ;;
    esac
  done
  echo ""
  echo -e "${GREEN}All services stopped.${NC}"
}

batch_start_all() {
  echo ""
  echo -e "${BOLD}${GREEN}Starting ALL services across all projects${NC}"
  print_separator

  # Start databases first, then apps
  for entry in "${ALL_SERVICES[@]}"; do
    IFS='|' read -r type pkey pid name region status detail url <<< "$entry"
    if [[ "$type" == "cloudsql" ]]; then
      if [[ "$status" != "RUNNABLE" && "$status" != "RUNNING" ]]; then
        action_cloud_sql_start "$pid" "$name"
      else
        echo -e "  ${DIM}Skip $name (already running)${NC}"
      fi
    fi
  done

  for entry in "${ALL_SERVICES[@]}"; do
    IFS='|' read -r type pkey pid name region status detail url <<< "$entry"
    if [[ "$type" == "cloudrun" ]]; then
      if [[ "$status" == "DISABLED" ]]; then
        action_cloud_run_start "$pid" "$name" "$region"
      else
        echo -e "  ${DIM}Skip $name (already serving)${NC}"
      fi
    fi
  done

  echo ""
  echo -e "${GREEN}All services started.${NC}"
}

batch_project() {
  local target_key=$1 action=$2
  echo ""
  echo -e "${BOLD}${action^} all services in [$target_key]${NC}"
  print_separator

  # For start: databases first. For stop: apps first.
  local order=("cloudsql" "cloudrun")
  if [[ "$action" == "stop" ]]; then
    order=("cloudrun" "cloudsql")
  fi

  for target_type in "${order[@]}"; do
    for entry in "${ALL_SERVICES[@]}"; do
      IFS='|' read -r type pkey pid name region status detail url <<< "$entry"
      [[ "$pkey" != "$target_key" || "$type" != "$target_type" ]] && continue

      case "$action" in
        stop)
          if [[ "$type" == "cloudrun" && "$status" != "DISABLED" ]]; then
            action_cloud_run_stop "$pid" "$name" "$region"
          elif [[ "$type" == "cloudsql" && ("$status" == "RUNNABLE" || "$status" == "RUNNING") ]]; then
            action_cloud_sql_stop "$pid" "$name"
          else
            echo -e "  ${DIM}Skip $name (already stopped/disabled)${NC}"
          fi
          ;;
        start)
          if [[ "$type" == "cloudrun" && "$status" == "DISABLED" ]]; then
            action_cloud_run_start "$pid" "$name" "$region"
          elif [[ "$type" == "cloudsql" && "$status" != "RUNNABLE" && "$status" != "RUNNING" ]]; then
            action_cloud_sql_start "$pid" "$name"
          else
            echo -e "  ${DIM}Skip $name (already running/serving)${NC}"
          fi
          ;;
      esac
    done
  done
}

# ── Interactive Menu ─────────────────────────────────────────────────────────
interactive_action() {
  local idx=$1
  local entry="${ALL_SERVICES[$((idx - 1))]}"
  IFS='|' read -r type pkey pid name region status detail url <<< "$entry"

  echo ""
  echo -e "${BOLD}Service: $name${NC}"
  echo -e "  Type:    $type"
  echo -e "  Project: $pkey ($pid)"
  echo -e "  Region:  $region"
  echo -e "  Status:  $(status_color "$status")"
  [[ -n "$url" ]] && echo -e "  URL:     ${DIM}$url${NC}"
  echo ""

  case "$type" in
    cloudrun)
      if [[ "$status" == "DISABLED" ]]; then
        read -rp "  Start this service? (y/n): " confirm
        [[ "$confirm" == "y" ]] && action_cloud_run_start "$pid" "$name" "$region"
      else
        read -rp "  Stop this service? (y/n): " confirm
        [[ "$confirm" == "y" ]] && action_cloud_run_stop "$pid" "$name" "$region"
      fi
      ;;
    cloudsql)
      if [[ "$status" == "RUNNABLE" || "$status" == "RUNNING" ]]; then
        read -rp "  Stop this database? (y/n): " confirm
        [[ "$confirm" == "y" ]] && action_cloud_sql_stop "$pid" "$name"
      else
        read -rp "  Start this database? (y/n): " confirm
        [[ "$confirm" == "y" ]] && action_cloud_sql_start "$pid" "$name"
      fi
      ;;
  esac
}

# ── Main ─────────────────────────────────────────────────────────────────────
main() {
  print_header
  collect_services

  if [[ ${#ALL_SERVICES[@]} -eq 0 ]]; then
    echo -e "${RED}No services found.${NC}"
    exit 1
  fi

  while true; do
    show_services

    echo -e " ${BOLD}Commands:${NC}"
    echo -e "   ${CYAN}<number>${NC}           Toggle a specific service"
    echo -e "   ${CYAN}stop-all${NC}          Stop everything"
    echo -e "   ${CYAN}start-all${NC}         Start everything"
    echo -e "   ${CYAN}stop <project>${NC}    Stop all services in a project  (yeshplan/recipe)"
    echo -e "   ${CYAN}start <project>${NC}   Start all services in a project (yeshplan/recipe)"
    echo -e "   ${CYAN}refresh${NC}           Re-scan all services"
    echo -e "   ${CYAN}q${NC}                 Quit"
    echo ""
    read -rp "  > " input

    case "$input" in
      q|quit|exit)
        echo -e "\n${DIM}Bye.${NC}"
        exit 0
        ;;
      refresh|r)
        ALL_SERVICES=()
        collect_services
        ;;
      stop-all)
        read -rp "  Stop ALL services? This will disable everything. (y/n): " confirm
        [[ "$confirm" == "y" ]] && batch_stop_all
        ALL_SERVICES=()
        collect_services
        ;;
      start-all)
        read -rp "  Start ALL services? (y/n): " confirm
        [[ "$confirm" == "y" ]] && batch_start_all
        ALL_SERVICES=()
        collect_services
        ;;
      stop\ *)
        local proj="${input#stop }"
        if [[ -n "${PROJECTS[$proj]+x}" ]]; then
          read -rp "  Stop all services in [$proj]? (y/n): " confirm
          [[ "$confirm" == "y" ]] && batch_project "$proj" "stop"
          ALL_SERVICES=()
          collect_services
        else
          echo -e "  ${RED}Unknown project: $proj${NC} (use: yeshplan or recipe)"
        fi
        ;;
      start\ *)
        local proj="${input#start }"
        if [[ -n "${PROJECTS[$proj]+x}" ]]; then
          read -rp "  Start all services in [$proj]? (y/n): " confirm
          [[ "$confirm" == "y" ]] && batch_project "$proj" "start"
          ALL_SERVICES=()
          collect_services
        else
          echo -e "  ${RED}Unknown project: $proj${NC} (use: yeshplan or recipe)"
        fi
        ;;
      [0-9]*)
        if [[ "$input" -ge 1 && "$input" -le ${#ALL_SERVICES[@]} ]] 2>/dev/null; then
          interactive_action "$input"
          ALL_SERVICES=()
          collect_services
        else
          echo -e "  ${RED}Invalid number. Pick 1-${#ALL_SERVICES[@]}${NC}"
        fi
        ;;
      *)
        echo -e "  ${RED}Unknown command.${NC}"
        ;;
    esac
  done
}

main "$@"
