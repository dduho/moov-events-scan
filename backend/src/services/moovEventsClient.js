'use strict'
// Proxy interne vers moov-events : ce backend ne touche jamais la base de
// donnees des tickets directement, il delegue toute la logique de validation
// (signature QR, lookup, consommation atomique) a moov-events, qui reste la
// seule source de verite. Le prod et le test de moov-events ecoutent sur des
// ports differents (voir .env.example), tous deux joignables en local.

function baseUrlFor(env) {
  return env === 'test'
    ? (process.env.MOOV_EVENTS_INTERNAL_URL_TEST || 'http://localhost:3310')
    : (process.env.MOOV_EVENTS_INTERNAL_URL || 'http://localhost:3210')
}

/**
 * @param {{ code: string, payload: string, env?: 'prod'|'test' }} params
 * @returns {Promise<object>} la reponse telle que renvoyee par
 *   moov-events (voir backend/src/routes/internal.js:/scan/validate)
 */
async function validateScan({ code, payload, env }) {
  const secret = process.env.SCAN_SERVICE_SECRET
  if (!secret) throw new Error('SCAN_SERVICE_SECRET non configure')

  const res = await fetch(`${baseUrlFor(env)}/internal/scan/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-scan-secret': secret },
    body: JSON.stringify({ code, payload }),
  })
  const data = await res.json().catch(() => ({}))
  if (res.status >= 500) {
    throw new Error(data.result === 'error' ? 'moov-events indisponible' : `HTTP ${res.status}`)
  }
  return data
}

/**
 * Alternative au scan QR : validation par le code serie a 8 chiffres saisi a
 * la main par le controleur (voir CodeEntry manuel dans ScannerView.vue).
 * @param {{ code: string, serialCode: string, env?: 'prod'|'test' }} params
 * @returns {Promise<object>} la reponse telle que renvoyee par
 *   moov-events (voir backend/src/routes/internal.js:/scan/validate-serial)
 */
async function validateSerial({ code, serialCode, env }) {
  const secret = process.env.SCAN_SERVICE_SECRET
  if (!secret) throw new Error('SCAN_SERVICE_SECRET non configure')

  const res = await fetch(`${baseUrlFor(env)}/internal/scan/validate-serial`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-scan-secret': secret },
    body: JSON.stringify({ code, serialCode }),
  })
  const data = await res.json().catch(() => ({}))
  if (res.status >= 500) {
    throw new Error(data.result === 'error' ? 'moov-events indisponible' : `HTTP ${res.status}`)
  }
  return data
}

module.exports = { validateScan, validateSerial }
