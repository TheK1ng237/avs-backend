import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import type { RequestHandler } from 'express';
import 'dotenv/config'

// ── Helmet — Headers HTTP de sécurité ─────────────────────────────────────────
export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'"],
      styleSrc:   ["'self'"],
      imgSrc:     ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      frameSrc:   ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy:   { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-origin' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  hsts: { maxAge: 63072000, includeSubDomains: true, preload: true },
  noSniff: true,
  frameguard: { action: 'deny' },
  xssFilter: true,
});

// ── CORS — Origines autorisées ────────────────────────────────────────────────
const ALLOWED = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:3000').split(',').map(o => o.trim());

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // En développement, autoriser les requêtes sans origine (Postman, curl, etc.)
    if (!origin) {
      if (process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      return callback(new Error('CORS: Origine requise en production'));
    }
    // Vérifier si l'origine est dans la liste blanche
    if (ALLOWED.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error(`CORS: Origine non autorisée — ${origin}`));
  },
  credentials:      true,
  methods:          ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders:   ['Content-Type', 'Authorization', 'X-Request-ID'],
  exposedHeaders:   ['X-Total-Count', 'X-Page', 'X-Rate-Limit-Remaining'],
  maxAge:           86400, // 24h preflight cache
});

// ── Rate Limiter — Général ────────────────────────────────────────────────────
export const globalRateLimiter = rateLimit({
  windowMs:          15 * 60 * 1000,  // 15 minutes
  max:               200,
  standardHeaders:   true,
  legacyHeaders:     false,
  message:           { success: false, message: 'Trop de requêtes. Réessayez dans 15 minutes.' },
  skip: (req) => process.env.NODE_ENV === 'test',
});

// ── Rate Limiter — Auth (plus strict) ────────────────────────────────────────
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      10,
  message:  { success: false, message: 'Trop de tentatives de connexion. Attendez 15 minutes.' },
  standardHeaders: true,
});

// ── Rate Limiter — API publique ───────────────────────────────────────────────
export const publicApiRateLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max:      60,
  message:  { success: false, message: 'Limite API atteinte.' },
  standardHeaders: true,
});

// ── Request ID middleware ─────────────────────────────────────────────────────
export const requestId: RequestHandler = (req, res, next) => {
  const id = req.headers['x-request-id'] ?? crypto.randomUUID();
  req.headers['x-request-id'] = String(id);
  res.setHeader('X-Request-ID', String(id));
  next();
};
