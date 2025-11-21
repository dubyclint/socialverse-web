FROM node:22-slim
LABEL "language"="nodejs"
LABEL "framework"="nuxt.js"

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm@9

# Copy all files including pnpm-lock.yaml
COPY . .

# Install dependencies with frozen lockfile for reproducible builds
# This ensures exact versions are installed, preventing module resolution issues
RUN pnpm install --frozen-lockfile

# Build the application
RUN pnpm run build

EXPOSE 8080

# Start using Nuxt's standard output directory
CMD ["node", ".output/server/index.mjs"]
