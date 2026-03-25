<script lang="ts" setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useDebounceFn } from '@vueuse/core'
import DefaultLayout from '@/bin/platform/hermes/layouts/default.vue'
import { useProductCustomizerApi, type ElasticProductHit } from '../composables/useProductCustomizerApi'

const router = useRouter()
const api = useProductCustomizerApi()

// ─── Stats ───────────────────────────────────────────────────────────────────

interface Stats {
  totalProducts: number
  outOfStock: number
  monthRevenue: number
  monthOrders: number
}

const stats = ref<Stats>({ totalProducts: 0, outOfStock: 0, monthRevenue: 0, monthOrders: 0 })
const statsLoading = ref(true)

// ─── Search ───────────────────────────────────────────────────────────────────

const searchQuery = ref('')
const searchResults = ref<ElasticProductHit[]>([])
const searchTotal = ref(0)
const searchLoading = ref(false)

// ─── All products (no search) ────────────────────────────────────────────────

const allProducts = ref<ElasticProductHit[]>([])
const outOfStockProducts = ref<ElasticProductHit[]>([])
const allProductsLoading = ref(true)

const isSearching = computed(() => searchQuery.value.trim().length > 0)

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function goToDetail(productId: string) {
  router.push({ name: 'product-customizer-detail', params: { productId } })
}

// ─── Load stats ───────────────────────────────────────────────────────────────

async function loadStats() {
  statsLoading.value = true
  try {
    const [totalRes, summaryRes, outOfStockRes] = await Promise.allSettled([
      api.getProductTotal(),
      api.getPosSummary(),
      api.searchProducts('', { inStock: false, size: 1 })
    ])

    if (totalRes.status === 'fulfilled') {
      stats.value.totalProducts = totalRes.value.data?.page?.totalElements ?? 0
    }
    if (summaryRes.status === 'fulfilled') {
      stats.value.monthRevenue = summaryRes.value.data?.data?.totalRevenue ?? 0
      stats.value.monthOrders = summaryRes.value.data?.data?.totalOrders ?? 0
    }
    if (outOfStockRes.status === 'fulfilled') {
      stats.value.outOfStock = outOfStockRes.value.data?.total ?? 0
    }
  } finally {
    statsLoading.value = false
  }
}

// ─── Load all products ────────────────────────────────────────────────────────

async function loadAllProducts() {
  allProductsLoading.value = true
  try {
    const [allRes, outRes] = await Promise.allSettled([
      api.searchProducts('', { size: 20 }),
      api.searchProducts('', { inStock: false, size: 10 })
    ])
    if (allRes.status === 'fulfilled') {
      allProducts.value = allRes.value.data?.hits ?? []
    }
    if (outRes.status === 'fulfilled') {
      outOfStockProducts.value = outRes.value.data?.hits ?? []
    }
  } finally {
    allProductsLoading.value = false
  }
}

// ─── Search ────────────────────────────────────────────────────────────────

const performSearch = useDebounceFn(async (q: string) => {
  if (!q.trim()) {
    searchResults.value = []
    searchTotal.value = 0
    return
  }
  searchLoading.value = true
  try {
    const res = await api.searchProducts(q, { size: 20 })
    searchResults.value = res.data?.hits ?? []
    searchTotal.value = res.data?.total ?? searchResults.value.length
  } catch {
    searchResults.value = []
  } finally {
    searchLoading.value = false
  }
}, 300)

watch(searchQuery, (val) => performSearch(val))

// ─── Lifecycle ────────────────────────────────────────────────────────────────

onMounted(() => {
  loadStats()
  loadAllProducts()
})
</script>

