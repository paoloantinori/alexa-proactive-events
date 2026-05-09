#!/usr/bin/env bash
# Send a multicast proactive notification (to all subscribed users)
# Usage: ./scripts/ping-me-multicast.sh [message] [count]
#   ./scripts/ping-me-multicast.sh                  → "Ping Me", 1 message
#   ./scripts/ping-me-multicast.sh "Paolo"          → "Paolo", 1 message
#   ./scripts/ping-me-multicast.sh "Kitchen" 3      → "Kitchen", 3 messages

set -euo pipefail

if [ -z "${LWA_CLIENT_ID:-}" ] || [ -z "${LWA_CLIENT_SECRET:-}" ]; then
  echo "ERROR: Set LWA_CLIENT_ID and LWA_CLIENT_SECRET first"
  exit 1
fi

MESSAGE="${1:-Ping Me}"
COUNT="${2:-1}"

node scripts/send-notification.js \
  --multicast \
  --count "$COUNT" \
  --message "$MESSAGE" \
  --region eu \
  --client-id "$LWA_CLIENT_ID" \
  --client-secret "$LWA_CLIENT_SECRET"
