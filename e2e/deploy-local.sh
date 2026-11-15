#!/usr/bin/env bash
# Rebuild the front and hot-swap it into the running local nginx container (dev convenience).
set -euo pipefail
cd "$(dirname "$0")/../frontend"
VITE_SITE_URL=${VITE_SITE_URL:-http://localhost:8765} npm run build >/dev/null
docker cp build/client/. epic-road-trip-planner-web-1:/usr/share/nginx/html/
echo "front deployed"
