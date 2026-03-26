#!/bin/bash
# Quick update — pull latest code, rebuild frontend, restart backend
set -e

APP_DIR="/opt/clash"
DB_BACKUP="/opt/clash-db-backup"

echo "=== Quick Update ==="

# Backup database before pull
mkdir -p "$DB_BACKUP"
if [ -f "$APP_DIR/server/clash.db" ]; then
    cp "$APP_DIR/server/clash.db" "$DB_BACKUP/clash.db"
    cp "$APP_DIR/server/clash.db-wal" "$DB_BACKUP/clash.db-wal" 2>/dev/null || true
    cp "$APP_DIR/server/clash.db-shm" "$DB_BACKUP/clash.db-shm" 2>/dev/null || true
    echo "DB backed up to $DB_BACKUP"
fi

# Pull latest (discard local changes to tracked files)
cd "$APP_DIR"
git reset --hard HEAD
git pull origin main

# Restore database after pull
if [ -f "$DB_BACKUP/clash.db" ]; then
    cp "$DB_BACKUP/clash.db" "$APP_DIR/server/clash.db"
    cp "$DB_BACKUP/clash.db-wal" "$APP_DIR/server/clash.db-wal" 2>/dev/null || true
    cp "$DB_BACKUP/clash.db-shm" "$APP_DIR/server/clash.db-shm" 2>/dev/null || true
    echo "DB restored"
fi

# Rebuild frontend
echo "Building frontend..."
cd "$APP_DIR/web"
npm ci
npm run build

# Restart backend
echo "Restarting backend..."
cd "$APP_DIR/server"
npm ci --production
pm2 restart clash-api

echo "=== Update complete! ==="
