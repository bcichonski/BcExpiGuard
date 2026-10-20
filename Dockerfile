# syntax=docker/dockerfile:1

# ---- Build stage: compile the React UI ----
FROM node:24-alpine AS build
WORKDIR /app/react-ui

# Optional overrides of react-ui/.env.production (unset args fall back to the file)
ARG VITE_COUCH_URL
ARG VITE_AUTH0_DOMAIN
ARG VITE_AUTH0_CLIENT_ID
ARG VITE_AUTH0_AUDIENCE

COPY react-ui/package.json react-ui/package-lock.json ./
RUN npm ci
COPY react-ui/ ./
RUN npm run build

# ---- Runtime stage: server + static build only ----
FROM node:24-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

COPY --chmod=a+rX package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --chmod=a+rX server/ ./server/
COPY --chmod=a+rX --from=build /app/react-ui/build ./react-ui/build
COPY --chmod=a+rX react-ui/.env.production ./react-ui/.env.production

USER node
EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 5000) + '/healthz').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "server"]
