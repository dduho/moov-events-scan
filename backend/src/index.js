'use strict'
const path = require('path')

const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env'
require('dotenv').config({ path: path.join(__dirname, '..', envFile) })

const express   = require('express')
const cors      = require('cors')
const rateLimit = require('express-rate-limit')

const scanRoutes = require('./routes/scan')

const app  = express()
const PORT = process.env.PORT || 3211

app.set('trust proxy', 1)

// -- CORS -----------------------------------------------------------------
const rawOrigins = process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:5174'
const allowedOrigins = rawOrigins.split(',').map(o => o.trim()).filter(Boolean)
app.use(cors({ origin: allowedOrigins, credentials: true }))

app.use(express.json({ limit: '256kb' }))

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300, // volume potentiellement eleve a l'entree d'un evenement
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requetes, veuillez reessayer dans une minute.' },
})
app.use('/api/', apiLimiter)

// -- Routes -----------------------------------------------------------------
const apiPrefixes = [...new Set([
  '/api/moov-events-scan',
  '/api/moov-events-scan-test',
  process.env.API_PREFIX,
].filter(Boolean))]
apiPrefixes.forEach(prefix => app.use(prefix, scanRoutes))

// -- Health check -------------------------------------------------------------
app.get('/health', (_req, res) => res.json({ status: 'ok', app: 'moov-events-scan', port: PORT }))

// -- 404 ------------------------------------------------------------------------
app.use((_req, res) => res.status(404).json({ error: 'Route introuvable' }))

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err.message)
  res.status(500).json({ error: 'Erreur interne du serveur' })
})

app.listen(PORT, () => {
  console.log(`[moov-events-scan-backend] Serveur demarre sur le port ${PORT}`)
})
