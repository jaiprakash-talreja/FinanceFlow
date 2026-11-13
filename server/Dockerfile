# ---- FinanceFlow API ----
FROM node:22-alpine

ENV NODE_ENV=production
WORKDIR /app

# Install only production dependencies (cached layer)
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY src ./src

# Run as the unprivileged "node" user
USER node
EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/health || exit 1

CMD ["node", "src/server.js"]
