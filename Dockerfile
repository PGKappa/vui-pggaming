FROM node:20 AS builder

WORKDIR /app

ARG NEXT_PUBLIC_BASE_API_URL=https://pg-gaming.stg.startegois.com/proxy

COPY package*.json /app/
COPY pnpm-lock.yaml /app/

RUN npm i -g pnpm && pnpm i --frozen-lockfile

COPY . /app/

RUN pnpm run build

FROM nginx AS runner

WORKDIR /usr/share/nginx/html

COPY --from=builder /app/out ./
