import { ref, computed, watchEffect } from 'vue'

// Meme convention que moov-events/src/composables/useTheme.js (clef de
// stockage propre a cette app pour ne pas se melanger avec la preference de
// la mini-app d'achat si les deux tournent sur le meme appareil/navigateur).
const STORAGE_KEY = 'moov-events-scan-theme'

// Sombre par defaut (le scanner est souvent utilise en soiree/interieur peu
// eclaire), bascule manuelle vers le clair pour l'usage en plein jour,
// choix retenu entre deux sessions.
const theme = ref(localStorage.getItem(STORAGE_KEY) || 'dark')

watchEffect(() => {
  document.documentElement.dataset.theme = theme.value
  localStorage.setItem(STORAGE_KEY, theme.value)
})

export function useTheme() {
  function toggleTheme() {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }
  const isLight = computed(() => theme.value === 'light')
  return { theme, isLight, toggleTheme }
}
