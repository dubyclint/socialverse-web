FROM node:22-alpine
LABEL "language"="nodejs"
LABEL "framework"="nuxt"

# Cache buster - change this to force rebuild
ARG BUILD_ID=v.1.1-non-minified
ENV BUILD_ID=$BUILD_ID
ENV FORCE_REBUILD=2025-01-09

WORKDIR /src

# ✅ Install build dependencies for native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    gcc \
    libc-dev \
    pkgconfig \
    pixman-dev \
    cairo-dev \
    pango-dev \
    libjpeg-turbo-dev \
    giflib-dev

COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./

# ✅ Install with legacy peer deps
RUN npm install --legacy-peer-deps

COPY . .

# ✅ Clean everything before build
RUN npm cache clean --force && \
    rm -rf .nuxt .output .nitro node_modules/.cache dist

# ✅ Build with non-minified configuration for better error messages
# Set BUILD_MODE=dev to disable minification and enable source maps
RUN BUILD_MODE=dev npm run build:dev

# ✅ Verify build succeeded
RUN test -f .output/server/index.mjs || (echo "Build failed: .output/server/index.mjs not found" && exit 1)

# ✅ Remove dev dependencies and build tools to reduce image size
RUN npm prune --omit=dev && \
    apk del python3 make g++ gcc libc-dev pkgconfig

EXPOSE 8080

ENV PORT=8080
ENV HOST=0.0.0.0
ENV NODE_ENV=production

CMD ["node", ".output/server/index.mjs"]
