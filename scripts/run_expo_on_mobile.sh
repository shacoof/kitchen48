#!/bin/bash
# Start the Kitchen48 Expo mobile app for testing via Expo Go on LAN.
# Usage: run_expo_on_mobile.sh [--tunnel] [--clear]
#
# WSL2 note: Metro binds to the WSL2 virtual IP, which your phone cannot
# reach. We detect the Windows Wi-Fi IPv4 via PowerShell and advertise it
# via REACT_NATIVE_PACKAGER_HOSTNAME. Port 8081 must be forwarded from
# Windows to WSL2 (one-time admin PowerShell setup — see scripts/README.md).
# Override auto-detection with: EXPO_LAN_IP=1.2.3.4 run_expo_on_mobile.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MOBILE_DIR="$(cd "$SCRIPT_DIR/../mobile" && pwd)"

cd "$MOBILE_DIR"

if [ ! -d node_modules ]; then
  echo "Installing dependencies in $MOBILE_DIR..."
  npm install
fi

if [ -z "$REACT_NATIVE_PACKAGER_HOSTNAME" ]; then
  if [ -n "$EXPO_LAN_IP" ]; then
    REACT_NATIVE_PACKAGER_HOSTNAME="$EXPO_LAN_IP"
  elif grep -qi microsoft /proc/version 2>/dev/null; then
    DETECTED_IP=$(powershell.exe -NoProfile -Command \
      "(Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias 'Wi-Fi' | Where-Object { \$_.IPAddress -notmatch '^169\\.' } | Select-Object -First 1).IPAddress" \
      2>/dev/null | tr -d '\r\n ')
    if [ -n "$DETECTED_IP" ]; then
      REACT_NATIVE_PACKAGER_HOSTNAME="$DETECTED_IP"
    fi
  fi
  export REACT_NATIVE_PACKAGER_HOSTNAME
fi

echo "Starting Expo dev server in $MOBILE_DIR"
if [ -n "$REACT_NATIVE_PACKAGER_HOSTNAME" ]; then
  echo "Advertising host: $REACT_NATIVE_PACKAGER_HOSTNAME (WSL2 LAN bridge)"
fi
echo "Scan the QR code with Expo Go on your phone."
echo ""

exec npx expo start "$@"
