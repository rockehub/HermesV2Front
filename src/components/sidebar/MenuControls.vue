<template>
  <!-- Toggle modo configuração -->
  <button
    class="btn h-8 w-8 rounded-full p-0 transition-colors duration-200"
    :class="isConfigMode
      ? 'bg-warning/15 text-warning hover:bg-warning/25'
      : 'hover:bg-slate-300/20 dark:hover:bg-navy-300/20 text-slate-500 dark:text-navy-100'"
    :title="isConfigMode ? 'Sair da configuração de menu' : 'Configurar menu'"
    @click="menuStore.toggleConfigMode()"
  >
    <em class="fa-solid fa-pen-ruler text-sm"></em>
  </button>

  <!-- Indicador de modo configuração -->
  <Transition name="config-pill">
    <span
      v-if="isConfigMode"
      class="hidden sm:inline-flex items-center rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-bold text-warning tracking-wider"
    >
      CONFIG
    </span>
  </Transition>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useMenuStore } from '@/stores/menuStore'

const menuStore = useMenuStore()
const isConfigMode = computed(() => menuStore.isConfigMode)
</script>

<style scoped>
.config-pill-enter-active,
.config-pill-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.config-pill-enter-from,
.config-pill-leave-to {
  opacity: 0;
  transform: scale(0.8);
}
</style>
