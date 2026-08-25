<template>
  <div class="min-h-dvh flex flex-col relative z-10">
    <header class="glass mx-3 mt-3 rounded-2xl px-4 py-3 flex items-center justify-between">
      <div class="min-w-0">
        <p class="font-display font-bold text-sm truncate">{{ eventTitle || `Code ${code}` }}</p>
        <p class="text-[11px]" style="color:var(--text-tertiary);">
          {{ eventTitle ? `Code ${code} · ` : '' }}{{ scannedCount }} scan(s) cette session
        </p>
      </div>
      <div class="flex items-center gap-1.5 shrink-0">
        <button type="button" class="btn-ghost text-xs px-3 py-2" @click="openHistory">Historique</button>
        <button type="button" class="btn-ghost text-xs px-3 py-2" @click="$emit('logout')">Changer</button>
      </div>
    </header>

    <!-- Historique persistant des scans effectues avec ce code (survit a un
         rechargement de page, contrairement aux compteurs de session
         ci-dessous), demande explicite : ne pas se limiter a la session. -->
    <div v-if="historyMode" class="flex-1 px-3 py-4 overflow-y-auto">
      <div v-if="historyLoading" class="text-center py-10 text-sm" style="color:var(--text-tertiary);">Chargement…</div>
      <div v-else-if="!history.length" class="text-center py-10 text-sm" style="color:var(--text-tertiary);">Aucun scan enregistre pour ce code.</div>
      <div v-else class="space-y-2">
        <div v-for="h in history" :key="h.id" class="glass rounded-xl px-3 py-2.5 flex items-center justify-between gap-3">
          <div class="min-w-0">
            <p class="text-xs font-semibold truncate">{{ h.action }}</p>
            <p class="text-[10px]" style="color:var(--text-tertiary);">{{ formatDate(h.timestamp) }}</p>
          </div>
          <span class="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full shrink-0" :class="historyBadgeClass(h.meta?.result)">
            {{ historyResultLabel(h.meta?.result) }}
          </span>
        </div>
      </div>
      <button type="button" class="btn-ghost w-full text-xs px-4 py-2 mt-4" @click="historyMode = false">
        Revenir au scan
      </button>
    </div>

    <div v-else class="flex-1 flex flex-col items-center justify-center px-5 py-6">
      <template v-if="!manualMode">
        <div class="scan-frame w-full max-w-sm aspect-square relative">
          <div id="qr-reader" class="w-full h-full"></div>
          <div class="scan-line"></div>
        </div>
        <p class="text-xs mt-5 text-center max-w-xs" style="color:var(--text-secondary);">
          Cadrez le QR code du ticket dans la zone.
        </p>
        <button type="button" class="btn-ghost text-xs px-4 py-2 mt-4" @click="manualMode = true">
          Pas de QR ? Saisir le code
        </button>
      </template>

      <template v-else>
        <div class="w-full max-w-sm text-center">
          <p class="text-sm mb-4" style="color:var(--text-secondary);">
            Entrez le code de secours a 8 chiffres remis au client (achat sans QR, ex. par USSD).
          </p>
          <form class="space-y-3" @submit.prevent="submitManual">
            <input
              v-model="manualCode"
              type="text"
              inputmode="numeric"
              maxlength="9"
              class="input-glass w-full text-center font-future tracking-[0.25em] text-lg"
              placeholder="0000 0000"
              autofocus
              @input="onManualInput"
            />
            <button type="submit" class="btn-accent w-full" :disabled="manualCode.replace(/\D/g,'').length !== 8 || manualSubmitting">
              {{ manualSubmitting ? 'Verification…' : 'Valider le ticket' }}
            </button>
          </form>
          <button type="button" class="btn-ghost text-xs px-4 py-2 mt-4" @click="manualMode = false">
            Revenir au scan camera
          </button>
        </div>
      </template>

      <div class="flex items-center gap-4 mt-6 text-center">
        <div>
          <p class="font-future text-lg font-bold text-emerald-400">{{ counts.valid }}</p>
          <p class="text-[10px] uppercase tracking-wide" style="color:var(--text-tertiary);">Valides</p>
        </div>
        <div class="w-px h-8" style="background:var(--border);"></div>
        <div>
          <p class="font-future text-lg font-bold text-amber-400">{{ counts.already_used }}</p>
          <p class="text-[10px] uppercase tracking-wide" style="color:var(--text-tertiary);">Deja utilises</p>
        </div>
        <div class="w-px h-8" style="background:var(--border);"></div>
        <div>
          <p class="font-future text-lg font-bold text-red-400">{{ counts.rejected }}</p>
          <p class="text-[10px] uppercase tracking-wide" style="color:var(--text-tertiary);">Rejetes</p>
        </div>
      </div>
    </div>

    <ResultOverlay :result="lastResult?.result" :ticket="lastResult?.ticket" @dismiss="dismissResult(true)" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { Html5Qrcode } from 'html5-qrcode'
