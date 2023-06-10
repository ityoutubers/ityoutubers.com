FROM node:19-alpine

RUN apk upgrade -U \ 
    && apk add ca-certificates ffmpeg font-noto \
    && rm -rf /var/cache/*

# Install dependencies only when needed
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

ARG MONGODB_URI
ARG NOTION_API_KEY
ARG NOTION_DB_UID
ARG NOTION_TOPICS_DB_UID

ENV MONGODB_URI ${MONGODB_URI}
ENV NOTION_API_KEY ${NOTION_API_KEY}
ENV NOTION_DB_UID ${NOTION_DB_UID}
ENV NOTION_TOPICS_DB_UID ${NOTION_TOPICS_DB_UID}

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Rebuild the source code only when needed
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
# ENV NEXT_TELEMETRY_DISABLED 1

# If using npm comment out above and use below instead
RUN npm run build

RUN mkdir ./images
RUN mkdir ./videos

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

RUN mkdir ./server-root
COPY /public ./server-root/public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY /app/.next/standalone ./server-root
COPY /app/.next/static ./server-root/.next/static

CMD ["node", "./server-root/.next/standalone/server.js"]