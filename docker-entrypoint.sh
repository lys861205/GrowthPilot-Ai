#!/bin/sh
set -e

echo "[1/5] Starting PostgreSQL..."
su -s /bin/sh postgres -c "/usr/lib/postgresql/15/bin/postgres -D /var/lib/postgresql/data" &

echo "[2/5] Waiting for PostgreSQL to be ready..."
until pg_isready -U postgres -h 127.0.0.1 -q; do
  sleep 1
done

echo "[3/5] Creating database if not exists..."
psql -U postgres -h 127.0.0.1 -tc "SELECT 1 FROM pg_database WHERE datname='growthpilot'" \
  | grep -q 1 || psql -U postgres -h 127.0.0.1 -c "CREATE DATABASE growthpilot"

echo "[4/5] Running database migrations..."
cd /app && npx drizzle-kit migrate

echo "[5/5] Starting Redis..."
redis-server --daemonize yes --appendonly yes

echo "All services initialized. Starting supervisord..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/growthpilot.conf
