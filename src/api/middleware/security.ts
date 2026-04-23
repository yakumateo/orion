import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { Request, Response } from 'express'
import { logger } from '../../config/logger'

// ─── Helmet ───────────────────────────────────────────────────────────────────
// Configura 14 security headers de una sola vez.
// Cada header le dice al navegador cómo comportarse frente a ataques comunes.
export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
    },
  },
  // HSTS: le dice al navegador "solo HTTPS por 1 año"
  // Previene downgrade attacks (forzarte a HTTP para interceptar tráfico)
  strictTransportSecurity: {
    maxAge: 31536000,
    includeSubDomains: true,
  },
})

// ─── Rate Limiter general ────────────────────────────────────────────────────
// 100 requests por IP cada 15 minutos.
// Protege contra: scraping, fuerza bruta, DoS básico.
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,   // devuelve X-RateLimit-Remaining en cada response
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      userAgent: req.get('user-agent'),
    })
    res.status(429).json({
      error: 'Too many requests. Try again in 15 minutes.',
    })
  },
})

// ─── Rate Limiter para chat ───────────────────────────────────────────────────
// Más estricto: 30 requests por minuto.
// Razón: cada request al chat llama a la API de Gemini.
// Sin este límite, alguien podría agotar tu cuota gratuita en segundos.
// Esto es "cost-based rate limiting" — protege tu billetera además de tu servidor.
export const chatRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn('Chat rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    })
    res.status(429).json({
      error: 'Chat limit reached. Max 30 messages per minute.',
    })
  },
})