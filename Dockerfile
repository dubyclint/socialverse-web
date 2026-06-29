# ============================================================================
# STAGE 1: BUILD ENVIRONMENT
# ============================================================================
FROM node:22-slim AS builder

LABEL "language"="nodejs"
LABEL "framework"="nuxt.js"

WORKDIR /src

# Copy package config safely
COPY package.json package-lock.json* ./

# Install ALL core dependencies, bypassing heavy uncompiled native bindings
RUN npm install --no-optional

# Copy source code assets
COPY . .

# Force Nuxt to build a traditional standalone server directory (.output)
ENV NITRO_PRESET=node-server
ENV NODE_ENV=production

# Run production build with memory allocation limits
RUN NODE_OPTIONS="--max-old-space-size=4096" npm run build

# ============================================================================
# STAGE 2: PRODUCTION RUNTIME BOUNDARY (No extra dependencies needed)
# ============================================================================
FROM node:22-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0

# Copy the complete, self-contained bundle compiled by Nitro
COPY --from=builder /src/.output ./.output

EXPOSE 8080

ENTRYPOINT ["node"]
CMD [".output/server/index.mjs"]
