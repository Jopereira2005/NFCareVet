FROM node:22-slim

RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
COPY src/common/package.json ./src/common/
COPY src/backend/package.json ./src/backend/
COPY src/frontend/package.json ./src/frontend/
COPY src/frontend-teste/package.json ./src/frontend-teste/

RUN npm ci

COPY src/common ./src/common
COPY src/backend ./src/backend

RUN npm run build --workspace=@nfcarevet/common \
  && npm run prisma generate --workspace=backend \
  && npm run build --workspace=backend

WORKDIR /app/src/backend

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node -e \"const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); p.user.count().then(c => { p.\\$disconnect(); process.exit(c === 0 || process.env.FORCE_SEED === 'true' ? 0 : 1); })\" && npx prisma db seed || true; exec node dist/main"]
