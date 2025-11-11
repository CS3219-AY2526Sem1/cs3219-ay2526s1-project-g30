# Adapted from deploy-google-cloud-run template for NextJS apps

FROM node:lts-alpine AS base

# Stage 1: Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Accept build arguments for environment variables from Cloud Build
ARG SESSION_SECRET=build-secret
ARG NEXT_PUBLIC_USER_SERVICE_URL=http://localhost:3001/api/users
ARG NEXT_PUBLIC_MATCHING_SERVICE_URL=http://localhost:8080/api/v1
ARG NEXT_PUBLIC_QUESTION_SERVICE_URL=http://localhost:3002
ARG NEXT_PUBLIC_COLLAB_SERVICE_URL=http://localhost:8082
ARG NEXT_PUBLIC_COLLAB_SERVICE_WS_URL=wss://localhost:8082
RUN SESSION_SECRET=$SESSION_SECRET \
    NEXT_PUBLIC_USER_SERVICE_URL=$NEXT_PUBLIC_USER_SERVICE_URL \
    NEXT_PUBLIC_MATCHING_SERVICE_URL=$NEXT_PUBLIC_MATCHING_SERVICE_URL \
    NEXT_PUBLIC_QUESTION_SERVICE_URL=$NEXT_PUBLIC_QUESTION_SERVICE_URL \
    NEXT_PUBLIC_COLLAB_SERVICE_URL=$NEXT_PUBLIC_COLLAB_SERVICE_URL \
    NEXT_PUBLIC_COLLAB_SERVICE_WS_URL=$NEXT_PUBLIC_COLLAB_SERVICE_WS_URL \
    npm run build

# Stage 3: Production server
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]