#!/bin/bash
set -e

echo "🔧 LockPoint v0.4.0 — Starting up..."

# Apply database migrations (PostgreSQL)
npx prisma migrate deploy || echo "⚠️ Prisma migrate deploy skipped or failed."

echo "🔍 Checking database status..."

# Check user count (PostgreSQL compatible)
USER_COUNT=$(npx prisma db execute --stdin <<EOF 2>/dev/null | grep -o '[0-9]*' | head -1
SELECT COUNT(*) FROM "User";
EOF
)

# Default to 0 if empty
USER_COUNT=${USER_COUNT:-0}

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