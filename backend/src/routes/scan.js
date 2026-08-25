'use strict'
const express = require('express')
const router = express.Router()

const { validateScan, validateSerial, cancelScan, getAccessCodeInfo, getScanHistory } = require('../services/moovEventsClient')
const { log, LEVELS, TYPES } = require('../services/activityLogger')

// -- Health check ------------------------------------------------------------
// Servi aussi ICI (en plus de /health en racine, index.js) : apiProxyMode=
// preserve-prefix transmet /api/moov-events-scan/health tel quel au backend,
// sans jamais retirer le prefixe (voir scripts/gen-nginx.js).
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', app: 'moov-events-scan' })
})

// -- POST /validate ------------------------------------------------------------
// Le "code" (code d'acces evenement, cree en backoffice) tient lieu
// d'authentification pour le controleur : pas de compte, pas de mot de
// passe, le code est saisi une fois a la connexion et renvoye a chaque scan.
router.post('/validate', async (req, res) => {
  const start = Date.now()
  const { code, payload, confirm, env } = req.body || {}
  if (!code || !payload) {
    return res.status(400).json({ result: 'invalid', reason: 'missing_params' })
  }

  try {
    const result = await validateScan({ code, payload, confirm, env })
    log({ type: TYPES.scan, level: result.result === 'valid' ? LEVELS.success : LEVELS.warning,
      action: `Scan proxie, resultat=${result.result}`, httpStatus: 200,
      durationMs: Date.now() - start, meta: { code, result: result.result } })
    return res.json(result)
  } catch (err) {
    console.error('[moov-events-scan/validate]', err.message)
    log({ type: TYPES.scan, level: LEVELS.error, action: `Scan proxie echoue, ${err.message}`,
      httpStatus: 502, durationMs: Date.now() - start, meta: { code, error: err.message } })
    return res.status(502).json({ result: 'error', message: 'Service de validation indisponible.' })
  }
})

// -- POST /validate-serial ------------------------------------------------------
// Alternative au scan QR : le controleur saisit a la main le code serie a 8
// chiffres du ticket (achat USSD, ou QR illisible/perdu).
router.post('/validate-serial', async (req, res) => {
  const start = Date.now()
  const { code, serialCode, confirm, env } = req.body || {}
  if (!code || !serialCode) {
    return res.status(400).json({ result: 'invalid', reason: 'missing_params' })
  }

  try {
    const result = await validateSerial({ code, serialCode, confirm, env })
    log({ type: TYPES.scan, level: result.result === 'valid' ? LEVELS.success : LEVELS.warning,
      action: `Validation par code serie, resultat=${result.result}`, httpStatus: 200,
      durationMs: Date.now() - start, meta: { code, result: result.result } })
    return res.json(result)
  } catch (err) {
    console.error('[moov-events-scan/validate-serial]', err.message)
    log({ type: TYPES.scan, level: LEVELS.error, action: `Validation par code serie echouee, ${err.message}`,
      httpStatus: 502, durationMs: Date.now() - start, meta: { code, error: err.message } })
    return res.status(502).json({ result: 'error', message: 'Service de validation indisponible.' })
  }
})

// -- POST /cancel -----------------------------------------------------------------
// Le controleur a annule la confirmation dans la modale (mauvais ticket,
// erreur de manipulation...) : rien n'a jamais ete consomme, simple audit.
router.post('/cancel', async (req, res) => {
  const { code, ticket, env } = req.body || {}
  if (!code) return res.status(400).json({ ok: false, reason: 'missing_params' })

  try {
    const result = await cancelScan({ code, ticket, env })
    return res.json(result)
  } catch (err) {
    console.error('[moov-events-scan/cancel]', err.message)
    return res.status(502).json({ ok: false })
  }
})

// -- GET /access-code-info -------------------------------------------------------
// Nom de l'evenement associe au code d'acces (en-tete du scanner, voir
// ScannerView.vue), au lieu du seul code brut.
router.get('/access-code-info', async (req, res) => {
  const { code, env } = req.query || {}
  if (!code) return res.status(400).json({ ok: false, reason: 'missing_params' })
  try {
    const result = await getAccessCodeInfo({ code, env })
    return res.json(result)
  } catch (err) {
    console.error('[moov-events-scan/access-code-info]', err.message)
    return res.status(502).json({ ok: false, message: 'Service indisponible.' })
  }
})

// -- GET /history -----------------------------------------------------------------
// Historique persistant des scans effectues avec ce code d'acces (voir
// activityLogger.js#getScanHistoryForCode cote moov-events) : contrairement
// aux compteurs de session du frontend, survit a un rechargement de page.
router.get('/history', async (req, res) => {
  const { code, page, pageSize, env } = req.query || {}
  if (!code) return res.status(400).json({ ok: false, reason: 'missing_params' })
  try {
    const result = await getScanHistory({ code, page, pageSize, env })
    return res.json(result)
  } catch (err) {
    console.error('[moov-events-scan/history]', err.message)
    return res.status(502).json({ ok: false, message: 'Service indisponible.' })
  }
})

module.exports = router
