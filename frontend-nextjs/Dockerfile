# --- Stage 1: Dependencies installation ---
FROM node:20-alpine AS deps
WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev && \
    npm cache clean --force

# --- Stage 2: Build dependencies (with devDependencies) ---
FROM node:20-alpine AS build-deps
WORKDIR /app

COPY package*.json ./

RUN npm ci && \
    npm cache clean --force

# --- Stage 3: Builder ---
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=build-deps /app/node_modules ./node_modules
COPY . .

# Build args for NEXT_PUBLIC_* variables (inlined at build time)
ARG NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
ARG NEXT_PUBLIC_CLOUDINARY_API_KEY

ENV NEXT_PUBLIC_API_URL=""
ENV NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=${NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}
ENV NEXT_PUBLIC_CLOUDINARY_API_KEY=${NEXT_PUBLIC_CLOUDINARY_API_KEY}
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build && \
    npm prune --production && \
    npm cache clean --force

# --- Stage 4: Production runner ---
FROM node:20-alpine AS runner
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

# Copy public files
COPY --from=builder /app/public ./public

# Copy Next.js build output
COPY --from=builder /app/.next ./.next

# Copy production dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy package files
COPY --from=builder /app/package.json ./

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=15s --start-period=60s --retries=5 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode >= 500) throw new Error(r.statusCode)})" || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

CMD ["npm", "run", "serve"]
