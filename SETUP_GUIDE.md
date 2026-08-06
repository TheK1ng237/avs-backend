# Guide de Démarrage - AVS Backend API

Ce guide vous explique comment lancer le backend pas à pas, que ce soit en développement ou en production.

---

## 📋 Prérequis

Avant de commencer, assurez-vous d'avoir installé:
- **Node.js** >= 18.0.0 ([Télécharger](https://nodejs.org/))
- **Docker** et **Docker Compose** ([Télécharger](https://www.docker.com/products/docker-desktop))
- **PostgreSQL** (optionnel si vous utilisez Docker)
- **Redis** (optionnel si vous utilisez Docker)

---

## 🚀 Option 1: Lancer avec Docker Compose (RECOMMANDÉ)

### Étape 1: Préparer les fichiers d'environnement

```bash
# Copier le fichier d'exemple
cp .env.example .env
```

### Étape 2: Configurer les variables d'environnement

Ouvrir le fichier `.env` et configurer les variables essentielles:

```env
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/avs_db
REDIS_URL=redis://redis:6379
JWT_SECRET=your-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-here
FRONTEND_URL=http://localhost:3000
```

### Étape 3: Lancer les containers Docker

**Pour le développement** (avec hot-reload):
```bash
docker-compose -f compose.dev.yaml up -d
```

**Pour la production**:
```bash
docker-compose up -d
```

### Étape 4: Vérifier que les services sont actifs

```bash
docker-compose ps
```

Vous devriez voir 3 services en cours d'exécution:
- `avs-api` (votre backend)
- `avs-postgres` (base de données)
- `avs-redis` (cache)

### Étape 5: Initialiser la base de données

```bash
# Appliquer les migrations
docker-compose exec api npm run migrate

# (Optionnel) Remplir la base avec des données de test
docker-compose exec api npm run db:seed
```

### Étape 6: Accéder à votre backend

- **API**: http://localhost:4000 (développement) ou http://localhost:5000 (production)
- **Logs**: `docker-compose logs -f api`

### Arrêter les services

```bash
docker-compose down
```

---

## 💻 Option 2: Lancer en Local (sans Docker)

### Étape 1: Installer les dépendances

```bash
npm install
```

### Étape 2: Configurer les variables d'environnement

```bash
cp .env.example .env
```

Ensuite, éditer `.env` et configurer:
```env
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/avs_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-here
FRONTEND_URL=http://localhost:3000
```

### Étape 3: Démarrer PostgreSQL et Redis localement

**Avec Docker (containers seuls)**:
```bash
# Créer les containers PostgreSQL et Redis
docker run --name avs-postgres -e POSTGRES_PASSWORD=postgres -d -p 5432:5432 postgres:16-alpine
docker run --name avs-redis -d -p 6379:6379 redis:7-alpine
```

**Ou installer localement** (sur votre machine):
- PostgreSQL: https://www.postgresql.org/download/
- Redis: https://redis.io/download

### Étape 4: Initialiser la base de données

```bash
# Appliquer les migrations
npm run migrate

# (Optionnel) Remplir avec des données de test
npm run db:seed
```

### Étape 5: Lancer le backend en développement

```bash
npm run dev
```

L'API sera accessible à: **http://localhost:4000**

### Étape 6: Nettoyer les containers (optionnel)

```bash
docker stop avs-postgres avs-redis
docker rm avs-postgres avs-redis
```

---

## 🔧 Commandes Utiles

### Développement
```bash
# Démarrer en mode watch (rechargement auto)
npm run dev

# Vérifier la syntaxe TypeScript
npm run type-check

# Linter le code
npm run lint

# Corriger les erreurs de linting
npm run lint:fix

# Lancer les tests
npm run test

# Lancer les tests en mode watch
npm run test:watch
```

### Base de données
```bash
# Appliquer les migrations
npm run migrate

# Générer les types Prisma
npm run db:generate

# Pousser les changements du schéma
npm run db:push

# Remplir la base avec des données de test
npm run db:seed

# Ouvrir Prisma Studio (UI pour gérer la BD)
npm run db:studio
```

### Production
```bash
# Build pour la production
npm run build

# Lancer la version built
npm start
```

### Docker
```bash
# Démarrer les containers (mode dev)
docker-compose -f compose.dev.yaml up -d

# Démarrer les containers (mode production)
docker-compose up -d

# Arrêter les containers
docker-compose down

# Voir les logs
docker-compose logs -f api

# Arrêter complètement (supprimer les volumes)
docker-compose down -v
```

---

## 🐛 Dépannage

### L'API ne démarre pas
```bash
# Vérifier les logs
docker-compose logs api

# Vérifier que les ports ne sont pas occupés
lsof -i :4000  # développement
lsof -i :5000  # production
```

### Erreur de connexion à la base de données
```bash
# Vérifier que PostgreSQL est actif
docker-compose ps

# Vérifier les logs PostgreSQL
docker-compose logs postgres

# Réinitialiser la base
docker-compose down -v
docker-compose up -d
npm run migrate
```

### Erreur de migration
```bash
# Réinitialiser Prisma
npm run db:generate
npm run db:push
npm run migrate
```

### Port déjà utilisé
```bash
# Trouver le processus qui occupe le port
lsof -i :4000

# Tuer le processus
kill -9 <PID>
```

---

## 📊 Accès à Prisma Studio

Pour visualiser et gérer votre base de données via une UI:

```bash
npm run db:studio
```

Cela ouvrira un navigateur à l'adresse: **http://localhost:5555**

---

## 🚨 Variables d'environnement essentielles

| Variable | Description | Exemple |
|----------|-------------|---------|
| `NODE_ENV` | Environnement (development/production) | `development` |
| `PORT` | Port d'écoute de l'API | `4000` |
| `DATABASE_URL` | Connexion PostgreSQL | `postgresql://user:pass@host/db` |
| `REDIS_URL` | Connexion Redis | `redis://localhost:6379` |
| `JWT_SECRET` | Clé secrète JWT | `long-random-string` |
| `JWT_REFRESH_SECRET` | Clé refresh token | `another-long-random-string` |
| `FRONTEND_URL` | URL du frontend | `http://localhost:3000` |

---

## 🔐 Générer les secrets JWT

```bash
# Générer une clé sécurisée de 64 caractères
openssl rand -base64 64
```

Copier la sortie dans `.env`:
```env
JWT_SECRET=votre-clé-générée
JWT_REFRESH_SECRET=autre-clé-générée
```

---

## 📚 Architecture du projet

```
avs-backend/
├── src/
│   ├── modules/          # Fonctionnalités métier
│   ├── common/           # Code partagé
│   ├── config/           # Configuration
│   └── server.ts         # Point d'entrée
├── prisma/
│   ├── schema.prisma     # Schéma de la base
│   └── migrations/       # Historique des migrations
├── tests/                # Tests unitaires et d'intégration
├── dist/                 # Code compilé (après build)
├── compose.yaml          # Docker Compose production
├── compose.dev.yaml      # Docker Compose développement
└── .env                  # Variables d'environnement
```

---

## ✅ Checklist de démarrage

- [ ] Node.js >= 18 installé
- [ ] Docker et Docker Compose installés
- [ ] Fichier `.env` créé et configuré
- [ ] Variables d'environnement remplies
- [ ] Containers Docker démarrés
- [ ] Migrations appliquées
- [ ] API accessible sur http://localhost:4000 (ou 5000)
- [ ] Tests passent: `npm run test`

---

## 📞 Support

En cas de problème:
1. Vérifiez les logs: `docker-compose logs`
2. Vérifiez que les ports sont libres
3. Réinitialisez les volumes: `docker-compose down -v`
4. Consultez la documentation officielle des outils

