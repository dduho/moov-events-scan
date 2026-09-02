'use strict'
const path = require('path')

const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env'
require('dotenv').config({ path: path.join(__dirname, '..', envFile) })

const express   = require('express')
const cors      = require('cors')

const scanRoutes = require('./routes/scan')

const app  = express()
const PORT = process.env.PORT || 3211

// = 2, PAS 1 : chaque requete publique traverse deux sauts avant d'atteindre
// ce process (boucle nginx interne 8080->443 de la plateforme, PUIS le proxy
// dynamique de moovapps-api vers ce backend, qui transmet X-Forwarded-For
// tel quel sans ajouter de saut). Avec 1, req.ip retombait sur l'adresse de
// boucle du dernier saut (127.0.0.1) - meme bug que
// platform/backend/src/index.js (chantier robustesse, voir MEMORY.md).
app.set('trust proxy', 2)

// -- CORS -----------------------------------------------------------------
const rawOrigins = process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:5174'
const allowedOrigins = rawOrigins.split(',').map(o => o.trim()).filter(Boolean)
app.use(cors({ origin: allowedOrigins, credentials: true }))

app.use(express.json({ limit: '256kb' }))

// Pas de rate-limit bloquant par IP : plusieurs controleurs a l'entree d'un
// meme evenement peuvent partager la meme passerelle reseau (comme tout le
// trafic public WebView, voir platform/backend), bloquer par IP risquerait
// de bloquer tous les scanners d'un evenement a la fois en cas d'affluence.
// La detection d'abus tourne au niveau de la plateforme
// (platform/backend/src/services/abuseDetector.js).

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
