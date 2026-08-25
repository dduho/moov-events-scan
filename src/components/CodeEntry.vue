<template>
  <div class="min-h-dvh flex flex-col items-center justify-center px-6 text-center relative z-10">
    <button type="button"
      class="fixed top-3 right-3 z-20 w-10 h-10 rounded-xl glass flex items-center justify-center transition-transform duration-200 active:scale-90"
      style="color:var(--text-secondary);"
      :title="isLight ? 'Passer en theme sombre' : 'Passer en theme clair'"
      @click="toggleTheme"
    >
      <svg v-if="isLight" class="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"/>
      </svg>
      <svg v-else class="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="4"/>
        <path stroke-linecap="round" d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32 1.41-1.41"/>
      </svg>
    </button>

    <div class="w-20 h-20 rounded-3xl bg-gradient-to-br from-accent to-violet flex items-center justify-center mb-6 shadow-glow pulse-ring">
      <svg class="w-9 h-9" viewBox="0 0 24 24" fill="none" stroke="#0a0510" stroke-width="2">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM14 21h3M21 14v3M18 21h3v-3"/>
      </svg>
    </div>
    <h1 class="font-display text-2xl font-extrabold mb-1.5">Moov Events <span class="text-accent">Scan</span></h1>
    <p class="text-sm max-w-xs mb-8" style="color:var(--text-secondary);">
      Entrez le code d'acces remis pour cet evenement.
    </p>

    <form class="w-full max-w-xs space-y-3" @submit.prevent="submit">
      <input
        v-model="code"
        type="text"
        class="input-glass w-full text-center font-future tracking-[0.3em] uppercase text-lg"
        maxlength="8"
        placeholder="CODE"
        autofocus
      />
      <button type="submit" class="btn-accent w-full" :disabled="!code">
        Demarrer le scan
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useTheme } from '../composables/useTheme'

const { isLight, toggleTheme } = useTheme()
const emit = defineEmits(['connected'])
const code = ref('')

function submit() {
  if (!code.value) return
  emit('connected', code.value.trim().toUpperCase())
}
</script>