import ResultOverlay from './ResultOverlay.vue'
import { validateScan, validateSerial, getAccessCodeInfo, getScanHistory } from '../services/scan'

const props = defineProps({ code: { type: String, required: true } })
defineEmits(['logout'])

const eventTitle = ref('')
const historyMode = ref(false)
const historyLoading = ref(false)
const history = ref([])

const HISTORY_LABELS = {
  valid: 'Valide', already_used: 'Deja utilise', invalid: 'Invalide',
  invalid_code: 'Code invalide', wrong_event: 'Mauvais evenement', void: 'Annule', error: 'Erreur',
}
function historyResultLabel(result) { return HISTORY_LABELS[result] || result || '?' }
function historyBadgeClass(result) {
  if (result === 'valid') return 'bg-emerald-500/15 text-emerald-400'
  if (result === 'already_used') return 'bg-amber-500/15 text-amber-400'
  return 'bg-red-500/15 text-red-400'
}
function formatDate(ts) {
  return new Date(ts).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

async function openHistory() {
  historyMode.value = true
  historyLoading.value = true
  try {
    const data = await getScanHistory(props.code, 1, 20)
    history.value = data.ok ? data.items : []
  } catch {
    history.value = []
  } finally {
    historyLoading.value = false
  }
}

let scanner = null
let paused = false
let dismissTimer = null
// La camera decode en continu (fps:10) : un meme QR reste immobile dans le
// cadre pendant tout l'affichage du resultat (2.2s), donc onDecoded est
// rappele plusieurs fois pour le MEME code avant que le controleur n'ait
// bouge le telephone. On revalide bien a chaque fois (le ticket peut avoir
// change d'etat entre deux scans, ex. valide -> deja_utilise si quelqu'un
// d'autre l'a scanne entre-temps), mais on ne recompte dans les compteurs
// (Valides/Deja utilises/Rejetes) que lorsque le RESULTAT differe du dernier
// scan de ce meme code : un ticket deja_utilise reste deja_utilise a chaque
// nouvelle image, ca ne doit pas incrementer le compteur a chaque frame.
let lastCode = null
let lastResultForCode = null

const lastResult = ref(null)
const scannedCount = ref(0)
const counts = reactive({ valid: 0, already_used: 0, rejected: 0 })

const manualMode = ref(false)
const manualCode = ref('')
const manualSubmitting = ref(false)

function onManualInput() {
  // Espace tous les 4 chiffres pour la lisibilite, meme convention que
  // l'affichage web du code (voir moov-events/src/components/QrTicket.vue).
  const digits = manualCode.value.replace(/\D/g, '').slice(0, 8)
  manualCode.value = digits.replace(/(\d{4})(?=\d)/, '$1 ')
}

function recordResult(data, { count = true } = {}) {
  lastResult.value = data
  if (count) {
    if (data.result === 'valid') counts.valid++
    else if (data.result === 'already_used') counts.already_used++
    else counts.rejected++
  }
  clearTimeout(dismissTimer)
  dismissTimer = setTimeout(dismissResult, 2200)
}

async function submitManual() {
  const digits = manualCode.value.replace(/\D/g, '')
  if (digits.length !== 8 || manualSubmitting.value) return
  manualSubmitting.value = true
  scannedCount.value++
  try {
    const data = await validateSerial(props.code, digits)
    recordResult(data)
  } catch {
    recordResult({ result: 'error' })
  } finally {
    manualSubmitting.value = false
    manualCode.value = ''
  }
}

async function onDecoded(decodedText) {
  if (paused) return
  paused = true
  scannedCount.value++

  try {
    const data = await validateScan(props.code, decodedText)
    const isRepeat = decodedText === lastCode && data.result === lastResultForCode
    lastCode = decodedText
    lastResultForCode = data.result
    recordResult(data, { count: !isRepeat })
  } catch {
    recordResult({ result: 'error' }, { count: decodedText !== lastCode || lastResultForCode !== 'error' })
    lastCode = decodedText
    lastResultForCode = 'error'
  }
}

function dismissResult() {
  lastResult.value = null
  paused = false
  clearTimeout(dismissTimer)
}

// Bug reel constate : un qrbox fixe {width:240,height:240} n'est carre que si
// le flux video l'est aussi. html5-qrcode le redimensionne pour tenir dans le
// viewfinder reel (souvent large/paysage, quelle que soit sa presentation CSS
// via aspect-square), produisant un rectangle plutot qu'un carre alors que le
// QR lui-meme est toujours carre. Une fonction qrbox (recalculee a partir des
// dimensions REELLES du viewfinder au demarrage) garantit un carre quel que
// soit le telephone/l'orientation.
function squareQrbox(viewfinderWidth, viewfinderHeight) {
  const minEdge = Math.min(viewfinderWidth, viewfinderHeight)
  const size = Math.floor(minEdge * 0.7)
  return { width: size, height: size }
}

async function startCamera() {
  scanner = new Html5Qrcode('qr-reader')
  try {
    await scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: squareQrbox },
      onDecoded,
      () => {}, // echec de decodage par frame, normal en continu, ignore
    )
    applyZoomIfAvailable()
  } catch (err) {
    console.error('[scanner] impossible de demarrer la camera', err)
  }
}

