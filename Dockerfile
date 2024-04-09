FROM node:21-alpine AS base

# Install dependencies only when needed
FROM base AS deps

RUN apk upgrade -U \ 
  && apk add ca-certificates python3 make gcc g++ \
  && rm -rf /var/cache/*
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG MONGODB_URI
ARG NOTION_API_KEY
ARG NOTION_DB_UID
ARG NOTION_TOPICS_DB_UID

ENV MONGODB_URI ${MONGODB_URI}
ENV NOTION_API_KEY ${NOTION_API_KEY}
ENV NOTION_DB_UID ${NOTION_DB_UID}
ENV NOTION_TOPICS_DB_UID ${NOTION_TOPICS_DB_UID}

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner

RUN apk add --no-cache ffmpeg font-noto

WORKDIR /app

ENV NODE_ENV production
ENV PORT 5000


COPY --from=builder /app/public ./public
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/scrapper.js ./
COPY --from=builder /app/sendVideoDigest.js ./

RUN mkdir ./images
RUN mkdir ./videos

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=deps /app/node_modules ./node_modules

EXPOSE 5000

CMD ["node", "server.js"]