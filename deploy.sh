#!/usr/bin/env bash
set -euo pipefail

echo "=== Ping Me - Alexa Proactive Events Skill Deployment ==="
echo ""

# Check prerequisites
command -v ask >/dev/null 2>&1 || { echo "ERROR: ask-cli not installed. Run: npm install -g ask-cli"; exit 1; }
command -v node >/dev/null 2>&1 || { echo "ERROR: node not installed."; exit 1; }

# Install Lambda dependencies
echo "Installing Lambda dependencies..."
(cd lambda/custom && npm install --production)

echo ""
echo "Deploying skill with ask-cli..."
ask deploy

echo ""
echo "==========================================="
echo "Deployment complete!"
echo ""
echo "Next steps:"
echo "  1. Go to developer.amazon.com/alexa"
echo "  2. Find your skill -> Test tab -> Enable 'Development' testing"
echo "  3. Say 'Alexa, open ping me' on your device"
echo "  4. Find your userId in the Skill I/O JSON Input panel"
echo "  5. Copy Client ID and Client Secret from Build tab -> Permissions"
echo "  6. In the Alexa app: Dev Skills -> Ping Me -> Settings -> Manage Permissions -> Enable notifications"
echo "  7. Send a notification:"
echo "     LWA_CLIENT_ID=xxx LWA_CLIENT_SECRET=yyy node scripts/send-notification.js --user <USER_ID>"
echo "==========================================="
