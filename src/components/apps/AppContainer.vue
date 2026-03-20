<template>
  <div class="is-scrollbar-hidden mt-3 flex space-x-4 overflow-x-auto px-3">
    <router-link :to="app" class="w-14 text-center" v-for="app in appList" :key="app.name">
      <div class="avatar h-12 w-12">
        <div class="is-initial rounded-full bg-success text-white">
          <span class="material-icons">{{ app.icon }}</span>
        </div>
      </div>
      <p
        class="mt-1.5 overflow-hidden text-ellipsis whitespace-nowrap text-xs text-slate-700 dark:text-navy-100"
      >
        {{ app.label }}
      </p>
    </router-link>
  </div>
</template>
<script setup lang="ts">
import { ref, watch, computed, getCurrentInstance } from 'vue'
import { useSearchStore } from '@/stores/search'
import type { MenuItem } from '@/types/global.d'

// store
const searchStore = useSearchStore()

// acessar globalProperties ($menu)
const { proxy } = getCurrentInstance() as any
const menu = proxy.$menu as MenuItem[]

// state
const appList = ref<MenuItem[]>(menu.slice(0, 5))

// watch
watch(
  () => searchStore.searchQuery,
  (val) => {
    appList.value = menu.filter((plugin: MenuItem) =>
      plugin.name.toLowerCase().includes(val.toLowerCase())
    )
  }
)
</script>
