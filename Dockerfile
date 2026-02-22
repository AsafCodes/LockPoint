# ─────────────────────────────────────────────────────────────
# LockPoint Alpha — Production Dockerfile
# Multi-stage build for minimal image size
# ─────────────────────────────────────────────────────────────

# ── Stage 1: Install dependencies ────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
COPY prisma ./prisma/

RUN npm ci
RUN npx prisma generate

# ── Stage 2: Build the application ───────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client for the build
RUN npx prisma generate

# Build Next.js in standalone mode
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ── Stage 3: Production runner ───────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 1. קריטי ל-Alpine: התקנת Bash כדי שיוכל להריץ את ה-entrypoint
RUN apk add --no-cache bash

# הגדרת משתמש מערכת
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# העתקת קבצי ה-Standalone (Next.js)
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# יצירת תיקייה לבסיס הנתונים עם הרשאות נכונות
RUN mkdir -p /app/prisma && chown -R nextjs:nodejs /app/prisma

# 2. טיפול ב-Entrypoint (מבוצע כ-root לפני החלפת משתמש)
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN sed -i 's/\r$//' /usr/local/bin/docker-entrypoint.sh && \
    chmod +x /usr/local/bin/docker-entrypoint.sh && \
    chown nextjs:nodejs /usr/local/bin/docker-entrypoint.sh

# התקנת tsx גלובלית להרצת ה-seed
RUN npm install -g tsx

# מעבר למשתמש המאובטח
USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# הרצה דרך Bash באופן מפורש
ENTRYPOINT ["/bin/bash", "/usr/local/bin/docker-entrypoint.sh"]