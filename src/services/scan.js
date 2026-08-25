const _rawBaseUrl = import.meta.env.VITE_SCAN_URL || '/api/moov-events-scan'
const BASE_URL = _rawBaseUrl.startsWith('/') ? window.location.origin + _rawBaseUrl : _rawBaseUrl

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
    body: JSON.stringify({ code, payload }),
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
    body: JSON.stringify({ code, serialCode }),
  })
  const data = await res.json().catch(() => ({}))
  if (res.status >= 500) throw new Error('Service de validation indisponible.')
  return data
}
