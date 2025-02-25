FROM node:20 AS builder

WORKDIR /app

ARG REACT_APP_API_BASE_URL=http://localhost:3000

COPY package*.json /app/
COPY pnpm-lock.yaml /app/

RUN npm i -g pnpm && pnpm i --frozen-lockfile

COPY . /app/

RUN pnpm run build

FROM nginx AS runner

WORKDIR /usr/share/nginx/html

COPY --from=builder /app/out ./
