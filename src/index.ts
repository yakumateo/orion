import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { env } from './config/env'
import { logger } from './config/logger'
import { connectDB, disconnectDB } from './database/prisma.client'
import { chatRouter } from './api/routes/chat.routes'
import { memoryRouter } from './api/routes/memory.routes'
import { financeRouter } from './api/routes/finance.routes'
import { errorHandler } from './api/middleware/error-handler'
import { helmetMiddleware, generalRateLimit, chatRateLimit } from './api/middleware/security'

const app = express()

// ─── 1. Security headers (primero siempre) ───────────────────────────────────
app.use(helmetMiddleware)

// ─── 2. Rate limiting global ─────────────────────────────────────────────────
app.use(generalRateLimit)

// ─── 3. CORS — orígenes permitidos según entorno ─────────────────────────────
// En producción solo acepta requests del frontend deployado.
// En desarrollo acepta localhost:5173.
// Cualquier otro origen recibe 403 automáticamente.
const allowedOrigins = env.NODE_ENV === 'production'
  ? (process.env.ALLOWED_ORIGINS ?? '').split(',')
  : ['http://localhost:5173']

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}))

// ─── 4. Body parser con límite de tamaño ─────────────────────────────────────
// limit: '10kb' previene ataques donde se envía un body gigante
// para agotar memoria del servidor (DoS a nivel de aplicación)
app.use(express.json({ limit: '10kb' }))

// ─── 5. Health check sin rate limit ──────────────────────────────────────────
// Railway necesita este endpoint para saber si el servidor está vivo.
// No tiene rate limit porque Railway lo llama cada 30 segundos.
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ─── 6. Routes ───────────────────────────────────────────────────────────────
app.use('/api/chat', chatRateLimit, chatRouter)   // rate limit doble en chat
app.use('/api/memory', memoryRouter)
app.use('/api/finance', financeRouter)

// ─── 7. 404 handler ──────────────────────────────────────────────────────────
// Sin esto, Express devuelve HTML por defecto en rutas no encontradas.
// HTML en una API es un leak de información (revela que usas Express).
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// ─── 8. Error handler (siempre al final) ─────────────────────────────────────
app.use(errorHandler)

// ─── Start ───────────────────────────────────────────────────────────────────
async function start() {
  await connectDB()

  const server = app.listen(env.PORT, () => {
    logger.info('Orion API running', { port: env.PORT, env: env.NODE_ENV })
  })

  const shutdown = async () => {
    logger.info('Shutting down...')
    server.close()
    await disconnectDB()
    process.exit(0)
  }

  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)
}

start().catch((err) => {
  logger.error('Failed to start', { error: err })
  process.exit(1)
})