#!/bin/bash

echo "🔁 Rolling back socialverse-web backend..."

# Navigate to project directory
cd /var/www/socialverse-web || exit

# Fetch latest commits
git fetch origin

# Reset to previous commit
echo "⏪ Reverting to previous commit..."
git reset --hard HEAD~1

# Reinstall dependencies
echo "📦 Reinstalling dependencies..."
pnpm install

# Re-run migrations (optional: comment out if not needed)
echo "🧨 Re-running SQLite migrations..."
ts-node server/db/migrate.ts

# Restart GunDB peer
echo "🔄 Restarting GunDB peer..."
pm2 restart gundb-peer

# Restart backend API
echo "🚀 Restarting backend API..."
pm2 restart socialverse-api

echo "✅ Rollback complete."
