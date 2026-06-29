#!/bin/sh
set -e

echo "Running database migrations..."
cd /app && npx drizzle-kit push --force

echo "Starting services..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/growthpilot.conf
