#!/bin/sh

# If running in local docker-compose where 'mysql' host is resolved, wait for it
if getent hosts mysql > /dev/null 2>&1; then
  echo "Waiting for local MySQL at mysql:3306..."
  max_attempts=30
  attempt=0
  while [ $attempt -lt $max_attempts ]; do
    if nc -z mysql 3306 2>/dev/null; then
      echo "MySQL port 3306 is open!"
      sleep 2
      break
    fi
    attempt=$((attempt + 1))
    sleep 1
  done
fi

# Run migrations
echo "Running Prisma migrations..."
if ! npx prisma migrate deploy; then
  echo "Prisma migrate deploy warning, attempting schema sync..."
fi

# Ensure schema tables & columns are fully synchronized
echo "Ensuring Prisma schema is synchronized with database..."
npx prisma db push --skip-generate --accept-data-loss || true

# Start the application
echo "Starting NestJS application..."
exec node dist/main.js
