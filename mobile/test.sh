#!/bin/bash
# Kitchen48 Mobile App — Run for testing on physical device
# Usage: bash mobile/test.sh

MOBILE_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$MOBILE_DIR"

echo ""
echo "  Kitchen48 Mobile App"
echo "  ===================="
echo ""

# 1. Ensure ngrok auth token is configured
if ! grep -q "authtoken" ~/.config/ngrok/ngrok.yml 2>/dev/null; then
  echo "Setting up ngrok auth token..."
  npx ngrok config add-authtoken 3CDXMLfy49w5Ms2ftfti1oz4dLq_5WWYSucWRaStXXRWyBJXA
fi

# 2. Install dependencies if needed
if [ ! -d node_modules ]; then
  echo "Installing dependencies..."
  npm install
  echo ""
fi

# 3. Start Expo with tunnel
echo "Starting Expo with tunnel..."
echo ""
echo "  1. Open Expo Go on your phone"
echo "  2. Scan the QR code below"
echo ""

npx expo start --tunnel
