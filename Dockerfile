# =============================================================================
# RestoFlow ERP — Multi-Stage Production Dockerfile
# Stage 1: Build frontend (Vite)
# Stage 2: Build backend (TypeScript → JS)
# Stage 3: Lean production image
# =============================================================================

# ---- Stage 1: Frontend Build ----
FROM node:20-alpine AS frontend-build
WORKDIR /app

# Copy package files first for layer caching
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# Copy source needed for frontend build
COPY index.html index.css index.tsx ./
COPY App.tsx routes.tsx types.ts vite-env.d.ts vite.config.ts tsconfig.json ./
COPY components/ ./components/
COPY hooks/ ./hooks/
COPY stores/ ./stores/
COPY services/ ./services/
COPY src/ ./src/
COPY public/ ./public/

# Build frontend
RUN npm run build

# ---- Stage 2: Backend Build ----
FROM node:20-alpine AS backend-build
WORKDIR /app

COPY package.json package-lock.json tsconfig.json ./
RUN npm ci --ignore-scripts

# Copy server + shared source
COPY server/ ./server/
COPY src/db/ ./src/db/
COPY types.ts ./
COPY drizzle.config.ts ./
COPY drizzle/ ./drizzle/

# ---- Stage 3: Production Image ----
FROM node:20-alpine AS production
LABEL maintainer="RestoFlow ERP <devops@restoflow.io>"
LABEL description="RestoFlow ERP — Enterprise Restaurant Management Platform"

WORKDIR /app

# Security: run as non-root user
RUN addgroup -g 1001 -S restoflow && \
    adduser -S restoflow -u 1001 -G restoflow

# Install production deps only
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && \
    npm cache clean --force

# Copy built frontend
COPY --from=frontend-build /app/dist ./dist

# Copy backend source (runs via tsx in prod or compiled)
COPY server/ ./server/
COPY src/db/ ./src/db/
COPY types.ts ./
COPY drizzle.config.ts ./
COPY drizzle/ ./drizzle/

# Create directories for runtime artifacts
RUN mkdir -p /app/artifacts /app/logs && \
    chown -R restoflow:restoflow /app

# Switch to non-root user
USER restoflow

# Environment defaults
ENV NODE_ENV=production
ENV API_PORT=3001

# Expose backend port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:3001/api/health || exit 1

# Start backend server (serves API + static frontend via express)
CMD ["node", "--import", "tsx", "server/index.ts"]
