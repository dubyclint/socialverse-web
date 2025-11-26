FROM node:22-alpine
LABEL "language"="nodejs"
LABEL "framework"="nuxt"

WORKDIR /src

# Install pnpm
RUN npm install -g pnpm@9

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies with production optimization
# Skip optional dependencies (TensorFlow) to reduce build time
RUN pnpm install --frozen-lockfile --no-optional

# Copy source code
COPY . .

# Build the Nuxt application
RUN pnpm run build

# Remove dev dependencies to reduce image size
RUN pnpm prune --prod

# Expose port 8080 (Zeabur default)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start the application
CMD ["pnpm", "run", "start"]
