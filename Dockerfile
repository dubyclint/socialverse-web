FROM node:22-slim
LABEL "language"="nodejs"
LABEL "framework"="nuxt.js"

WORKDIR /app

RUN npm install -g pnpm@9

COPY . .

RUN pnpm install

RUN pnpm run build

EXPOSE 8080

CMD ["node", ".output/server/index.mjs"]
