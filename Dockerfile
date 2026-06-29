# ============================================================================
# STAGE 1: BUILD ENVIRONMENT
# ============================================================================
FROM node:22-slim AS builder

LABEL "language"="nodejs"
LABEL "framework"="nuxt.js"

WORKDIR /src

# Copy package config safely
COPY package.json package-lock.json* ./

# Install ALL dependencies (including devDependencies like rolldown)
RUN npm ci || npm install

# Copy source code assets
COPY . .

# Force Nuxt to build a traditional standalone server directory (.output)
ENV NITRO_PRESET=node-server
ENV NODE_ENV=production

# Run production build with allocated memory limits if needed
RUN NODE_OPTIONS="--max-old-space-size=4096" npm run build

# ============================================================================
# STAGE 2: PRODUCTION RUNTIME BOUNDARY (No npm install required)
# ============================================================================
FROM node:22-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0

# ✅ Nuxt standalone (.output) contains its own bundled node_modules inside 
# .output/server/node_modules. We do NOT need to run npm install here!
COPY --from=builder /src/.output ./.output

EXPOSE 8080

ENTRYPOINT ["node"]
CMD [".output/server/index.mjs"]
