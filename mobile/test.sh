#!/bin/bash
# Kitchen48 Mobile App — Run for testing on physical device
# Usage: bash mobile/test.sh
#
# Requires Expo Go app installed on your phone.
# Uses ngrok tunnel (WSL2 can't expose ports to LAN directly).

MOBILE_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$MOBILE_DIR"

echo ""
echo "  Kitchen48 Mobile App"
echo "  ===================="
echo ""

# Set ngrok auth token
export NGROK_AUTHTOKEN="3CDXMLfy49w5Ms2ftfti1oz4dLq_5WWYSucWRaStXXRWyBJXA"

# Install dependencies if needed
if [ ! -d node_modules ]; then
  echo "Installing dependencies..."
  npm install --legacy-peer-deps
  echo ""
fi

echo "Starting Expo with tunnel..."
echo ""
echo "  1. Open Expo Go on your phone"
echo "  2. Scan the QR code below"
echo ""

npx expo start --tunnel
