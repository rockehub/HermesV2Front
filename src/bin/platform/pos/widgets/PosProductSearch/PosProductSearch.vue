<script lang="ts" setup>
import { ref, watch } from 'vue'
import { usePosApi } from '../../composables/usePosApi'
import { usePosStore } from '../../store/usePosStore'
import { useDebounceFn } from '@vueuse/core'

const props = defineProps<{ configuration?: Record<string, any> }>()
const api = usePosApi()
const posStore = usePosStore()

const query = ref('')
const results = ref<any[]>([])
const loading = ref(false)

const doSearch = useDebounceFn(async () => {
  if (!query.value.trim()) {
    results.value = []
    return
  }
  loading.value = true
  try {
    const params: Record<string, any> = {}
    if (props.configuration?.defaultCategoryId) {
      params.categoryIds = [props.configuration.defaultCategoryId]
    }
    const res = await api.searchProducts(query.value, params)
    results.value = res.data?.hits ?? []
  } finally {
    loading.value = false
  }
}, 300)

watch(query, doSearch)

async function addToCart(hit: any) {
  await posStore.addItem(hit.id, null, 1)
}

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
</script>

<template>
  <div class="flex h-full flex-col bg-white dark:bg-navy-750 rounded-lg overflow-hidden">
    <!-- Search input -->
    <div class="border-b border-slate-100 dark:border-navy-700 px-4 py-3">
      <div class="relative">
        <em class="fa-light fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none"></em>
        <input
          v-model="query"
          type="text"
          placeholder="Buscar produto por nome, SKU..."
          class="form-input w-full rounded-lg border border-slate-200 dark:border-navy-600 bg-white dark:bg-navy-700 py-2 pl-9 pr-4 text-sm text-slate-700 dark:text-navy-100 placeholder:text-slate-400 focus:border-primary focus:outline-none"
        />
        <em v-if="loading" class="fa-duotone fa-spinner-third fa-spin absolute right-3 top-1/2 -translate-y-1/2 text-primary text-sm"></em>
      </div>
    </div>

    <!-- Results -->
    <div class="flex-1 overflow-y-auto is-scrollbar-hidden">
      <!-- Empty query -->
      <div v-if="!query.trim()" class="flex flex-col items-center justify-center h-full text-slate-400 dark:text-navy-400 p-6">
        <em class="fa-light fa-magnifying-glass text-3xl mb-2 opacity-30"></em>
        <p class="text-xs">Digite para buscar produtos</p>
      </div>

      <!-- No results -->
      <div v-else-if="!loading && results.length === 0" class="flex flex-col items-center justify-center h-full text-slate-400 p-6">
        <em class="fa-light fa-box-open text-3xl mb-2 opacity-30"></em>
        <p class="text-xs">Nenhum produto encontrado</p>
      </div>

      <!-- Product cards -->
      <div v-else class="grid grid-cols-2 gap-2 p-3">
        <button
          v-for="hit in results"
          :key="hit.id"
          class="group flex flex-col rounded-lg border border-slate-100 dark:border-navy-700 p-3 text-left transition-all hover:border-primary/40 hover:bg-primary/5 dark:hover:bg-navy-700 active:scale-95"
          @click="addToCart(hit)"
        >
          <span class="text-xs font-medium text-slate-700 dark:text-navy-100 line-clamp-2 leading-tight">{{ hit.name }}</span>
          <div class="mt-2 flex items-center justify-between gap-2">
            <span class="text-sm font-semibold text-primary">{{ formatPrice(hit.price) }}</span>
            <span
              v-if="hit.inStock"
              class="rounded-full bg-success/10 px-1.5 py-0.5 text-[10px] font-medium text-success"
            >
              em estoque
            </span>
            <span v-else class="rounded-full bg-error/10 px-1.5 py-0.5 text-[10px] font-medium text-error">
              sem estoque
            </span>
          </div>
          <em class="fa-solid fa-plus mt-2 self-end rounded-full bg-primary/10 p-1 text-[9px] text-primary opacity-0 transition-opacity group-hover:opacity-100"></em>
        </button>
      </div>
    </div>
  </div>
</template>
