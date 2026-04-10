FROM node:22-alpine

LABEL org.opencontainers.image.title="Legacy Vault"
LABEL org.opencontainers.image.description="Self-hosted, encrypted personal data vault for estate planning"
LABEL org.opencontainers.image.version="1.0.0"
LABEL org.opencontainers.image.authors="slavhate"
LABEL org.opencontainers.image.url="https://github.com/slavhate/legacy-vault"
LABEL org.opencontainers.image.source="https://github.com/slavhate/legacy-vault"
LABEL org.opencontainers.image.licenses="MIT"

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

RUN mkdir -p /app/data /app/backups

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:${PORT:-3000}/health || exit 1

CMD ["node", "server/index.js"]
