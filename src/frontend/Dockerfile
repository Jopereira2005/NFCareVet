FROM node:22-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY src/common/package.json ./src/common/
COPY src/backend/package.json ./src/backend/
COPY src/frontend/package.json ./src/frontend/
COPY src/frontend-teste/package.json ./src/frontend-teste/

RUN npm ci

COPY src/common ./src/common
COPY src/frontend ./src/frontend

ARG VITE_USE_MOCKS=false
ARG VITE_API_URL=
ENV VITE_USE_MOCKS=$VITE_USE_MOCKS
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build --workspace=@nfcarevet/common \
  && npm run build --workspace=frontend

FROM nginx:1.27-alpine

COPY src/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/src/frontend/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
