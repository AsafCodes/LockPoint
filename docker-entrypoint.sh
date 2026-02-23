#!/bin/bash
set -e

echo "🔧 LockPoint v0.4.0 — Starting up..."

# Apply database migrations (PostgreSQL)
npx prisma migrate deploy || echo "⚠️ Prisma migrate deploy skipped or failed."

echo "🔍 Checking database status..."

# To safely check if users exist, we use a simple Node script
# This is much more reliable across different Docker environments
# than parsing stdout from `prisma db execute` which may include warnings/logs.
cat << 'EOF' > check-db.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  try {
    const count = await prisma.user.count();
    console.log(`USER_COUNT=${count}`);
  } catch (e) {
    console.log('USER_COUNT=0');
  } finally {
    await prisma.$disconnect();
  }
}
main();
EOF

# Run the script and capture the line containing USER_COUNT
USER_COUNT_OUTPUT=$(node check-db.js | grep 'USER_COUNT')
USER_COUNT=$(echo "$USER_COUNT_OUTPUT" | cut -d'=' -f2)

# Default to 0 if empty
USER_COUNT=${USER_COUNT:-0}

rm check-db.js

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