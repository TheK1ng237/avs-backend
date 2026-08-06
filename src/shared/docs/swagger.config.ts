// =============================================================================
// Swagger / OpenAPI 3.0 — Configuration AVS
// Accès : http://localhost:4000/api-docs
// =============================================================================
import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title:       'AVS API — African Visual Standard',
      version:     '1.0.0',
      description: `
## 🌍 AVS — African Visual Standard

API officielle du projet **AVS** : valoriser la culture camerounaise et africaine via le visuel digital.

### Fonctionnalités principales
- **Motifs culturels** : catalogue de patterns Ndop, Adinkra, Kente, Bogolan, Wax…
- **Authentification** : JWT avec rôles (viewer / contributor / curator / admin)
- **Standard visuel** : palette AVS (\`#C0573E\`, \`#F5EBE0\`, \`#1D1D1B\`)

### Authentification
Toutes les routes protégées nécessitent un **Bearer Token** JWT.
\`\`\`
Authorization: Bearer <votre_token>
\`\`\`
      `,
      contact: {
        name:  'Équipe AVS',
        url:   'https://avs-standard.com',
        email: 'dev@avs-standard.com',
      },
      license: { name: 'MIT', url: 'https://opensource.org/licenses/MIT' },
    },
    servers: [
      { url: 'http://localhost:4000',    description: '🛠  Développement local' },
      { url: 'https://api.avs-standard.com', description: '🚀 Production' },
    ],
    tags: [
      { name: 'System',     description: 'Santé et métadonnées de l\'API' },
      { name: 'Auth',       description: 'Authentification & gestion des tokens' },
      { name: 'Users',      description: 'Gestion des utilisateurs et profils' },
      { name: 'Patterns',   description: 'Motifs culturels africains (CRUD)' },
      { name: 'Artisans',   description: 'Profils d\'artisans africains' },
      { name: 'Palettes',   description: 'Palettes de couleurs africaines' },
      { name: 'Templates',  description: 'Templates UI/UX réutilisables' },
      { name: 'Comments',   description: 'Système de commentaires' },
      { name: 'Activities', description: 'Journal d\'activités utilisateur' },
    ],
    components: { 
      securitySchemes: {
        bearerAuth: {
          type:         'http',
          scheme:       'bearer',
          bearerFormat: 'JWT',
          description:  'Token JWT obtenu via POST /api/v1/auth/login',
        },
      },
      schemas: {
        // ── Enums ──────────────────────────────────────────────────────────
        PatternType: {
          type: 'string',
          enum: ['kente','bogolan','adinkra','ndebele','kuba','ndop','wax','berber'],
          example: 'ndop',
        },
        Region: {
          type: 'string',
          enum: ['west-africa','east-africa','central-africa','north-africa','south-africa','diaspora'],
          example: 'central-africa',
        },
        UsageType: {
          type: 'string',
          enum: ['ceremonial','daily','royal','spiritual','universal'],
          example: 'ceremonial',
        },
        Role: {
          type: 'string',
          enum: ['viewer','contributor','curator','admin'],
          example: 'contributor',
        },

        // ── Value Objects ──────────────────────────────────────────────────
        PatternColors: {
          type: 'object',
          required: ['primary','secondary'],
          properties: {
            primary:   { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$', example: '#C0573E', description: 'Couleur primaire AVS (terre rouge camerounaise)' },
            secondary: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$', example: '#F5EBE0', description: 'Couleur secondaire AVS (sable clair)' },
            accent:    { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$', example: '#1D1D1B', description: 'Couleur accent AVS (noir profond)' },
          },
        },
        PatternSymbolism: {
          type: 'object',
          required: ['meaning','keywords','usage'],
          properties: {
            meaning:  { type: 'string', maxLength: 512, example: 'Royauté, transmission inter-générationnelle' },
            keywords: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 10, example: ['royauté','cameroun','bamoum'] },
            usage:    { $ref: '#/components/schemas/UsageType' },
          },
        },
        PatternSymbol: {
          type: 'object',
          required: ['name', 'nameFr', 'meaning', 'usage', 'sacred'],
          properties: {
            name:        { type: 'string', maxLength: 128, example: 'Sankofa' },
            nameFr:      { type: 'string', maxLength: 128, example: 'Retour aux sources' },
            meaning:     { type: 'string', maxLength: 512, example: 'Symbole du retour aux sources pour avancer vers l\'avenir' },
            usage:       { type: 'string', maxLength: 256, example: 'Offert lors des transmissions générationnelles' },
            sacred:      { type: 'boolean', example: false },
            cssPreview:  { type: 'string', maxLength: 128, example: '#D4A017', description: 'Couleur ou classe CSS pour l\'aperçu' },
            imageUrl:    { type: 'string', format: 'uri', example: 'https://cdn.avs-standard.com/symbols/sankofa.png', description: 'URL optionnelle vers l\'image du symbole' },
          },
        },

        // ── Main Entity ────────────────────────────────────────────────────
        CulturePattern: {
          type: 'object',
          properties: {
            id:          { type: 'string', example: 'clx4f2k3d0000v9rg8h1m2n3p' },
            slug:        { type: 'string', example: 'ndop-bamoum' },
            nameFr:      { type: 'string', example: 'Ndop Royal Bamoum' },
            nameEn:      { type: 'string', example: 'Bamoum Royal Ndop' },
            descFr:      { type: 'string', example: 'Tissu sacré tissé pour les cérémonies royales du Sultanat Bamoum.' },
            descEn:      { type: 'string', example: 'Sacred cloth woven for royal ceremonies of the Bamoum Sultanate.' },
            patternType: { $ref: '#/components/schemas/PatternType' },
            region:      { $ref: '#/components/schemas/Region' },
            country:     { type: 'string', minLength: 2, maxLength: 2, example: 'CM', description: 'Code ISO 3166-1 alpha-2' },
            colors:      { $ref: '#/components/schemas/PatternColors' },
            symbolism:   { $ref: '#/components/schemas/PatternSymbolism' },
            isPublished: { type: 'boolean', example: true },
            isFeatured:  { type: 'boolean', example: false },
            viewCount:   { type: 'integer', example: 247 },
            svgUrl:      { type: 'string', format: 'uri', example: 'https://cdn.avs-standard.com/patterns/ndop-bamoum.svg' },
            previewUrl:  { type: 'string', format: 'uri', example: 'https://cdn.avs-standard.com/previews/ndop-bamoum.png' },
            createdAt:   { type: 'string', format: 'date-time' },
            updatedAt:   { type: 'string', format: 'date-time' },
            createdById: { type: 'string', example: 'clx4f2k3d0000v9rg0a0b0c0d' },
          },
        },

        // ── DTOs ──────────────────────────────────────────────────────────
        CreatePatternDto: {
          type: 'object',
          required: ['nameFr','nameEn','descFr','descEn','patternType','region','country','colors','symbolism'],
          properties: {
            nameFr:      { type: 'string', minLength: 2, maxLength: 128, example: 'Ndop Royal Bamoum' },
            nameEn:      { type: 'string', minLength: 2, maxLength: 128, example: 'Bamoum Royal Ndop' },
            descFr:      { type: 'string', minLength: 10, maxLength: 2000, example: 'Tissu sacré tissé pour les cérémonies royales.' },
            descEn:      { type: 'string', minLength: 10, maxLength: 2000, example: 'Sacred cloth for royal ceremonies.' },
            patternType: { $ref: '#/components/schemas/PatternType' },
            region:      { $ref: '#/components/schemas/Region' },
            country:     { type: 'string', minLength: 2, maxLength: 2, example: 'CM' },
            colors:      { $ref: '#/components/schemas/PatternColors' },
            symbolism:   { $ref: '#/components/schemas/PatternSymbolism' },
          },
        },

        // ── Réponses génériques ────────────────────────────────────────────
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string',  example: 'OK' },
            data:    { type: 'object'  },
            meta:    { $ref: '#/components/schemas/PaginationMeta' },
          },
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            page:       { type: 'integer', example: 1 },
            perPage:    { type: 'integer', example: 20 },
            totalItems: { type: 'integer', example: 42 },
            totalPages: { type: 'integer', example: 3 },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success:   { type: 'boolean', example: false },
            message:   { type: 'string',  example: 'Motif introuvable' },
            code:      { type: 'string',  example: 'NOT_FOUND' },
            requestId: { type: 'string',  example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
          },
        },

        // ── Auth ──────────────────────────────────────────────────────────
        LoginDto: {
          type: 'object',
          required: ['email','password'],
          properties: {
            email:    { type: 'string', format: 'email', example: 'kofi@avs-standard.com' },
            password: { type: 'string', minLength: 8,   example: 'motDePasse123' },
          },
        },
        RegisterDto: {
          type: 'object',
          required: ['name','email','password'],
          properties: {
            name:     { type: 'string', example: 'Kofi Design' },
            email:    { type: 'string', format: 'email', example: 'kofi@avs-standard.com' },
            password: { type: 'string', minLength: 8,   example: 'motDePasse123' },
          },
        },
        AuthTokenResponse: {
          type: 'object',
          properties: {
            success:      { type: 'boolean', example: true },
            accessToken:  { type: 'string',  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            refreshToken: { type: 'string',  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            expiresIn:    { type: 'string',  example: '15m' },
          },
        },
      },
      responses: {
        Unauthorized: {
          description: 'Token JWT manquant ou invalide',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
        Forbidden: {
          description: 'Rôle insuffisant',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
        NotFound: {
          description: 'Ressource introuvable',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
        ValidationError: {
          description: 'Données invalides (Zod)',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
      },
    },
  },
  // Scan de TOUS les fichiers de routes pour les annotations JSDoc
  apis: [
    './src/api/routes/*.ts',
    './src/api/controllers/*.ts',
    './src/modules/*/routes.ts',
    './src/modules/*/*.routes.ts',
    './src/modules/*/controllers/*.ts',
    './src/modules/*/*controller.ts',
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
