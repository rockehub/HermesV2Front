<script lang="ts" setup>
import { ref, onMounted, watch } from 'vue'
import { usePosApi } from '../../composables/usePosApi'
import { usePosStore, type PosProductVariant, type PosSearchProduct } from '../../store/usePosStore'
import VariantSelectorModal from '../../components/VariantSelectorModal.vue'

const props = defineProps<{ configuration?: Record<string, any> }>()
const api = usePosApi()
const posStore = usePosStore()

const products = ref<PosSearchProduct[]>([])
const loading = ref(true)
const selectedProduct = ref<PosSearchProduct | null>(null)
const selectorOpen = ref(false)

async function loadProducts() {
  loading.value = true
  try {
    const params: Record<string, any> = { size: 24, sort: 'sales' }
    if (props.configuration?.categoryId) {
      params.categoryIds = [props.configuration.categoryId]
    }
    const res = await api.searchProducts('', params)
    products.value = res.data?.hits ?? []
  } finally {
    loading.value = false
  }
}

onMounted(loadProducts)
watch(() => props.configuration?.categoryId, loadProducts)

async function addProduct(product: PosSearchProduct) {
  if (product.requiresVariantSelection && (product.variants?.length ?? 0) > 0) {
    selectedProduct.value = product
    selectorOpen.value = true
    return
  }
  await posStore.addItem(product.id, null, 1)
}

async function confirmVariant(variant: PosProductVariant) {
  if (!selectedProduct.value) return
  await posStore.addItem(selectedProduct.value.id, variant.id, 1)
  selectorOpen.value = false
  selectedProduct.value = null
}

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
</script>

<template>
  <div class="flex h-full flex-col bg-white dark:bg-navy-750 rounded-lg overflow-hidden">
    <div class="border-b border-slate-100 dark:border-navy-700 px-4 py-3">
      <h3 class="text-sm font-semibold text-slate-700 dark:text-navy-100">
        <em class="fa-light fa-bolt mr-2 text-primary"></em>
        Produtos Rapidos
      </h3>
    </div>

    <div class="flex-1 overflow-y-auto p-3 is-scrollbar-hidden">
      <div v-if="loading" class="flex h-32 items-center justify-center">
        <em class="fa-duotone fa-spinner-third fa-spin text-primary text-xl"></em>
      </div>
      <div v-else-if="products.length === 0" class="flex h-32 flex-col items-center justify-center text-slate-400">
        <em class="fa-light fa-box-open text-2xl mb-2 opacity-30"></em>
        <p class="text-xs">Nenhum produto disponivel</p>
      </div>
      <div v-else class="grid grid-cols-3 gap-2">
        <button
          v-for="product in products"
          :key="product.id"
          class="group flex flex-col rounded-xl border border-slate-100 dark:border-navy-700 p-2.5 text-left transition-all hover:border-primary/40 hover:bg-primary/5 dark:hover:bg-navy-700 active:scale-95"
          @click="addProduct(product)"
        >
          <span class="text-[11px] font-medium text-slate-700 dark:text-navy-100 line-clamp-2 leading-tight mb-1">{{ product.name }}</span>
          <span class="text-xs font-bold text-primary">{{ formatPrice(product.price) }}</span>
          <span v-if="product.hasVariants" class="mt-1 text-[10px] uppercase tracking-wide text-slate-400">variantes</span>
          <em class="fa-solid fa-plus mt-1.5 self-end rounded-full bg-primary/10 p-1 text-[8px] text-primary opacity-0 transition-opacity group-hover:opacity-100"></em>
        </button>
      </div>
    </div>
  </div>

  <VariantSelectorModal
    :open="selectorOpen"
    :product="selectedProduct"
    @close="selectorOpen = false; selectedProduct = null"
    @confirm="confirmVariant"
  />
</template>
