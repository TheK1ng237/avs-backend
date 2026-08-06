# --- Étape 1 : Build & Compilation ---
FROM node:20-alpine AS builder

WORKDIR /build

COPY package*.json ./

RUN npm ci

COPY . .

RUN npx prisma generate

RUN npm run build

# --- Étape 2 : Image d'exécution (Production) ---
FROM node:20-alpine

WORKDIR /app

# Création de l'utilisateur système non-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Attribution des fichiers package.json à l'utilisateur nodejs
COPY --chown=nodejs:nodejs package*.json ./

# Installation stricte des dépendances de production
RUN npm ci --omit=dev

# Copie sécurisée des builds et artefacts Prisma avec les bonnes permissions
COPY --chown=nodejs:nodejs --from=builder /build/dist ./dist
COPY --chown=nodejs:nodejs --from=builder /build/prisma ./prisma
COPY --chown=nodejs:nodejs --from=builder /build/node_modules/.prisma ./node_modules/.prisma

EXPOSE 4000

# Passage à l'utilisateur sécurisé avant l'exécution
USER nodejs

# Vérification de la santé de l'API (Assure-toi que cette route retourne un statut 200)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/api/v1/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

CMD ["node", "dist/server.js"]