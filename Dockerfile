# Multi-stage Dockerfile for Next.js (App Router) with pnpm

# ---- Build stage ----
FROM node:20-alpine AS builder

# Accept Supabase build args so build-time pages that reference env vars succeed
ARG SUPABASE_URL
ARG SUPABASE_ANON_KEY
ENV SUPABASE_URL=${SUPABASE_URL}
ENV SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}

# Install build deps
RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /app

# Copy package manager files
COPY package.json pnpm-lock.yaml* ./
COPY .npmrc ./

# Install pnpm and project deps
RUN corepack enable && corepack prepare pnpm@latest --activate
# Prefetch production dependencies (remove invalid `--all` flag)
RUN pnpm fetch --prod

# Copy project files
COPY . .

# Install dependencies (uses local cache from pnpm fetch)
RUN pnpm install --frozen-lockfile --prefer-offline

# Build the Next.js app
RUN pnpm build


# ---- Production stage ----
FROM node:20-alpine AS runner

WORKDIR /app

# Re-declare build args and set runtime env so the runtime image also has the variables
ARG SUPABASE_URL
ARG SUPABASE_ANON_KEY
ENV SUPABASE_URL=${SUPABASE_URL}
ENV SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}

# Fetch only runtime deps
ENV NODE_ENV=production

# Install pnpm runtime so the `pnpm start` command is available
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy Node modules and build output from builder
COPY --from=builder /app/.next .next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/node_modules ./node_modules

# If you have a custom start script, use it. Otherwise use next start
EXPOSE 3000
ENTRYPOINT []
# Run Next.js start using the installed local binary to avoid requiring pnpm at runtime
CMD ["node", "./node_modules/next/dist/bin/next", "start"]
