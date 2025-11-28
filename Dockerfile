FROM node:22-alpine
LABEL "language"="nodejs"
LABEL "framework"="nuxt"

WORKDIR /src

COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./

# ✅ Install with legacy peer deps
RUN npm install --legacy-peer-deps

COPY . .

# ✅ Clean cache before build
RUN npm cache clean --force

# ✅ Build with proper environment
RUN npm run build

# ✅ Verify build succeeded
RUN test -f .output/server/index.mjs || (echo "Build failed: .output/server/index.mjs not found" && exit 1)

# ✅ Remove dev dependencies
RUN npm prune --omit=dev

EXPOSE 8080

ENV PORT=8080
ENV HOST=0.0.0.0
ENV NODE_ENV=production

CMD ["node", ".output/server/index.mjs"]

