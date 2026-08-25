<template>
  <div class="min-h-dvh flex flex-col items-center justify-center px-6 text-center relative z-10">
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

const emit = defineEmits(['connected'])
const code = ref('')

function submit() {
  if (!code.value) return
  emit('connected', code.value.trim().toUpperCase())
}
</script>
