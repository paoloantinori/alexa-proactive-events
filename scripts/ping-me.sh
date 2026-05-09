#!/usr/bin/env bash
# Send a proactive notification to your Alexa device
# Usage: ./scripts/ping-me.sh [message] [count]
#   ./scripts/ping-me.sh                  → "Ping Me", 1 message
#   ./scripts/ping-me.sh "Paolo"          → "Paolo", 1 message
#   ./scripts/ping-me.sh "Kitchen" 3      → "Kitchen", 3 messages

set -euo pipefail

if [ -z "${LWA_CLIENT_ID:-}" ] || [ -z "${LWA_CLIENT_SECRET:-}" ]; then
  echo "ERROR: Set LWA_CLIENT_ID and LWA_CLIENT_SECRET first"
  echo "  export LWA_CLIENT_ID=\"your_client_id\""
  echo "  export LWA_CLIENT_SECRET=\"your_client_secret\""
  echo "  export ALEXA_USER_ID=\"your_user_id\""
  echo "  ./scripts/ping-me.sh [message] [count]"
  exit 1
fi

USER_ID="${ALEXA_USER_ID:?Set ALEXA_USER_ID to your Alexa user ID}"

MESSAGE="${1:-Ping Me}"
COUNT="${2:-1}"

node scripts/send-notification.js \
  --user "$USER_ID" \
  --count "$COUNT" \
  --message "$MESSAGE" \
  --region eu \
  --client-id "$LWA_CLIENT_ID" \
  --client-secret "$LWA_CLIENT_SECRET"
