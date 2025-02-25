FROM node:20 AS builder

WORKDIR /app

ARG REACT_APP_API_BASE_URL=http://localhost:3000

COPY package*.json /app/
COPY pnpm-lock.yaml /app/

RUN npm i -g pnpm && pnpm i --frozen-lockfile

COPY . /app/

RUN pnpm run build

FROM node:20 AS runner

WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

RUN mkdir .next

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static


EXPOSE 3000
CMD ["npm", "run", "prod"]
