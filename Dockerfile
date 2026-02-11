# syntax=docker/dockerfile:1

# Stage 1: Build
FROM node:20-bookworm-slim AS builder
WORKDIR /app

# Install dependencies needed for native modules and Prisma
RUN apt-get update && apt-get install -y openssl ca-certificates libssl-dev

# Copy configuration files
COPY package.json ./
COPY prisma ./prisma/

# Install dependencies
# Using npm install without lockfile to ensure fresh resolution for Linux
ENV PRISMA_SKIP_POSTINSTALL_GENERATE=1
RUN npm install

# Copy the rest of the application
COPY . .

# Generate Prisma client and build
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate
RUN npm run build

# Stage 2: Runner
FROM node:20-bookworm-slim AS runner
WORKDIR /app

# Install openssl for production
RUN apt-get update && apt-get install -y openssl

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/@prisma/engines ./node_modules/@prisma/engines
COPY --from=builder /app/prisma ./prisma

# Copy entrypoint script (runs migrations before starting)
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["./docker-entrypoint.sh"]
