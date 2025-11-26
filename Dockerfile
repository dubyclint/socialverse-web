FROM node:22-alpine
LABEL "language"="nodejs"
LABEL "framework"="nuxt"

WORKDIR /src

COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./

RUN npm install

COPY . .

RUN npm run build

RUN test -f .output/server/index.mjs || (echo "Build failed: .output/server/index.mjs not found" && exit 1)

RUN npm prune --omit=dev

EXPOSE 8080

CMD ["node", ".output/server/index.mjs"]
