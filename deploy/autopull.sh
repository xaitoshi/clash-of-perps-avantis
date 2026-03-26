#!/bin/bash
# Auto-deploy: polls git every 30s, runs update.sh on new commits
# Usage: sudo bash autopull.sh &
# Or install as systemd service (see below)

APP_DIR="/opt/clash"
DEPLOY_DIR="$APP_DIR/deploy"
BRANCH="main"
CHECK_INTERVAL=300  # 5 minutes

echo "=== Auto-deploy watcher started ==="
echo "Watching branch: $BRANCH every 5 min"

cd "$APP_DIR" || exit 1

while true; do
    # Fetch latest without merging
    git fetch origin "$BRANCH" -q 2>/dev/null

    LOCAL=$(git rev-parse "$BRANCH" 2>/dev/null)
    REMOTE=$(git rev-parse "origin/$BRANCH" 2>/dev/null)

    if [ "$LOCAL" != "$REMOTE" ]; then
        echo ""
        echo "[$(date '+%H:%M:%S')] New commits detected! Deploying..."
        echo "  Local:  $LOCAL"
        echo "  Remote: $REMOTE"
        bash "$DEPLOY_DIR/update.sh" 2>&1 | sed 's/^/  /'
        echo "[$(date '+%H:%M:%S')] Deploy complete."
    fi

    sleep "$CHECK_INTERVAL"
done
