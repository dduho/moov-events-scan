// Meme correctif que moov-events/src/services/auth.js : deduit le bon
// backend (test vs prod) du chemin de deploiement reel plutot que de
// dependre d'un VITE_SCAN_URL absent en pratique (aucun .env.test/.env.prod
// pour ce frontend), qui faisait sinon toujours retomber sur le backend PROD
// meme depuis la page test.
const _appBase = import.meta.env.BASE_URL || '/'
const _defaultApiPath = _appBase.startsWith('/moov-events-scan-test') ? '/api/moov-events-scan-test' : '/api/moov-events-scan'
const _rawBaseUrl = import.meta.env.VITE_SCAN_URL || _defaultApiPath
const BASE_URL = _rawBaseUrl.startsWith('/') ? window.location.origin + _rawBaseUrl : _rawBaseUrl

// Bug reel constate : ce backend ne transmettait jamais quel moov-events
// (test ou prod) interroger, moovEventsClient.js#baseUrlFor y defaut
// systematiquement sur PROD (voir sa doc). Un code d'acces/ticket cree sur
// l'instance test de moov-events etait donc introuvable ("code d'acces
// invalide") des que la validation passait par le backend PROD de
// moov-events, meme scanne depuis moov-events-scan-test. ENV derive du meme
// chemin de deploiement que BASE_URL ci-dessus (meme principe que
// moov-events/src/services/auth.js).
const ENV = _appBase.startsWith('/moov-events-scan-test') ? 'test' : 'prod'

const CODE_KEY = 'moov-events-scan_code'

export function getStoredCode() {
  return sessionStorage.getItem(CODE_KEY) || ''
}
export function storeCode(code) {
  sessionStorage.setItem(CODE_KEY, code)
}
export function clearStoredCode() {
  sessionStorage.removeItem(CODE_KEY)
}

/**
 * @returns {Promise<{ result: string, ticket?: object, consumedAt?: string }>}
 */
export async function validateScan(code, payload) {
  const res = await fetch(`${BASE_URL}/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, payload, env: ENV }),
  })
  const data = await res.json().catch(() => ({}))
  if (res.status >= 500) throw new Error('Service de validation indisponible.')
  return data
}

/**
 * Alternative au scan QR : validation par le code serie a 8 chiffres saisi a
 * la main (achat USSD, ou QR illisible/perdu).
 * @returns {Promise<{ result: string, ticket?: object, consumedAt?: string }>}
 */
export async function validateSerial(code, serialCode) {
  const res = await fetch(`${BASE_URL}/validate-serial`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, serialCode, env: ENV }),
  })
  const data = await res.json().catch(() => ({}))
  if (res.status >= 500) throw new Error('Service de validation indisponible.')
  return data
}

/**
 * Nom de l'evenement associe a ce code d'acces, affiche dans l'en-tete du
 * scanner (voir ScannerView.vue) au lieu du seul code brut.
 * @returns {Promise<{ ok: boolean, eventTitle?: string, label?: string }>}
 */
export async function getAccessCodeInfo(code) {
  const url = new URL(`${BASE_URL}/access-code-info`)
  url.searchParams.set('code', code)
  url.searchParams.set('env', ENV)
  const res = await fetch(url)
  return res.json().catch(() => ({ ok: false }))
}

/**
 * Historique persistant des scans effectues avec ce code d'acces (survit a
 * un rechargement de page, contrairement aux compteurs de session).
 * @returns {Promise<{ ok: boolean, items?: object[], total?: number, page?: number, pageSize?: number }>}
 */
export async function getScanHistory(code, page = 1, pageSize = 20) {
  const url = new URL(`${BASE_URL}/history`)
  url.searchParams.set('code', code)
  url.searchParams.set('page', page)
  url.searchParams.set('pageSize', pageSize)
  url.searchParams.set('env', ENV)
  const res = await fetch(url)
  return res.json().catch(() => ({ ok: false }))
}
