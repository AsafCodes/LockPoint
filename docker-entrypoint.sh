#!/bin/bash
set -e

echo "🔧 LockPoint Alpha — Starting up..."

# Push schema to SQLite
npx prisma db push --skip-generate 2>/dev/null || true

echo "🔍 Checking database status..."

# שורה 10 החדשה - פשוטה יותר וחסינה לשגיאות
RAW_COUNT=$(echo "SELECT COUNT(*) FROM User;" | npx prisma db execute --stdin 2>/dev/null | grep -o '[0-9]*' | head -1)
USER_COUNT=${RAW_COUNT:-0}

if [ "$USER_COUNT" = "0" ]; then
    echo "🌱 First run detected — seeding database..."
    npx tsx prisma/seed.ts
    echo "✅ Database seeded!"
else
    echo "✅ Database already has $USER_COUNT users, skipping seed."
fi

echo "🚀 Starting LockPoint server on port $PORT..."
exec node server.js