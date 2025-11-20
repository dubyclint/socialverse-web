# ============================================================================
# FILE: /Dockerfile
# ============================================================================
# Production-optimized multi-stage build for Zeabur deployment
# ============================================================================

# Stage 1: Builder
FROM node:22-alpine AS builder

LABEL maintainer="SocialVerse Team"
LABEL description="SocialVerse Web - Production Build"

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./
COPY .npmrc ./

# Install dependencies with npm install (more flexible than npm ci)
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# ============================================================================
# Stage 2: Runtime
FROM node:22-alpine

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache dumb-init curl

# Copy built application from builder
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.npmrc ./

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nuxt -u 1001 && \
    chown -R nuxt:nodejs /app

USER nuxt

# ============================================================================
# Environment Configuration
# ============================================================================

ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0

# ============================================================================
# Health Check
# ============================================================================

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/ || exit 1

# ============================================================================
# Expose Port
# ============================================================================

EXPOSE 8080

# ============================================================================
# Start Application
# ============================================================================

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", ".output/server/index.mjs"]
