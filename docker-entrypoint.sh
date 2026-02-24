#!/bin/bash
set -e

echo "🔧 LockPoint v0.4.0 — Starting up..."

# Apply database migrations (PostgreSQL)
npx prisma migrate deploy || echo "⚠️ Prisma migrate deploy skipped or failed."

echo "🔍 Checking database status..."

# To safely check if users exist, we use a simple Node script
# This is much more reliable across different Docker environments
# than parsing stdout from `prisma db execute` which may include warnings/logs.
# The check-db.js script is copied directly into /usr/local/bin by the Dockerfile
# with the correct permissions. We just need to run it.

# 2. הרצת הקובץ בעזרת Node ושמירת התוצאה למשתנה
# זה פותר את בעיית ה-Permission Denied כי אנחנו מפעילים את Node ישירות
# check-db.js is in /usr/local/bin and already executable
USER_COUNT=$(node /usr/local/bin/check-db.js 2>/dev/null || echo "0")

if [ "$USER_COUNT" = "0" ]; then
    echo "🌱 First run detected — seeding database..."
    npx tsx prisma/seed.ts
    echo "✅ Database seeded!"
else
    echo "✅ Database already has $USER_COUNT users, skipping seed."
fi

echo "🚀 Starting LockPoint server on port $PORT..."
# Start the server
exec node server.js