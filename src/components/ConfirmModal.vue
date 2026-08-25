<!--
  Modale de confirmation avant consommation reelle du ticket (demande
  explicite : eviter qu'une erreur de manipulation - mauvais ticket, scan
  accidentel - ne valide directement l'entree sans verification humaine).
  Le ticket n'a encore JAMAIS ete consomme a ce stade (voir 'pending_confirm'
  cote backend, resolveAndConsume) : "Annuler" n'a donc aucun effet a
  defaire, "Confirmer" declenche la consommation reelle.
-->
<template>
  <transition name="result-pop">
    <div v-if="ticket" class="fixed inset-0 z-40 flex items-center justify-center px-6" style="background:rgba(6,6,12,0.88);backdrop-filter:blur(6px);">
      <div class="glass rounded-3xl p-8 text-center max-w-xs w-full" style="border:1px solid rgba(255,122,26,0.4);box-shadow:0 0 40px -8px rgba(255,122,26,0.4);">
        <div class="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style="background:rgba(255,122,26,0.15);">
          <svg class="w-8 h-8 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 21s-7-6.5-7-11a7 7 0 1 1 14 0c0 4.5-7 11-7 11Z"/><circle cx="12" cy="10" r="2.5"/>
          </svg>
        </div>
        <h2 class="font-display text-lg font-bold mb-1">Confirmer l'entrée ?</h2>
        <p class="text-sm mb-4" style="color:var(--text-secondary);">Vérifiez le ticket avant de valider.</p>

        <div class="glass rounded-2xl p-3.5 text-left mb-5 space-y-0.5">
          <p class="text-[10px] font-bold uppercase tracking-wider text-accent">{{ ticket.label || 'Ticket' }}</p>
          <p class="text-sm font-semibold truncate">{{ ticket.eventTitle }}</p>
        </div>

        <div class="flex gap-2">
          <button type="button" class="btn-ghost flex-1" :disabled="confirming" @click="$emit('cancel')">
            Annuler
          </button>
          <button type="button" class="btn-accent flex-1" :disabled="confirming" @click="$emit('confirm')">
            {{ confirming ? 'Validation…' : 'Confirmer' }}
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
defineProps({
  ticket: { type: Object, default: null },
  confirming: { type: Boolean, default: false },
})
defineEmits(['confirm', 'cancel'])
</script>
