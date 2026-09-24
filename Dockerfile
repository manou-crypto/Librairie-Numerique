# Multi-stage build for backend-nestjs from repository root
FROM node:20-alpine AS builder
WORKDIR /app

# Copy backend package files
COPY backend-nestjs/package*.json ./

# Install dependencies
RUN npm install

# Copy backend source code & prisma schema
COPY backend-nestjs/ ./

# Generate Prisma client and compile NestJS
RUN npx prisma generate && npm run build

# Production runner stage
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy built application and production dependencies
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/entrypoint.sh ./entrypoint.sh

RUN chmod +x ./entrypoint.sh

EXPOSE 3000

CMD ["sh", "./entrypoint.sh"]
