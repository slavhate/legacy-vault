# ── Stage 1: install dependencies ──
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
# Install prod deps only; better-sqlite3 needs native build tools
RUN apk add --no-cache python3 make g++ && \
    npm install --omit=dev && \
    apk del python3 make g++

# ── Stage 2: final minimal image ──
FROM node:22-alpine AS final

LABEL org.opencontainers.image.title="Legacy Vault"
LABEL org.opencontainers.image.description="Self-hosted, encrypted personal data vault for estate planning"
LABEL org.opencontainers.image.version="1.0.0"
LABEL org.opencontainers.image.authors="slavhate"
LABEL org.opencontainers.image.url="https://github.com/slavhate/legacy-vault"
LABEL org.opencontainers.image.source="https://github.com/slavhate/legacy-vault"
LABEL org.opencontainers.image.licenses="MIT"

WORKDIR /app

# Copy only prod node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy only the files needed to run the app
COPY package.json ./
COPY server/ ./server/
COPY public/ ./public/

RUN mkdir -p /app/data /app/backups

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:${PORT:-3000}/health || exit 1

CMD ["node", "server/index.js"]
