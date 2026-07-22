import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { rateLimit } from 'express-rate-limit'
import 'dotenv/config'

import { certificadosRouter } from './routes/certificados.js'
import { emailRouter }        from './routes/email.js'

const app  = express()
const PORT = process.env.PORT ?? 3001

// ── Seguridad ────────────────────────────────
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  credentials: true,
}))

// Rate limiting general
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100,
  message: { error: 'Demasiadas solicitudes, intenta más tarde' },
}))

app.use(express.json({ limit: '10mb' }))

// ── Rutas ────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date() }))
app.use('/api/certificados', certificadosRouter)
app.use('/api/email',        emailRouter)

// ── Manejo de errores ────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err)
  res.status(err.status ?? 500).json({ error: err.message ?? 'Error interno del servidor' })
})

app.listen(PORT, () => {
  console.log(`✅ MediDesk backend corriendo en http://localhost:${PORT}`)
})
