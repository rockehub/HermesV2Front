<template>
  <div id="root" class="min-h-100vh flex grow bg-slate-50 dark:bg-navy-900" v-cloak>
    <preloader v-if="!componentsReady || !globalState.isReady"></preloader>
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue'
import { useGlobalState, useAuthStore } from '@/stores/stores'
import Preloader from '@/components/generic/Preloader.vue'

const globalState = useGlobalState()
const auth = useAuthStore()

const componentsReady = ref(false)

const updateTheme = () => {
  if (globalState.isDarkMode) {
    document.documentElement.classList.add('dark')
    document.body.setAttribute('data-theme', 'dark')
  } else {
    document.documentElement.classList.remove('dark')
    document.body.setAttribute('data-theme', 'light')
  }
}

const updateMonoChrome = () => {
  if (globalState.isMonoChrome) {
    document.body.classList.add('is-monochrome')
  } else {
    document.body.classList.remove('is-monochrome')
  }
}

watch(
  globalState,
  () => {
    componentsReady.value = !!globalState.isReady
  },
  { immediate: true, deep: true }
)

watch(
  () => globalState.isDarkMode,
  () => {
    updateTheme()
  }
)

watch(
  () => globalState.isMonoChrome,
  () => {
    updateMonoChrome()
  }
)

onMounted(async () => {
  await nextTick()
  componentsReady.value = true
  updateTheme()
  updateMonoChrome()
})
</script>

<style></style>
