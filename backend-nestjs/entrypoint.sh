#!/bin/sh

# Wait for MySQL to be ready
echo "Waiting for MySQL to be ready at mysql:3306..."
max_attempts=60
attempt=0

while [ $attempt -lt $max_attempts ]; do
  # Try connecting to MySQL using nc (netcat)
  if nc -z mysql 3306 2>/dev/null; then
    echo "MySQL port 3306 is open!"
    
    # Wait a bit more for MySQL to be fully ready
    sleep 2
    break
  fi
  attempt=$((attempt + 1))
  echo "Attempt $attempt/$max_attempts - waiting for MySQL..."
  sleep 1
done

if [ $attempt -eq $max_attempts ]; then
  echo "MySQL did not become ready in time"
  exit 1
fi

# Run migrations
echo "Running Prisma migrations..."
if ! npx prisma migrate deploy; then
  echo "Migration failed, but continuing..."
fi

# Start the application
echo "Starting NestJS application..."
node dist/main.js 2>&1
