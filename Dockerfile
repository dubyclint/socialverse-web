FROM node:22-slim
LABEL "language"="nodejs"
LABEL "framework"="nuxt.js"

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm@9

# Copy package files first
COPY package.json pnpm-lock.yaml* ./

# Install dependencies with proper ESM resolution
RUN pnpm install --frozen-lockfile --shamefully-hoist

# Copy all source files
COPY . .

# Build the application
RUN pnpm run build

EXPOSE 8080

# Start using Nuxt's standard output directory
CMD ["node", ".output/server/index.mjs"]
