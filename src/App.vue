<template>
  <div class="ambient-bg"></div>
  <CodeEntry v-if="!code" @connected="onConnected" />
  <ScannerView v-else :code="code" @logout="onLogout" />
</template>

<script setup>
import { ref, onMounted } from 'vue'
import CodeEntry from './components/CodeEntry.vue'
import ScannerView from './components/ScannerView.vue'
import { getStoredCode, storeCode, clearStoredCode } from './services/scan'

const code = ref('')

function onConnected(value) {
  storeCode(value)
  code.value = value
}

function onLogout() {
  clearStoredCode()
  code.value = ''
}

onMounted(() => {
  code.value = getStoredCode()
})
</script>
