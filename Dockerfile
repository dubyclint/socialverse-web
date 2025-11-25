FROM node:22-slim
LABEL "language"="nodejs"
LABEL "framework"="nuxt"

WORKDIR /src

COPY . .

RUN npm install -g pnpm && pnpm install --no-frozen-lockfile

RUN pnpm run build

EXPOSE 8080

CMD ["node", ".zeabur/output/functions/__nitro.func/index.mjs"]

