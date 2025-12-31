# SupChaissac v2.0 - Dockerfile Production
# Hebergement: Scaleway Serverless Containers (France - RGPD)

# ============================================
# Stage 1: Build Frontend
# ============================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copier package files
COPY package*.json ./

# Installer les dependances
RUN npm ci

# Copier le code source
COPY . .

# Build du frontend Vite
RUN npm run build

# ============================================
# Stage 2: Production
# ============================================
FROM node:20-alpine AS production

WORKDIR /app

# Copier package files pour production
COPY package*.json ./

# Installer uniquement les dependances de production
RUN npm ci --omit=dev

# Copier le backend
COPY server ./server
COPY drizzle.config.ts ./
COPY src/lib ./src/lib

# Copier le frontend build depuis le stage precedent
COPY --from=frontend-builder /app/dist ./dist

# Variables d'environnement par defaut
ENV NODE_ENV=production
ENV PORT=8080

# Exposer le port
EXPOSE 8080

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/health || exit 1

# Demarrer le serveur
CMD ["node", "--import", "tsx", "server/index.ts"]
