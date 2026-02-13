# Runtime-only image — run `pnpm build` locally or in CI before `docker build`
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy pre-built standalone output (from local `pnpm build`)
COPY --chown=nextjs:nodejs public ./public
COPY --chown=nextjs:nodejs .next/standalone ./
COPY --chown=nextjs:nodejs .next/static ./.next/static

# Copy drizzle migration files and dependencies (for init container)
COPY --chown=nextjs:nodejs drizzle ./drizzle
COPY --chown=nextjs:nodejs node_modules/drizzle-orm ./node_modules/drizzle-orm
COPY --chown=nextjs:nodejs node_modules/postgres ./node_modules/postgres
COPY --chown=nextjs:nodejs node_modules/dotenv ./node_modules/dotenv

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]