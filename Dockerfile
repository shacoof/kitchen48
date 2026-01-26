# Kitchen48 Combined Dockerfile
# Single container with nginx (frontend) + Node.js (backend)
# Architecture: BFF (Backend-for-Frontend)

# ============================================
# Stage 1: Build Frontend
# ============================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Install dependencies
COPY frontend/package*.json ./
RUN npm install

# Build frontend
COPY frontend/ ./
RUN npm run build

# ============================================
# Stage 2: Build Backend
# ============================================
FROM node:20-alpine AS backend-builder

WORKDIR /app/backend

# Install dependencies
COPY backend/package*.json ./
RUN npm install

# Copy Prisma schema and generate client
COPY backend/prisma ./prisma
RUN npx prisma generate

# Build backend
COPY backend/tsconfig.json ./
COPY backend/src ./src
RUN npx tsc

# Remove dev dependencies
RUN npm prune --production

# ============================================
# Stage 3: Production Image
# ============================================
FROM node:20-alpine AS production

# Install nginx and supervisor
RUN apk add --no-cache nginx supervisor

WORKDIR /app

# Copy backend
COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules
COPY --from=backend-builder /app/backend/prisma ./backend/prisma
COPY --from=backend-builder /app/backend/package.json ./backend/

# Copy frontend build to nginx html directory
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/http.d/default.conf

# Copy supervisor config
COPY supervisord.conf /etc/supervisord.conf

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose port 8080 (Cloud Run default)
EXPOSE 8080

# Start supervisor (manages both nginx and node)
CMD ["supervisord", "-c", "/etc/supervisord.conf"]