<template>
  <DefaultLayout
    :icon="{ icon: 'fa-light fa-sliders', type: 'fa' }"
    :menu-items="[]"
  >
    <div class="mx-auto max-w-7xl space-y-8">

      <!-- Page header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-slate-800 dark:text-navy-100">
            Customizador de Produtos
          </h1>
          <p class="mt-1 text-sm text-slate-500 dark:text-navy-300">
            Gerencie identidade, preços, variantes e dados fiscais dos seus produtos.
          </p>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-xs text-slate-400 dark:text-navy-400">
            <em class="fa-light fa-circle-info mr-1"></em>
            Clique em "Customizar" para editar um produto
          </span>
        </div>
      </div>

      <!-- Stats bar -->
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <!-- Skeleton -->
        <template v-if="statsLoading">
          <div
            v-for="i in 4"
            :key="i"
            class="animate-pulse rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-navy-700 dark:bg-navy-750"
          >
            <div class="mb-3 h-3 w-20 rounded bg-slate-200 dark:bg-navy-600"></div>
            <div class="h-8 w-28 rounded bg-slate-200 dark:bg-navy-600"></div>
          </div>
        </template>

        <!-- Loaded stats -->
        <template v-else>
          <div
            class="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-navy-700 dark:bg-navy-750"
          >
            <p class="text-xs font-medium text-slate-500 dark:text-navy-400">Total Produtos</p>
            <p class="mt-1 text-3xl font-bold text-slate-800 dark:text-navy-100">
              {{ stats.totalProducts.toLocaleString('pt-BR') }}
            </p>
            <span class="mt-2 inline-flex items-center gap-1 text-xs text-info">
              <em class="fa-light fa-box-open"></em> catálogo completo
            </span>
          </div>

          <div
            class="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-navy-700 dark:bg-navy-750"
          >
            <p class="text-xs font-medium text-slate-500 dark:text-navy-400">Sem Estoque</p>
            <p class="mt-1 text-3xl font-bold text-error">
              {{ stats.outOfStock.toLocaleString('pt-BR') }}
            </p>
            <span class="mt-2 inline-flex items-center gap-1 text-xs text-error/70">
              <em class="fa-light fa-triangle-exclamation"></em> reposição necessária
            </span>
          </div>

          <div
            class="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-navy-700 dark:bg-navy-750"
          >
            <p class="text-xs font-medium text-slate-500 dark:text-navy-400">Receita do Mês</p>
            <p class="mt-1 text-3xl font-bold text-success">
              {{ formatCurrency(stats.monthRevenue) }}
            </p>
            <span class="mt-2 inline-flex items-center gap-1 text-xs text-success/70">
              <em class="fa-light fa-chart-line"></em> via PDV
            </span>
          </div>

          <div
            class="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-navy-700 dark:bg-navy-750"
          >
            <p class="text-xs font-medium text-slate-500 dark:text-navy-400">Pedidos do Mês</p>
            <p class="mt-1 text-3xl font-bold text-slate-800 dark:text-navy-100">
              {{ stats.monthOrders.toLocaleString('pt-BR') }}
            </p>
            <span class="mt-2 inline-flex items-center gap-1 text-xs text-slate-400 dark:text-navy-400">
              <em class="fa-light fa-shopping-cart"></em> total de pedidos
            </span>
          </div>
        </template>
      </div>

      <!-- Search bar -->
      <div class="relative">
        <div
          class="flex items-center gap-3 rounded-2xl border-2 border-slate-200 bg-white px-5 py-4 shadow-sm transition-all focus-within:border-primary dark:border-navy-700 dark:bg-navy-750 dark:focus-within:border-primary"
        >
          <em
            v-if="!searchLoading"
            class="fa-light fa-magnifying-glass text-xl text-slate-400 dark:text-navy-400"
          ></em>
          <em
            v-else
            class="fa-duotone fa-spinner-third animate-spin text-xl text-primary"
          ></em>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar produtos por nome, SKU ou categoria..."
            class="flex-1 bg-transparent text-base text-slate-700 placeholder-slate-400 outline-none dark:text-navy-100 dark:placeholder-navy-400"
          />
          <button
            v-if="searchQuery"
            class="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition-colors hover:bg-slate-200 dark:bg-navy-700 dark:hover:bg-navy-600"
            @click="searchQuery = ''"
          >
            <em class="fa-solid fa-xmark text-xs"></em>
          </button>
        </div>
      </div>

      <!-- SEARCH RESULTS -->
      <template v-if="isSearching">
        <div>
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-sm font-semibold text-slate-700 dark:text-navy-200">
              Resultados da busca
              <span class="ml-2 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                {{ searchTotal }} encontrados
              </span>
            </h2>
          </div>

          <!-- No results -->
          <div
            v-if="!searchLoading && searchResults.length === 0"
            class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-16 dark:border-navy-700 dark:bg-navy-750"
          >
            <em class="fa-light fa-search text-5xl text-slate-300 dark:text-navy-600"></em>
            <p class="mt-4 text-base font-semibold text-slate-600 dark:text-navy-300">
              Nenhum produto encontrado
            </p>
            <p class="mt-1 text-sm text-slate-400 dark:text-navy-400">
              Tente pesquisar com outros termos
            </p>
          </div>

          <!-- Search result cards grid -->
          <div
            v-else
            class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            <div
              v-for="product in searchResults"
              :key="product.id"
              class="group flex flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:border-primary/30 hover:shadow-md dark:border-navy-700 dark:bg-navy-750 dark:hover:border-primary/40"
            >
              <!-- Product icon placeholder -->
              <div
                class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 dark:bg-primary/20"
              >
                <em class="fa-light fa-box text-xl text-primary"></em>
              </div>

              <!-- Name -->
              <h3
                class="line-clamp-2 flex-1 text-sm font-semibold text-slate-800 dark:text-navy-100"
              >
                {{ product.name }}
              </h3>

              <!-- Price -->
              <p class="mt-2 text-xl font-bold text-primary">
                {{ formatCurrency(product.price) }}
              </p>

              <!-- Badges -->
              <div class="mt-3 flex flex-wrap gap-2">
                <span
                  :class="product.inStock
                    ? 'bg-success/10 text-success'
                    : 'bg-error/10 text-error'"
                  class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
                >
                  <em
                    :class="product.inStock ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-xmark'"
                    class="text-[10px]"
                  ></em>
                  {{ product.inStock ? 'Em estoque' : 'Sem estoque' }}
                </span>
                <span
                  v-if="product.hasVariants"
                  class="inline-flex items-center gap-1 rounded-full bg-info/10 px-2.5 py-0.5 text-xs font-medium text-info"
                >
                  <em class="fa-light fa-layer-group text-[10px]"></em>
                  Variantes
                </span>
              </div>

              <!-- Action -->
              <button
                class="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white dark:bg-primary/20 dark:hover:bg-primary"
                @click="goToDetail(product.id)"
              >
                Customizar
                <em class="fa-light fa-arrow-right text-xs"></em>
              </button>
            </div>
          </div>
        </div>
      </template>

      <!-- DEFAULT VIEW: two sections side by side -->
      <template v-else>
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <!-- Sem estoque -->
          <div class="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-navy-700 dark:bg-navy-750">
            <div class="mb-4 flex items-center justify-between">
              <h2 class="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-navy-200">
                <span class="flex h-7 w-7 items-center justify-center rounded-full bg-error/10">
                  <em class="fa-solid fa-triangle-exclamation text-xs text-error"></em>
                </span>
                Produtos sem estoque
              </h2>
              <span class="rounded-full bg-error/10 px-2.5 py-0.5 text-xs font-semibold text-error">
                {{ outOfStockProducts.length }} itens
              </span>
            </div>

            <!-- Skeleton -->
            <template v-if="allProductsLoading">
              <div
                v-for="i in 4"
                :key="i"
                class="mb-3 flex animate-pulse items-center gap-3 rounded-xl p-3"
              >
                <div class="h-9 w-9 rounded-lg bg-slate-100 dark:bg-navy-700"></div>
                <div class="flex-1 space-y-1.5">
                  <div class="h-3 w-3/4 rounded bg-slate-100 dark:bg-navy-700"></div>
                  <div class="h-3 w-1/2 rounded bg-slate-100 dark:bg-navy-700"></div>
                </div>
              </div>
            </template>

            <!-- Empty state -->
            <div
              v-else-if="outOfStockProducts.length === 0"
              class="flex flex-col items-center justify-center py-10"
            >
              <em class="fa-light fa-box-check text-4xl text-success/50"></em>
              <p class="mt-3 text-sm font-medium text-slate-500 dark:text-navy-400">
                Todos os produtos estão em estoque!
              </p>
            </div>

            <!-- List -->
            <ul v-else class="space-y-2">
              <li
                v-for="product in outOfStockProducts"
                :key="product.id"
                class="flex cursor-pointer items-center gap-3 rounded-xl border border-transparent p-3 transition-all hover:border-error/20 hover:bg-error/5 dark:hover:border-error/20 dark:hover:bg-error/5"
                @click="goToDetail(product.id)"
              >
                <div
                  class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-error/10"
                >
                  <em class="fa-light fa-box text-sm text-error"></em>
                </div>
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-medium text-slate-700 dark:text-navy-100">
                    {{ product.name }}
                  </p>
                  <p class="text-xs text-slate-400 dark:text-navy-400">
                    {{ formatCurrency(product.price) }}
                  </p>
                </div>
                <em class="fa-light fa-arrow-right text-xs text-slate-300 dark:text-navy-500"></em>
              </li>
            </ul>
          </div>

          <!-- Todos os produtos -->
          <div class="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-navy-700 dark:bg-navy-750">
            <div class="mb-4 flex items-center justify-between">
              <h2 class="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-navy-200">
                <span class="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
                  <em class="fa-light fa-boxes-stacked text-xs text-primary"></em>
                </span>
                Todos os produtos
              </h2>
              <span class="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                {{ stats.totalProducts }} total
              </span>
            </div>

            <!-- Skeleton -->
            <template v-if="allProductsLoading">
              <div
                v-for="i in 6"
                :key="i"
                class="mb-3 flex animate-pulse items-center gap-3 rounded-xl p-3"
              >
                <div class="h-9 w-9 rounded-lg bg-slate-100 dark:bg-navy-700"></div>
                <div class="flex-1 space-y-1.5">
                  <div class="h-3 w-3/4 rounded bg-slate-100 dark:bg-navy-700"></div>
                  <div class="h-3 w-1/2 rounded bg-slate-100 dark:bg-navy-700"></div>
                </div>
              </div>
            </template>

            <!-- Empty -->
            <div
              v-else-if="allProducts.length === 0"
              class="flex flex-col items-center justify-center py-10"
            >
              <em class="fa-light fa-boxes-stacked text-4xl text-slate-200 dark:text-navy-600"></em>
              <p class="mt-3 text-sm font-medium text-slate-500 dark:text-navy-400">
                Nenhum produto cadastrado
              </p>
            </div>

            <!-- List -->
            <ul v-else class="space-y-2">
              <li
                v-for="product in allProducts"
                :key="product.id"
                class="flex cursor-pointer items-center gap-3 rounded-xl border border-transparent p-3 transition-all hover:border-primary/20 hover:bg-primary/5 dark:hover:border-primary/20 dark:hover:bg-primary/5"
                @click="goToDetail(product.id)"
              >
                <div
                  class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  :class="product.inStock ? 'bg-primary/10' : 'bg-slate-100 dark:bg-navy-700'"
                >
                  <em
                    class="fa-light fa-box text-sm"
                    :class="product.inStock ? 'text-primary' : 'text-slate-400 dark:text-navy-400'"
                  ></em>
                </div>
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-medium text-slate-700 dark:text-navy-100">
                    {{ product.name }}
                  </p>
                  <div class="flex items-center gap-2">
                    <p class="text-xs text-slate-400 dark:text-navy-400">
                      {{ formatCurrency(product.price) }}
                    </p>
                    <span
                      v-if="product.hasVariants"
                      class="rounded-full bg-info/10 px-1.5 py-0.5 text-[10px] font-medium text-info"
                    >
                      variantes
                    </span>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <span
                    :class="product.inStock ? 'bg-success/10 text-success' : 'bg-error/10 text-error'"
                    class="rounded-full px-2 py-0.5 text-[10px] font-medium"
                  >
                    {{ product.inStock ? 'Em estoque' : 'Sem estoque' }}
                  </span>
                  <em class="fa-light fa-arrow-right text-xs text-slate-300 dark:text-navy-500"></em>
                </div>
              </li>
            </ul>

            <!-- Hint to search for more -->
            <p
              v-if="allProducts.length > 0"
              class="mt-4 text-center text-xs text-slate-400 dark:text-navy-500"
            >
              Exibindo os 20 primeiros. Use a busca acima para encontrar mais.
            </p>
          </div>
        </div>
      </template>

    </div>
  </DefaultLayout>
</template>
