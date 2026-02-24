#!/bin/bash
set -e

echo "🔧 LockPoint v0.4.0 — Starting up..."

# Apply database migrations (PostgreSQL)
npx prisma migrate deploy || echo "⚠️ Prisma migrate deploy skipped or failed."

echo "🔍 Checking database status..."

# To safely check if users exist, we use a simple Node script
# This is much more reliable across different Docker environments
# than parsing stdout from `prisma db execute` which may include warnings/logs.
# 1. יצירת קובץ הבדיקה (check-db.js)
cat << 'EOF' > check-db.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  try {
    const count = await prisma.user.count();
    // מדפיסים רק את המספר כדי שה-Bash יוכל לקרוא אותו בקלות
    process.stdout.write(count.toString());
  } catch (e) {
    process.stdout.write('0');
  } finally {
    await prisma.$disconnect();
  }
}
main();
EOF

# 2. הרצת הקובץ בעזרת Node ושמירת התוצאה למשתנה
# זה פותר את בעיית ה-Permission Denied כי אנחנו מפעילים את Node ישירות
USER_COUNT=$(node check-db.js 2>/dev/null || echo "0")

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