// Bug reel constate : sur les telephones a plusieurs objectifs arriere,
// facingMode:'environment' seul choisit parfois l'ultra grand-angle (image
// trop dezoomee, QR minuscule dans le cadre). Le zoom optique n'est pas
// pilotable depuis le web, mais un zoom numerique via la contrainte MediaTrack
// standard "zoom" (supportee par la plupart des Android/Chrome, absente sur
// iOS Safari, d'ou le garde-fou capabilities.zoom) recadre l'image de facon
// equivalente pour la lecture du QR. Best-effort, jamais bloquant si absent.
function applyZoomIfAvailable() {
  try {
    const capabilities = scanner?.getRunningTrackCapabilities?.()
    if (!capabilities?.zoom) return
    const desired = Math.min(2, capabilities.zoom.max ?? 1)
    if (desired > (capabilities.zoom.min ?? 1)) {
      scanner.applyVideoConstraints({ advanced: [{ zoom: desired }] })
    }
  } catch (err) {
    console.error('[scanner] zoom non applique', err)
  }
}

// La camera est coupee pendant la saisie manuelle ou l'affichage de
// l'historique (le <div id="qr-reader"> disparait du DOM via v-if,
// html5-qrcode ne peut pas continuer a filmer un element demonte) et
// redemarree au retour a l'ecran de scan.
watch(manualMode, async (isManual) => {
  if (isManual) {
    await scanner?.stop().catch(() => {})
    scanner = null
  } else if (!historyMode.value) {
    await nextTick()
    await startCamera()
  }
})

watch(historyMode, async (isHistory) => {
  if (isHistory) {
    await scanner?.stop().catch(() => {})
    scanner = null
  } else if (!manualMode.value) {
    await nextTick()
    await startCamera()
  }
})

onMounted(async () => {
  startCamera()
  try {
    const info = await getAccessCodeInfo(props.code)
    if (info.ok) eventTitle.value = info.eventTitle || ''
  } catch { /* best-effort, garde le code brut en fallback */ }
})

onBeforeUnmount(() => {
  clearTimeout(dismissTimer)
  scanner?.stop().catch(() => {})
})
</script>
