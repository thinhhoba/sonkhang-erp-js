# syntax=docker/dockerfile:1
# Sonkhang ERP — production image (Next.js standalone, Node 20 Alpine)

# ---------- Stage 1: deps ----------
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
# package-lock.json tồn tại -> dùng npm ci để build reproducible
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

# ---------- Stage 2: builder ----------
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
ARG DATABASE_URL="postgresql://build_user:build_password@127.0.0.1:5432/sonkhang_build?schema=public"
ENV DATABASE_URL=$DATABASE_URL
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate
RUN npm run build

# ---------- Stage 3: runner ----------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
RUN apk add --no-cache openssl \
  && addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Prisma CLI + schema để chạy migrate lúc khởi động
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

USER nextjs
EXPOSE 3000

# Production fail-closed: không chạy app khi repository chưa có migration
# versioned. Tuyệt đối không thay thế bằng `prisma db push` trên production.
CMD ["sh", "-c", "test -f prisma/migrations/migration_lock.toml || { echo >&2 'FATAL: versioned Prisma migrations are required for production.'; exit 1; }; ./node_modules/.bin/prisma migrate deploy && exec node server.js"]
