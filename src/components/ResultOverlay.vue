<template>
  <transition name="result-pop">
    <div v-if="result" class="fixed inset-0 z-40 flex items-center justify-center px-6" style="background:rgba(6,6,12,0.88);backdrop-filter:blur(6px);" @click="$emit('dismiss')">
      <div class="glass rounded-3xl p-8 text-center max-w-xs w-full" :style="borderStyle" @click.stop>
        <div class="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" :style="iconBg">
          <svg v-if="config.icon === 'check'" class="w-8 h-8" :style="{ color: config.color }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="m5 13 4 4L19 7"/>
          </svg>
          <svg v-else-if="config.icon === 'clock'" class="w-8 h-8" :style="{ color: config.color }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <circle cx="12" cy="12" r="9"/><path stroke-linecap="round" d="M12 7v5l3 3"/>
          </svg>
          <svg v-else class="w-8 h-8" :style="{ color: config.color }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <circle cx="12" cy="12" r="9"/><path stroke-linecap="round" d="M15 9l-6 6m0-6 6 6"/>
          </svg>
        </div>
        <h2 class="font-display text-lg font-bold mb-1">{{ config.title }}</h2>
        <p class="text-sm" style="color:var(--text-secondary);">{{ config.subtitle }}</p>
        <p v-if="ticket?.label" class="text-xs mt-3 font-future tracking-wide" style="color:var(--text-tertiary);">
          {{ ticket.label }} · {{ ticket.eventTitle }}
        </p>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  result: { type: String, default: '' },
  consumedAt: { type: String, default: '' },
  ticket: { type: Object, default: null },
})
defineEmits(['dismiss'])

const CONFIGS = {
  valid:        { icon: 'check', color: '#22c55e', border: 'rgba(34,197,94,0.4)', bg: 'rgba(34,197,94,0.15)', title: 'Ticket valide', subtitle: 'Entree autorisee.' },
  already_used: { icon: 'clock', color: '#f59e0b', border: 'rgba(245,158,11,0.4)', bg: 'rgba(245,158,11,0.15)', title: 'Deja utilise', subtitle: 'Ce ticket a deja ete scanne.' },
  invalid:      { icon: 'cross', color: '#ef4444', border: 'rgba(239,68,68,0.4)', bg: 'rgba(239,68,68,0.15)', title: 'QR invalide', subtitle: 'Ce code ne correspond a aucun ticket.' },
  invalid_code: { icon: 'cross', color: '#ef4444', border: 'rgba(239,68,68,0.4)', bg: 'rgba(239,68,68,0.15)', title: 'Code d\'acces invalide', subtitle: 'Ce code a ete revoque ou n\'existe pas.' },
  wrong_event:  { icon: 'cross', color: '#ef4444', border: 'rgba(239,68,68,0.4)', bg: 'rgba(239,68,68,0.15)', title: 'Mauvais evenement', subtitle: 'Ce ticket appartient a un autre evenement.' },
  void:         { icon: 'cross', color: '#ef4444', border: 'rgba(239,68,68,0.4)', bg: 'rgba(239,68,68,0.15)', title: 'Ticket annule', subtitle: 'Ce ticket n\'est plus valable.' },
  error:        { icon: 'cross', color: '#ef4444', border: 'rgba(239,68,68,0.4)', bg: 'rgba(239,68,68,0.15)', title: 'Erreur', subtitle: 'Reessayez dans un instant.' },
}

const config = computed(() => CONFIGS[props.result] || CONFIGS.error)
const borderStyle = computed(() => ({ border: `1px solid ${config.value.border}`, boxShadow: `0 0 40px -8px ${config.value.border}` }))
const iconBg = computed(() => ({ background: config.value.bg }))
</script>
