#!/bin/bash
set -e

echo "🔧 LockPoint Alpha — Starting up..."

# Push the Prisma schema to SQLite (creates DB if it doesn't exist)
npx prisma db push --skip-generate 2>/dev/null 2>&1 || true

# Check if the database is empty (no users = first run)
USER_COUNT=$(echo "SELECT COUNT(*) as c FROM User;" | npx prisma db execute --stdin 2>/dev/null | grep -o '[0-9]*' | head -1 || echo "0")

if [ "$USER_COUNT" = "0" ] || [ -z "$USER_COUNT" ]; then
    echo "🌱 First run detected — seeding database..."
    npx tsx prisma/seed.ts
    echo "✅ Database seeded!"
else
    echo "✅ Database already has $USER_COUNT users, skipping seed."
fi

echo "🚀 Starting LockPoint server on port $PORT..."
exec node server.js
