# 📋 Rapport d'Audit - AVS Backend API

**Date** : 16 Juin 2026  
**Projet** : AVS Backend — African Visual Standard API  
**Framework** : Express.js + TypeScript  
**Architecture** : Clean Architecture  
**Base de données** : PostgreSQL (Prisma ORM)

---

## 📊 Table des Matières

1. [État de Maturité du Projet](#état-de-maturité)
2. [Code Inutile & Modules Non Utilisés](#code-inutile)
3. [Code Présent Mais Mal Utilisé](#mal-utilisé)
4. [Axes d'Amélioration](#axes-damélioration)
5. [Qu'est-ce que Prisma ?](#prisma-explication)
6. [Déploiement avec PostgreSQL - Guide Complet](#déploiement)

---

## 🎯 État de Maturité

### Verdict Global : **SEMI-MATURE** (65/100)

| Critère | État | Commentaire |
|---------|------|------------|
| **Architecture** | ✅ Bon | Clean Architecture bien structurée |
| **TypeScript** | ✅ Bon | Configuration stricte, types enforced |
| **Configuration** | ✅ Bon | Variables d'env bien gérées |
| **Sécurité** | ✅ Bon | Helmet, rate limiting, CORS configurés |
| **Tests** | ❌ Critique | Quasi-inexistants (1 test unit only) |
| **Documentation** | ⚠️ Moyen | Basic, manque détails de déploiement |
| **Logging** | ✅ Bon | Winston + Morgan configurés |
| **API Documentation** | ✅ Bon | Swagger UI intégré |
| **Gestion Erreurs** | ✅ Bon | Filter/middleware custom |
| **Base de Données** | ✅ Bon | Prisma bien configuré |
| **Docker** | ⚠️ Moyen | Dockerfile incomplet pour production |
| **CI/CD** | ❌ Absent | Pas de pipelines GitHub Actions |

### Détails par Domaine

#### Architecture & Code Quality ✅
- **Modularité** : Bien organisée (modules séparés : auth, user, culture, artisan, etc.)
- **Patterns** : Utilise MVC + Service + Repository patterns
- **Dépendances** : Bien gérées via DI implicite
- **Linting** : ESLint strict avec TypeScript rules + security plugin

#### Infrastructure ⚠️
- **Database** : Prisma ORM bien configuré
- **Migration** : Scripts disponibles mais pas versionnées en production
- **Caching** : Redis mentionné en config mais non implémenté
- **Monitoring** : Winston logger présent, Sentry config absente

#### Déploiement ❌
- **Docker** : Basique, pas optimisé (multi-stage manquant)
- **Compose** : `compose.yaml` est un template commenté
- **PostgreSQL** : Pas d'instructions de déploiement
- **Production Env** : NODE_ENV handling limité

---

## 🗑️ Code Inutile & Modules Non Utilisés

### 1. **Modules Vides (Dead Code)**

```
❌ /src/modules/payments/
   ├── application/
   ├── domain/
   └── infrastructure/
   → Tous les fichiers sont vides
   → Aucune route intégrée à app.ts
   → Aucun import utilisé

❌ /src/modules/users/
   ├── application/
   ├── domain/
   └── infrastructure/
   → Duplique probablement /src/modules/user/
   → Aucune route intégrée
```

**Action requise** : Supprimer ces deux modules ou les implémenter.

### 2. **Imports Non Utilisés**

```typescript
// app.ts - ligne 32
import 'dotenv/config'  ← Importé deux fois (ligne 1 aussi)
```

**Action requise** : Supprimer la ligne 32.

### 3. **Variables d'Environnement Déclarées Mais Non Utilisées**

```bash
# .env.example
REDIS_URL=redis://localhost:6379
→ Configuré mais jamais utilisé dans le code
→ Rate limiting utilise express-rate-limit en mémoire

SENTRY_DSN=...
→ Configuré mais jamais initialisé
→ Monitoring n'utilise que Winston
```

**Action requise** : 
- Documenter si intentionnel
- Implémenter Redis si nécessaire
- Ajouter Sentry ou supprimer la config

### 4. **Packages Inutilisés en Production**

```json
Dependencies non utilisées :
- "@supabase/supabase-js" (v2.104.1)
  → Pas d'import dans le code
  → Firebase-admin présent mais Supabase aussi ?

- "cloudinary" (v2.9.0)
  → Configuré en STORAGE_PROVIDER mais jamais utilisé
  → AWS S3 adapter présent mais Cloudinary aussi ?
```

**Action requise** : Clarifier la stratégie de stockage (S3 vs Cloudinary).

### 5. **Fichiers/Routes Non Intégrés**

```typescript
// Routes définies dans app.ts mais check si tous modules sont exportés

// Modules potentiellement oubliés :
- template routes (TemplateModel existe dans schema.prisma)
- Pas de route /api/v1/templates trouvée dans app.ts
```

---

## ⚠️ Code Présent Mais Mal Utilisé

### 1. **Prisma Schema Issues**

#### ❌ Problème : Hardcoded Default Creator
```prisma
model Pattern {
  createdById   String        @default("yannick")  // ← Hardcodé !
```
**Problème** : Tous les patterns sont créés par "yannick" par défaut.  
**Solution** : Utiliser `@default(dbgenerated())` ou laisser vide.

#### ❌ Problème : Status Enum Incomplet
```prisma
enum Status {
  DRAFT
  PUBLISHED
  REVIEW
  REJECTED
  // Manquent : DELETED, ARCHIVED, etc.
}
```

#### ⚠️ Problème : Pas d'Index sur Champs Critiques
```prisma
model User {
  email @unique  // ✅ Bon
  // Manquent : @index sur [createdAt] pour logs/activities
}

model Pattern {
  // Manquent : index sur [createdById], [status], [isFeatured]
}
```

**Impact** : Requêtes lentes en production.

### 2. **Authentification Incomplète**

#### JWT Tokens
```typescript
// auth.service.ts
const tokens = generateTokens(user.id);

// Mais :
// ❌ Pas de token blacklisting (logout ne revoque pas vraiment)
// ❌ Pas de refresh token rotation
// ❌ Pas de JWT payload validation stricte
// ⚠️ Secrets stockés en .env (OK pour dev, pas ideal prod)
```

#### Social Auth
```typescript
// Account model existe pour OAuth
model Account {
  provider, providerAccountId, access_token
}
// Mais :
// ❌ Pas d'endpoints OAuth implémentés
// ❌ Pas de stratégies Passport.js configurées
```

### 3. **File Upload / Storage**

```typescript
// Packages présents :
- "@aws-sdk/client-s3"
- "cloudinary"
- "@supabase/supabase-js"

// Mais :
// ❌ Aucun middleware d'upload implémenté
// ❌ @types/multer présent mais pas d'usage
// ❌ CONFIG.STORAGE_PROVIDER en .env mais pas utilisation
```

### 4. **Rate Limiting Pas Optimisé**

```typescript
// security.middleware.ts
const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

// Problèmes :
// ❌ Même limite pour READ (GET) et WRITE (POST/DELETE)
// ❌ Store en mémoire = perte après redémarrage
// ❌ Pas de store Redis configuré
// ❌ Routes sensibles (login, register) pas de limite spéciale
```

### 5. **Pagination Non Utilisée Systématiquement**

```typescript
// shared/utils/pagination.ts existe
// Mais :
// ❌ Pas utilisé dans culture.controller.ts
// ❌ Pas utilisé dans artisan.controller.ts
// ⚠️ Retours listés sans limite de résultats
```

### 6. **Logging Inconsistent**

```typescript
// Winston logger bien configuré
// Morgan middleware présent

// Mais :
// ❌ Pas de request ID logging systématique
// ⚠️ requestId middleware présent mais non utilisé dans logs
// ❌ Pas de correlation ID pour tracer requêtes
```

---

## 🚀 Axes d'Amélioration

### 🔴 CRITIQUE (À Faire Immédiatement)

#### 1. **Ajouter des Tests**
**Statut Actuel** : 1 seul test unit  
**Impact** : Zéro couverture, risque de régression

```bash
# Actions :
1. Ajouter test suite pour chaque module :
   - Unit tests : Services, Controllers
   - Integration tests : Database operations
   - E2E tests : API endpoints

2. Cibles minimales :
   - Coverage : 60% minimum
   - Critical paths : 100%
   - Auth flows : 100%

# Exemple structure :
tests/
├── unit/
│   ├── auth/
│   │   └── auth.service.spec.ts
│   ├── user/
│   │   └── user.service.spec.ts
│   └── culture/
│       └── culture.service.spec.ts
├── integration/
│   ├── auth.routes.spec.ts
│   ├── user.routes.spec.ts
│   └── culture.routes.spec.ts
└── e2e/
    └── api.e2e.spec.ts
```

#### 2. **Fixer Dockerfile pour Production**
**Problème Actuel** : Utilise `npm run dev` en production  
**Impact** : Performance dégradée, consommation mémoire, hot-reload en prod

```dockerfile
# Problème ligne 13 :
CMD ["npm", "run", "dev"]  ← ❌ MAUVAIS

# Correction attendue :
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
EXPOSE 4000
CMD ["npm", "start"]  # ← Utilise dist/server.js
```

#### 3. **Implémenter Migrations de Production**
**Problème Actuel** : Pas de système de versioning migrations  
**Actions** :

```bash
# Scripts manquants en package.json :
"migrate:latest": "prisma migrate deploy"      # Pour déploiement
"migrate:status": "prisma migrate status"      # Vérifier status
"migrate:resolve": "prisma migrate resolve"    # Résoudre conflits

# Ajouter :
- Documentation des migrations
- Rollback strategy
- Dry-run avant production
```

#### 4. **Nettoyer Code Mort**

```bash
# Supprimer :
rm -rf src/modules/payments/
rm -rf src/modules/users/

# Corriger :
# app.ts ligne 32 : duplikat import 'dotenv/config'
# Consolidate storage config (S3 vs Cloudinary vs Supabase)
```

#### 5. **Fixer Schema Prisma**

```prisma
# Corrections :

# 1. Pattern.createdById
model Pattern {
  createdById   String  // ← Enlever @default("yannick")
  creator       User?   @relation(fields: [createdById], references: [id])
  ...
}

# 2. Ajouter indexes critiques
model Pattern {
  @@index([status])
  @@index([isFeatured])
  @@index([type])
  @@index([createdById])
}

model User {
  @@index([createdAt])
}

model Activity {
  @@index([targetId])
}
```

### 🟠 IMPORTANT (À Faire Bientôt)

#### 6. **Implémenter OAuth Social Auth**

```typescript
// Actuellement :
// - Account model existe
// - Mais zéro stratégie OAuth

// À ajouter :
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GithubStrategy } from 'passport-github';

// Endpoints : POST /api/v1/auth/google/callback
```

#### 7. **Optimiser Rate Limiting**

```typescript
// Actuellement : Limite globale 100/15min

// À faire :
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,                    // 5 tentatives
  skipSuccessfulRequests: true
});

const readLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1000                  // Beaucoup plus permissif
});

// Utiliser Redis :
import RedisStore from 'rate-limit-redis';
const redisClient = redis.createClient();
const store = new RedisStore({ client: redisClient });
```

#### 8. **Implémenter Sentry pour Error Tracking**

```typescript
import * as Sentry from "@sentry/node";

if (process.env.SENTRY_DSN) {
  Sentry.init({ dsn: process.env.SENTRY_DSN });
  app.use(Sentry.Handlers.errorHandler());
}
```

#### 9. **Standardiser Pagination**

```typescript
// Appliquer à TOUS les GET list :
app.get('/api/v1/patterns', paginationMiddleware, controller.list);

// Réponse standardisée :
{
  data: [...],
  pagination: {
    page: 1,
    limit: 20,
    total: 150,
    totalPages: 8
  }
}
```

#### 10. **Ajouter Correlation ID aux Logs**

```typescript
// Dans security.middleware.ts :
export const correlationId = (req: Request, res: Response, next: NextFunction) => {
  req.id = req.headers['x-correlation-id'] || uuid();
  res.setHeader('x-correlation-id', req.id);
  next();
};

// Utiliser dans logs :
logger.info(`User login`, { correlationId: req.id, userId: user.id });
```

### 🟡 BON À AVOIR (À Faire Plus Tard)

#### 11. **Documentation Complémentaire**

```markdown
- Architecture Decision Records (ADR)
- API Documentation avancée
- Setup Guide pour dev local
- Troubleshooting guide
- Performance tuning tips
```

#### 12. **Monitoring & Analytics**

```
- Prometheus metrics
- Grafana dashboards
- APM (Application Performance Monitoring)
- Error rate tracking
```

#### 13. **CI/CD Pipeline**

```yaml
# .github/workflows/ci.yml
- Lint + Type check
- Unit tests
- Integration tests
- Build Docker image
- Security scanning
```

---

## 📚 Qu'est-ce que Prisma ?

### Vue d'Ensemble

**Prisma** est un ORM (Object-Relational Mapping) moderne pour Node.js et TypeScript qui facilite l'interaction avec les bases de données.

### Avant Prisma (Sans ORM)

```typescript
// ❌ Raw SQL - Verbeux et error-prone
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function getUser(id: string) {
  const result = await pool.query(
    'SELECT id, email, name FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0];
}

// Problèmes :
// - Pas de type-safety
// - SQL injection risks si pas attention
// - Boilerplate répétitif
// - Migrations manuelles
```

### Avec Prisma (Moderne)

```typescript
// ✅ Prisma - Type-safe, cleaner
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getUser(id: string) {
  return await prisma.user.findUnique({ where: { id } });
}

// Avantages :
// ✅ Type-safety (Intellisense complet)
// ✅ Auto-generated client basé sur schema
// ✅ Migrations automatiques
// ✅ Relations faciles
// ✅ Query builder intuitif
```

### Architecture Prisma

```
┌─────────────────────────────────────────┐
│  Your Application Code (TypeScript)      │
│  const user = await prisma.user.find()   │
└─────────────────────────────────────────┘
                    ↓
        ┌────────────────────────┐
        │  @prisma/client        │
        │  (Generated at build)  │
        └────────────────────────┘
                    ↓
        ┌────────────────────────┐
        │  Prisma Query Engine   │
        │  (Rust-based)          │
        └────────────────────────┘
                    ↓
        ┌────────────────────────┐
        │  Database Driver       │
        │  (pg, mysql, etc)      │
        └────────────────────────┘
                    ↓
        ┌────────────────────────┐
        │  PostgreSQL Database   │
        └────────────────────────┘
```

### Fichiers Clés dans Votre Projet

#### 1. **prisma/schema.prisma**
Définit la structure complète de la DB :

```prisma
# Data source = comment se connecter à la DB
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

# Generator = génère le client Prisma
generator client {
  provider = "prisma-client-js"
}

# Models = tables de la DB
model User {
  id    String   @id @default(cuid())
  email String   @unique
  posts Post[]
}

model Post {
  id     String @id @default(cuid())
  title  String
  author User   @relation(fields: [authorId], references: [id])
  authorId String
}
```

#### 2. **prisma/migrations/**
Versions des changements de schéma :

```
migrations/
├── 20240301_init/
│   └── migration.sql
├── 20240315_add_user_bio/
│   └── migration.sql
└── migration_lock.toml
```

Chaque migration est un snapshot SQL.

#### 3. **Workflow Prisma dans Votre App**

```typescript
// ✅ src/config/database.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'error', 'warn']  // Voir les queries en dev
    : ['error']                    // Juste erreurs en prod
});

export async function connectDatabase() {
  await prisma.$connect();
  logger.info('✔ Database connected');
}
```

#### 4. **Utilisation dans Services**

```typescript
// ✅ src/modules/user/application/user.service.ts
export class UserService {
  constructor(private prisma: PrismaClient) {}

  async getUser(id: string) {
    return await this.prisma.user.findUnique({
      where: { id },
      include: { 
        posts: true,      // Charger les posts liés
        accounts: true    // Charger les comptes OAuth
      }
    });
  }

  async createUser(data: CreateUserDTO) {
    return await this.prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        role: 'VIEWER'
      }
    });
  }
}
```

### Commandes Prisma Essentielles

```bash
# Voir la DB dans interface graphique
npm run db:studio

# Générer le client Prisma (nécessaire après changements schema)
npm run db:generate

# Créer une nouvelle migration
npm run migrate

# Appliquer migrations à la DB
npx prisma migrate deploy

# Simuler changements sans appliquer
npx prisma migrate diff --from-url $OLD_DB --to-url $NEW_DB

# Réinitialiser BD locale (développement seulement !)
npx prisma migrate reset

# Seed la BD avec données initiales
npm run db:seed
```

### Migrations Prisma Automatiques

Quand vous modifiez `prisma/schema.prisma` :

```prisma
// Avant
model Pattern {
  id    String @id
  name  String
}

// Après (ajout d'un champ)
model Pattern {
  id        String   @id
  name      String
  imageUrl  String   // ← Nouveau
}
```

Prisma détecte le changement :

```bash
npm run migrate
# ? Name of migration: › add_image_url_to_pattern
# ✔ Created migration from schema change

# Crée : prisma/migrations/20240316_add_image_url_to_pattern/
```

### Avantages Prisma pour Votre Projet

| Feature | Bénéfice |
|---------|----------|
| **Type-safe** | Intellisense exact en TypeScript |
| **Auto migrations** | Pas de SQL à écrire manuellement |
| **Relations faciles** | Queries complexes = simples |
| **Built-in Validation** | Schema enforce les contraintes |
| **Performance** | Query engine optimisé (Rust) |
| **Developer Experience** | Studio pour explorer BD graphiquement |

---

## 🚀 Déploiement avec PostgreSQL - Guide Complet

### 📋 Prérequis

Avant de déployer, vous devez avoir :

1. **Serveur** : VPS/Heroku/Railway/Render (avec Node.js 18+)
2. **PostgreSQL** : Base de données PostgreSQL accesible
3. **Git** : Repository GitHub avec code
4. **Domaine** : (optionnel mais recommandé)

### Option 1 : Déploiement sur Railway (Recommandé pour Commençants)

Railway = Heroku alternative, plus moderne, plus rapide.

#### Step 1 : Créer Compte & Projet

```bash
# 1. Aller à https://railway.app
# 2. Sign up avec GitHub (+ facile)
# 3. Create new project → From GitHub Repo
# 4. Connecter votre repo avs-backend
```

#### Step 2 : Configurer PostgreSQL

Dans le dashboard Railway :

```
1. Dashboard → Add Service → PostgreSQL
2. Click PostgreSQL → Variables
3. Noter les valeurs :
   - PGUSER
   - PGPASSWORD
   - PGHOST
   - PGPORT (5432)
   - PGDATABASE
```

#### Step 3 : Configurer Variables d'Environnement

```bash
# Railway → Project → Variables

# Ajouter :
NODE_ENV=production
PORT=4000

# Database
DATABASE_URL=postgresql://${{Postgres.PGUSER}}:${{Postgres.PGPASSWORD}}@${{Postgres.PGHOST}}:${{Postgres.PGPORT}}/${{Postgres.PGDATABASE}}

# JWT
JWT_SECRET=<GÉNÉRER: openssl rand -base64 64>
JWT_REFRESH_SECRET=<GÉNÉRER: openssl rand -base64 64>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Frontend
FRONTEND_URL=https://votre-frontend.com
ALLOWED_ORIGINS=https://votre-frontend.com,https://www.votre-frontend.com

# Email (Resend)
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASS=re_XXXXX

# Autres
LOG_LEVEL=info
```

#### Step 4 : Build Configuration

Railway va automatiquement détecter Node.js. Vérifier en créant `railway.json` :

```json
{
  "builder": "nixpacks",
  "buildCommand": "npm run build",
  "startCommand": "npm start"
}
```

#### Step 5 : Appliquer Migrations

```bash
# Avant la 1ère déploiement, run migrations manuellement :

# Option A : Via Railway CLI
npm install -g railway
railway login

# Option B : SSH dans le serveur
ssh user@railway-server
cd /app
npx prisma migrate deploy
```

#### Step 6 : Deploy & Vérifier

```bash
# Railway déploiera automatiquement après push sur main

# Vérifier les logs :
railway up  # Voir les logs en live

# Test endpoint :
curl https://your-railway-app.up.railway.app/api/v1/health
# Response : {"status":"ok","service":"avs-backend",...}
```

### Option 2 : Déploiement sur Render (Alternative)

Render = Similar à Railway, très simple.

#### Étapes Rapides

```bash
# 1. https://render.com → Connect GitHub
# 2. Create Web Service → Select avs-backend repo
# 3. Settings :
#    - Build Command : npm run build
#    - Start Command : npm start
#    - Environment : production
#
# 4. Ajouter PostgreSQL :
#    - Dashboard → New PostgreSQL
#    - Copier CONNECTION_STRING
#
# 5. Variables d'Environnement :
#    DATABASE_URL=<copied connection string>
#    NODE_ENV=production
#    JWT_SECRET=...
#    (autres variables)
#
# 6. Deploy → Render fait le reste
```

### Option 3 : Déploiement Classique (VPS/Linode/DigitalOcean)

Pour plus de contrôle.

#### Step 1 : Préparer VPS

```bash
# 1. SSH dans serveur
ssh root@YOUR_VPS_IP

# 2. Installer Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Installer PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib

# 4. Installer PM2 (processus manager)
sudo npm install -g pm2
```

#### Step 2 : Configurer PostgreSQL

```bash
# Accéder à PostgreSQL
sudo -u postgres psql

# Créer BD et utilisateur
CREATE DATABASE avs_backend;
CREATE USER avs_user WITH PASSWORD 'STRONG_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON DATABASE avs_backend TO avs_user;
\q  # Quitter

# Note le CONNECTION STRING :
# postgresql://avs_user:STRONG_PASSWORD_HERE@localhost:5432/avs_backend
```

#### Step 3 : Cloner & Configurer App

```bash
# Créer dossier app
sudo mkdir -p /apps/avs-backend
sudo chown $USER:$USER /apps/avs-backend
cd /apps/avs-backend

# Cloner repo
git clone https://github.com/YOUR_USERNAME/avs-backend.git .

# Installer dépendances
npm install --production

# Générer Prisma client
npm run db:generate

# Build
npm run build
```

#### Step 4 : Variables d'Environnement

```bash
# Créer .env
cat > .env << 'EOF'
NODE_ENV=production
PORT=4000

# Database
DATABASE_URL=postgresql://avs_user:STRONG_PASSWORD_HERE@localhost:5432/avs_backend

# JWT (générer : openssl rand -base64 64)
JWT_SECRET=GENERATED_VALUE_HERE
JWT_REFRESH_SECRET=GENERATED_VALUE_HERE

# Autres
FRONTEND_URL=https://votre-frontend.com
LOG_LEVEL=info
EOF

# Restreindre permissions
chmod 600 .env
```

#### Step 5 : Appliquer Migrations

```bash
# Première exécution : créer toutes les tables
npx prisma migrate deploy

# Ou si première fois :
npx prisma migrate dev --name init
```

#### Step 6 : Lancer avec PM2

```bash
# Lancer app
pm2 start "npm start" --name avs-backend

# Sauvegarder config PM2 (redémarrage auto)
pm2 save
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup -u $USER --hp /home/$USER

# Vérifier
pm2 logs avs-backend

# Test
curl http://localhost:4000/api/v1/health
```

#### Step 7 : Configurer Nginx (Reverse Proxy)

```bash
# Installer Nginx
sudo apt-get install -y nginx

# Configurer
sudo tee /etc/nginx/sites-available/avs-backend > /dev/null << 'EOF'
server {
    listen 80;
    server_name YOUR_DOMAIN.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
EOF

# Activer site
sudo ln -s /etc/nginx/sites-available/avs-backend /etc/nginx/sites-enabled/
sudo systemctl restart nginx

# SSL (https) avec Let's Encrypt
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d YOUR_DOMAIN.com
```

#### Step 8 : Vérifier Déploiement

```bash
# Logs
pm2 logs avs-backend

# Status
pm2 status

# Test API
curl https://YOUR_DOMAIN.com/api/v1/health

# Vérifier DB connection
curl https://YOUR_DOMAIN.com/api/v1/users  # Doit requérir auth
```

### Option 4 : Docker + Production (Recommandé Long-Terme)

#### Fixer Dockerfile D'Abord

```dockerfile
# ✅ Multi-stage build

# Stage 1 : Builder
FROM node:20-alpine AS builder

WORKDIR /build
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build
RUN npx prisma generate

# Stage 2 : Runtime
FROM node:20-alpine

WORKDIR /app

# User de sécurité (ne pas run en root)
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /build/dist ./dist
COPY --from=builder /build/prisma ./prisma
COPY --from=builder /build/node_modules/.prisma ./node_modules/.prisma

EXPOSE 4000

# Changer user
USER nodejs

# HEALTHCHECK pour Docker orchestration
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/api/v1/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

CMD ["node", "dist/server.js"]
```

#### Docker Compose pour Production

```yaml
# compose.prod.yaml
version: '3.8'

services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: avs_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: avs_backend
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U avs_user"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  api:
    build:
      context: .
      dockerfile: Dockerfile
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://avs_user:${DB_PASSWORD}@db:5432/avs_backend
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      FRONTEND_URL: ${FRONTEND_URL}
      LOG_LEVEL: info
    ports:
      - "4000:4000"
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped
    # Resource limits pour production
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M

volumes:
  postgres_data:
```

#### Déployer avec Docker

```bash
# Build image
docker build -t avs-backend:1.0.0 .

# Pousser vers registry (Docker Hub / GitHub Container Registry)
docker tag avs-backend:1.0.0 your-username/avs-backend:1.0.0
docker push your-username/avs-backend:1.0.0

# Sur VPS :
docker pull your-username/avs-backend:1.0.0

# Créer .env.prod
cat > .env.prod << 'EOF'
DB_PASSWORD=STRONG_PASSWORD
JWT_SECRET=<generated>
JWT_REFRESH_SECRET=<generated>
FRONTEND_URL=https://your-domain.com
EOF

# Lancer avec compose
docker-compose -f compose.prod.yaml --env-file .env.prod up -d

# Appliquer migrations
docker-compose -f compose.prod.yaml exec api npx prisma migrate deploy

# Vérifier
docker-compose -f compose.prod.yaml logs -f api
```

### 📋 Checklist de Déploiement Complet

```
PRÉ-DÉPLOIEMENT
☐ Générer JWT_SECRET : openssl rand -base64 64
☐ Générer JWT_REFRESH_SECRET : openssl rand -base64 64
☐ Préparer DATABASE_URL pour production
☐ Tester build localement : npm run build
☐ Vérifier .env n'est pas dans git
☐ Mettre à jour .env.example

DÉPLOIEMENT (Choix 1)
☐ Push code vers GitHub
☐ Configurer Railway/Render
☐ Ajouter variables d'environnement
☐ PostgreSQL service créé
☐ Deploy automatique via CI/CD

DÉPLOIEMENT (Choix 2 - VPS Classique)
☐ SSH serveur, installer Node 20 + PostgreSQL
☐ Créer BD avs_backend et user avs_user
☐ Clone repo git
☐ npm install --production
☐ npm run build
☐ npx prisma migrate deploy
☐ PM2 start app
☐ Nginx reverse proxy configuré
☐ SSL certificate (Let's Encrypt)

POST-DÉPLOIEMENT
☐ Tester endpoint health : /api/v1/health
☐ Test login flow
☐ Test fetch patterns
☐ Vérifier logs PM2/Docker
☐ Monitorer performance
☐ Setup backups BD (cron job)
☐ Configurer monitoring (Sentry si possible)

MAINTENANCE
☐ Updates mensuelles dépendances
☐ Backups BD quotidien
☐ Logs rotation
☐ SSL certificate renewal (auto avec certbot)
☐ Performance monitoring
```

### 🔧 Commandes Utiles en Production

```bash
# Voir logs en direct
pm2 logs avs-backend --lines 100 --follow

# Redémarrer app après config change
pm2 restart avs-backend

# Voir metrics
pm2 monit

# Migration vers nouvelle version
git pull origin main
npm install --production
npm run build
npx prisma migrate deploy
pm2 restart avs-backend

# Backup BD PostgreSQL
pg_dump postgresql://avs_user:PASSWORD@localhost/avs_backend > backup-$(date +%Y%m%d).sql

# Restore depuis backup
psql postgresql://avs_user:PASSWORD@localhost/avs_backend < backup-20240316.sql

# Voir status services
systemctl status nginx
systemctl status postgresql
pm2 status

# Logs DB
sudo tail -f /var/log/postgresql/postgresql.log
```

### ⚠️ Checklist de Sécurité Production

```bash
# Firewall : Bloquer tous ports sauf 80, 443, 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 22/tcp
sudo ufw enable

# SSH : Désactiver root login
# /etc/ssh/sshd_config
PermitRootLogin no
PasswordAuthentication no  # Utiliser clés SSH

# PostgreSQL : Binded à localhost seulement
# /etc/postgresql/16/main/postgresql.conf
listen_addresses = 'localhost'

# Nginx : Headers de sécurité
add_header X-Frame-Options "SAMEORIGIN";
add_header X-Content-Type-Options "nosniff";
add_header X-XSS-Protection "1; mode=block";

# Secrets : Jamais en git
echo ".env" >> .gitignore
git rm --cached .env

# Logs : Rotation hebdomadaire
sudo tee /etc/logrotate.d/avs-backend > /dev/null << 'EOF'
/apps/avs-backend/.pm2/logs/*.log {
    weekly
    rotate 4
    compress
    delaycompress
    notifempty
}
EOF
```

---

## 📞 Support & Questions

### Erreurs Fréquentes en Déploiement

#### "DATABASE_URL not set"
```bash
# Solution : Vérifier variables d'env
echo $DATABASE_URL  # Doit afficher URL

# Ou en Docker :
docker-compose exec api printenv | grep DATABASE_URL
```

#### "Cannot connect to PostgreSQL"
```bash
# Vérifier BD existe
psql -U avs_user -c "SELECT 1"

# Vérifier connexion string
postgresql://USER:PASSWORD@HOST:PORT/DATABASE

# Test depuis serveur
psql postgresql://avs_user:PASSWORD@localhost/avs_backend
```

#### "Prisma migration fails"
```bash
# Voir status
npx prisma migrate status

# Réinitialiser si dev (DANGER en prod!)
npx prisma migrate reset

# Resolve conflits en prod
npx prisma migrate resolve --rolled-back "migration_name"
```

#### "Port 4000 already in use"
```bash
# Trouver processus
lsof -i :4000

# Tuer
kill -9 PID

# Ou utiliser autre port
PORT=5000 npm start
```

---

## 📝 Conclusion

### État Actuel
- ✅ Architecture bien structurée
- ✅ Sécurité de base implémentée
- ❌ Tests quasi-inexistants
- ❌ Déploiement production non documenté

### Priorités Immédiatement
1. **Nettoyer code mort** (modules vides)
2. **Ajouter tests** (au minimum 40% coverage)
3. **Fixer Dockerfile** pour production
4. **Documenter déploiement** (ce guide)
5. **Configurer migrations** versionnées

### Post-MVP
- OAuth social auth
- Sentry monitoring
- Redis rate limiting
- GraphQL (optionnel)
- CI/CD pipelines

---

**Auteur** : Audit automatisé  
**Dernière mise à jour** : 16 Juin 2026  
**Prochaine revue** : Après premiers changements

