#!/bin/bash
set -e

echo "🔧 LockPoint Alpha — Starting up..."

# סנכרון בסיס הנתונים - SQLite
npx prisma db push --skip-generate || echo "⚠️ Prisma push skipped or failed."

echo "🔍 Checking database status..."

# בדיקה חסינה למספר המשתמשים
USER_COUNT=$(npx prisma db execute --stdin <<EOF 2>/dev/null | grep -o '[0-9]*' | head -1
SELECT COUNT(*) FROM User;
EOF
)

# הגדרת ברירת מחדל אם המשתנה ריק
USER_COUNT=${USER_COUNT:-0}

if [ "$USER_COUNT" = "0" ]; then
    echo "🌱 First run detected — seeding database..."
    npx tsx prisma/seed.ts
    echo "✅ Database seeded!"
else
    echo "✅ Database already has $USER_COUNT users, skipping seed."
fi

echo "🚀 Starting LockPoint server on port $PORT..."
# הרצת השרת
exec node server.js