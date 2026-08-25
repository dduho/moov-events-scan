<template>
  <div class="min-h-dvh flex flex-col relative z-10">
    <header class="glass mx-3 mt-3 rounded-2xl px-4 py-3 flex items-center justify-between">
      <div>
        <p class="font-display font-bold text-sm">Code {{ code }}</p>
        <p class="text-[11px]" style="color:var(--text-tertiary);">{{ scannedCount }} scan(s) cette session</p>
      </div>
      <button type="button" class="btn-ghost text-xs px-3 py-2" @click="$emit('logout')">Changer</button>
    </header>

    <div class="flex-1 flex flex-col items-center justify-center px-5 py-6">
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

    <ResultOverlay :result="lastResult?.result" :ticket="lastResult?.ticket" @dismiss="dismissResult" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { Html5Qrcode } from 'html5-qrcode'
import ResultOverlay from './ResultOverlay.vue'
import { validateScan, validateSerial } from '../services/scan'

const props = defineProps({ code: { type: String, required: true } })
defineEmits(['logout'])

let scanner = null
let paused = false
let dismissTimer = null

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

function recordResult(data) {
  lastResult.value = data
  if (data.result === 'valid') counts.valid++
  else if (data.result === 'already_used') counts.already_used++
  else counts.rejected++
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
    recordResult(data)
  } catch {
    recordResult({ result: 'error' })
  }
}

function dismissResult() {
  lastResult.value = null
  paused = false
  clearTimeout(dismissTimer)
}

async function startCamera() {
  scanner = new Html5Qrcode('qr-reader')
  try {
    await scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 240, height: 240 } },
      onDecoded,
      () => {}, // echec de decodage par frame, normal en continu, ignore
    )
  } catch (err) {
    console.error('[scanner] impossible de demarrer la camera', err)
  }
}

// La camera est coupee pendant la saisie manuelle (le <div id="qr-reader">
// disparait du DOM via v-if, html5-qrcode ne peut pas continuer a filmer un
// element demonte) et redemarree au retour au mode scan.
watch(manualMode, async (isManual) => {
  if (isManual) {
    await scanner?.stop().catch(() => {})
    scanner = null
  } else {
    await nextTick()
    await startCamera()
  }
})

onMounted(startCamera)

onBeforeUnmount(() => {
  clearTimeout(dismissTimer)
  scanner?.stop().catch(() => {})
})
</script>
