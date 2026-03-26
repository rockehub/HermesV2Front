<template>
  <div class="flex pt-4">
    <a href="/public" class="flex items-center justify-center gap-2">
      <img
        v-show="!darkMode.isDarkMode"
        class="w-10 transition-transform duration-500 ease-in-out hover:rotate-[360deg]"
        src="@/assets/images/brand/logo-dark.png"
        alt="logo"
      />
      <img
        v-show="darkMode.isDarkMode"
        class="w-10 transition-transform duration-500 ease-in-out hover:rotate-[360deg]"
        src="@/assets/images/brand/logo-light.png"
        alt="logo"
      />
      <p v-if="isExpanded" class="text-xl font-semibold uppercase text-slate-700 dark:text-navy-100">havix</p>
    </a>
  </div>
</template>
<script setup lang="ts">
import { useGlobalState } from '@/stores/stores'
import { computed } from 'vue'
import { useMenuStore } from '@/stores/menuStore'
const darkMode = useGlobalState()
const menuStore = useMenuStore()
const isExpanded = computed(() => menuStore.sidebarFormat === 'expanded')
</script>