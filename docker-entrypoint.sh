#!/bin/sh
set -e

# Přejdeme do složky /app (pro jistotu)
cd /app

echo "Running Prisma migrations..."
./node_modules/.bin/prisma migrate deploy

echo "Starting Next.js server..."
# Použijeme exec, aby aplikace správně přijímala signály (třeba pro vypnutí)
exec ./node_modules/.bin/next start