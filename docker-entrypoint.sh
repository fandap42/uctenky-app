#!/bin/sh
set -e

echo "Running Prisma migrations..."
# Voláme přímo binárku, npx by ji nemuselo najít
./node_modules/.bin/prisma migrate deploy

echo "Starting Next.js server..."
exec node server.js