<script lang="ts" setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import DefaultLayout from '@/bin/platform/hermes/layouts/default.vue'
import {
  useProductCustomizerApi,
  type Product,
  type ProductCategory,
  type Brand,
  type Warehouse,
  type ProductPrice,
  type Variant,
  type ElasticProductHit,
  buildUri
} from '../composables/useProductCustomizerApi'

const router = useRouter()
const route = useRoute()
const api = useProductCustomizerApi()

const productId = computed(() => route.params.productId as string)

// ─── Loading / saving / toast ─────────────────────────────────────────────────

const isLoading = ref(true)
const isSaving = ref(false)
const isDirty = ref(false)
const savedToast = ref(false)
const errorToast = ref('')
let toastTimer: ReturnType<typeof setTimeout> | null = null

function showSavedToast() {
  savedToast.value = true
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { savedToast.value = false }, 3000)
}

function showErrorToast(msg: string) {
  errorToast.value = msg
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { errorToast.value = '' }, 4000)
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const tabs = [
  { id: 'identity', label: 'Identidade', icon: 'fa-light fa-tag' },
  { id: 'prices', label: 'Preços & Markup', icon: 'fa-light fa-coins' },
  { id: 'variants', label: 'Variantes', icon: 'fa-light fa-layer-group' },
  { id: 'stock', label: 'Estoque', icon: 'fa-light fa-warehouse' },
  { id: 'fiscal', label: 'Fiscal', icon: 'fa-light fa-file-invoice' },
  { id: 'seo', label: 'SEO', icon: 'fa-light fa-magnifying-glass-chart' },
  { id: 'elastic', label: 'Elastic', icon: 'fa-light fa-bolt' }
] as const

type TabId = typeof tabs[number]['id']
const activeTab = ref<TabId>('identity')

// ─── Product state ─────────────────────────────────────────────────────────────

const product = ref<Product | null>(null)

// Editable fields
const form = ref({
  name: '',
  slug: '',
  shortDescription: '',
  description: '',
  isVirtual: false,
  shippable: true,
  weekOffer: false,
  published: false,
  available: false,
  stock: 0,
  allowOutOfStockPurchases: false,
  priority: 0,
  metaTitle: '',
  metaDescription: '',
  metaKeywords: '',
  ncm: '',
  icmsOrigem: 0,
  icmsTributeSituations: '',
  pisTributeSituations: '',
  cofinsTributeSituations: ''
})

function markDirty() {
  isDirty.value = true
}

// ─── Relations ────────────────────────────────────────────────────────────────

const productCategories = ref<ProductCategory[]>([])
const productBrands = ref<Brand[]>([])
const productWarehouses = ref<Warehouse[]>([])

const allCategories = ref<ProductCategory[]>([])
const allBrands = ref<Brand[]>([])
const allWarehouses = ref<Warehouse[]>([])

// Filter inputs for relation search
const categorySearch = ref('')
const brandSearch = ref('')
const warehouseSearch = ref('')

const filteredCategories = computed(() =>
  allCategories.value.filter(
    (c) =>
      !productCategories.value.some((pc) => pc.id === c.id) &&
      c.name.toLowerCase().includes(categorySearch.value.toLowerCase())
  )
)

const filteredBrands = computed(() =>
  allBrands.value.filter(
    (b) =>
      !productBrands.value.some((pb) => pb.id === b.id) &&
      b.name.toLowerCase().includes(brandSearch.value.toLowerCase())
  )
)

const filteredWarehouses = computed(() =>
  allWarehouses.value.filter(
    (w) =>
      !productWarehouses.value.some((pw) => pw.id === w.id) &&
      w.name.toLowerCase().includes(warehouseSearch.value.toLowerCase())
  )
)

const showCategoryDropdown = ref(false)
const showBrandDropdown = ref(false)
const showWarehouseDropdown = ref(false)

function hideCategoryDropdown() { setTimeout(() => { showCategoryDropdown.value = false }, 150) }
function hideBrandDropdown() { setTimeout(() => { showBrandDropdown.value = false }, 150) }
function hideWarehouseDropdown() { setTimeout(() => { showWarehouseDropdown.value = false }, 150) }

function addCategory(cat: ProductCategory) {
  productCategories.value.push(cat)
  categorySearch.value = ''
  showCategoryDropdown.value = false
  markDirty()
}

function removeCategory(catId: string) {
  productCategories.value = productCategories.value.filter((c) => c.id !== catId)
  markDirty()
}

function addBrand(brand: Brand) {
  productBrands.value.push(brand)
  brandSearch.value = ''
  showBrandDropdown.value = false
  markDirty()
}

function removeBrand(brandId: string) {
  productBrands.value = productBrands.value.filter((b) => b.id !== brandId)
  markDirty()
}

function addWarehouse(wh: Warehouse) {
  productWarehouses.value.push(wh)
  warehouseSearch.value = ''
  showWarehouseDropdown.value = false
  markDirty()
}

function removeWarehouse(whId: string) {
  productWarehouses.value = productWarehouses.value.filter((w) => w.id !== whId)
  markDirty()
}

// ─── Prices ───────────────────────────────────────────────────────────────────

const regularPrice = ref<ProductPrice | null>(null)
const compareAtPrice = ref<ProductPrice | null>(null)

// Display values (formatted)
const regularPriceDisplay = ref('0,00')
const compareAtPriceDisplay = ref('0,00')

// Cost for markup calculator
const costInput = ref('')
const costCents = computed(() => {
  const digits = costInput.value.replace(/\D/g, '')
  return parseInt(digits || '0', 10)
})
const regularPriceCents = computed(() => {
  const digits = regularPriceDisplay.value.replace(/\D/g, '')
  return parseInt(digits || '0', 10)
})
const markup = computed(() => {
  if (costCents.value <= 0) return 0
  return ((regularPriceCents.value - costCents.value) / costCents.value) * 100
})
const margin = computed(() => {
  if (regularPriceCents.value <= 0) return 0
  return ((regularPriceCents.value - costCents.value) / regularPriceCents.value) * 100
})
const profitPerUnit = computed(() => regularPriceCents.value - costCents.value)

const markupColor = computed(() => {
  if (markup.value < 20) return 'from-error to-error'
  if (markup.value < 50) return 'from-warning to-warning'
  return 'from-success to-success'
})
const markupTextColor = computed(() => {
  if (markup.value < 20) return 'text-error'
  if (markup.value < 50) return 'text-warning'
  return 'text-success'
})
const markupBarWidth = computed(() => Math.min((markup.value / 200) * 100, 100))

function suggestPrice(targetMarkup: number) {
  if (costCents.value <= 0) return
  const suggested = Math.round(costCents.value * (1 + targetMarkup / 100))
  regularPriceDisplay.value = formatCentsToDisplay(suggested)
  markDirty()
}

function onRegularPriceInput(e: Event) {
  const target = e.target as HTMLInputElement
  const digits = target.value.replace(/\D/g, '')
  const cents = parseInt(digits || '0', 10)
  regularPriceDisplay.value = formatCentsToDisplay(cents)
  markDirty()
}

function onCompareAtPriceInput(e: Event) {
  const target = e.target as HTMLInputElement
  const digits = target.value.replace(/\D/g, '')
  const cents = parseInt(digits || '0', 10)
  compareAtPriceDisplay.value = formatCentsToDisplay(cents)
  markDirty()
}

function formatCentsToDisplay(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatCurrency(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function displayToCents(display: string): number {
  const digits = display.replace(/\D/g, '')
  return parseInt(digits || '0', 10)
}

// ─── Variants ─────────────────────────────────────────────────────────────────

interface VariantFormItem {
  id: string | null
  name: string
  optionValues: { key: string; value: string }[]
  priceCents: number
  priceDisplay: string
  priceId: string | null
  stock: number
  published: boolean
  available: boolean
  isNew: boolean
  isDeleted: boolean
}

const variants = ref<VariantFormItem[]>([])

function variantToForm(v: Variant, prices: ProductPrice[]): VariantFormItem {
  const price = prices.find((p) => p.field === null) ?? null
  const optionEntries = Object.entries(v.optionValues ?? {}).map(([key, value]) => ({ key, value }))
  return {
    id: v.id,
    name: v.name,
    optionValues: optionEntries,
    priceCents: price?.price ?? 0,
    priceDisplay: formatCentsToDisplay(price?.price ?? 0),
    priceId: price?.id ?? null,
    stock: v.stock,
    published: v.published,
    available: v.available,
    isNew: false,
    isDeleted: false
  }
}

function addNewVariant() {
  variants.value.push({
    id: null,
    name: '',
    optionValues: [{ key: '', value: '' }],
    priceCents: 0,
    priceDisplay: '0,00',
    priceId: null,
    stock: 0,
    published: true,
    available: true,
    isNew: true,
    isDeleted: false
  })
  markDirty()
}

function removeVariantRow(index: number) {
  const v = variants.value[index]
  if (v.isNew) {
    variants.value.splice(index, 1)
  } else {
    v.isDeleted = true
  }
  markDirty()
}

function addOptionPair(v: VariantFormItem) {
  v.optionValues.push({ key: '', value: '' })
}

function removeOptionPair(v: VariantFormItem, idx: number) {
  v.optionValues.splice(idx, 1)
}

function onVariantPriceInput(v: VariantFormItem, e: Event) {
  const target = e.target as HTMLInputElement
  const digits = target.value.replace(/\D/g, '')
  const cents = parseInt(digits || '0', 10)
  v.priceCents = cents
  v.priceDisplay = formatCentsToDisplay(cents)
  markDirty()
}

// ─── Elastic ──────────────────────────────────────────────────────────────────

const elasticHit = ref<ElasticProductHit | null>(null)
const elasticLoading = ref(false)

async function loadElasticHit() {
  if (!productId.value) return
  elasticLoading.value = true
  try {
    const res = await api.searchProducts(product.value?.name ?? '', { size: 50 })
    const hit = res.data?.hits?.find((h) => h.id === productId.value) ?? null
    elasticHit.value = hit
  } catch {
    elasticHit.value = null
  } finally {
    elasticLoading.value = false
  }
}

// ─── Slug generation ──────────────────────────────────────────────────────────

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function autoSlug() {
  form.value.slug = generateSlug(form.value.name)
  markDirty()
}

// ─── SEO ──────────────────────────────────────────────────────────────────────

const metaTitleCount = computed(() => form.value.metaTitle.length)
const metaDescCount = computed(() => form.value.metaDescription.length)

// ─── ICMS options ─────────────────────────────────────────────────────────────

const icmsOrigemOptions = [
  { value: 0, label: '0 – Nacional' },
  { value: 1, label: '1 – Estrangeira (importação direta)' },
  { value: 2, label: '2 – Estrangeira (adquirida no mercado interno)' },
  { value: 3, label: '3 – Nacional com mais de 40% conteúdo estrangeiro' },
  { value: 4, label: '4 – Nacional com processo produtivo básico' },
  { value: 5, label: '5 – Nacional com até 40% conteúdo estrangeiro' },
  { value: 6, label: '6 – Estrangeira (importação direta, sem similar nacional)' },
  { value: 7, label: '7 – Estrangeira (adquirida no mercado interno, sem similar nacional)' },
  { value: 8, label: '8 – Nacional com mais de 70% conteúdo estrangeiro' }
]

// ─── Load data ────────────────────────────────────────────────────────────────

async function loadProduct() {
  if (!productId.value) return
  isLoading.value = true
  try {
    const [
      productRes,
      categoriesRes,
      brandsRes,
      warehousesRes,
      pricesRes,
      variantsRes,
      allCatsRes,
      allBrandsRes,
      allWarehousesRes
    ] = await Promise.allSettled([
      api.getProduct(productId.value),
      api.getProductCategories(productId.value),
      api.getProductBrands(productId.value),
      api.getProductWarehouses(productId.value),
      api.getProductPrices(productId.value),
      api.getProductVariants(productId.value),
      api.getAllCategories(),
      api.getAllBrands(),
      api.getAllWarehouses()
    ])

    if (productRes.status === 'fulfilled') {
      const p = productRes.value.data
      product.value = p
      form.value = {
        name: p.name ?? '',
        slug: p.slug ?? '',
        shortDescription: p.shortDescription ?? '',
        description: p.description ?? '',
        isVirtual: p.isVirtual ?? false,
        shippable: p.shippable ?? true,
        weekOffer: p.weekOffer ?? false,
        published: p.published ?? false,
        available: p.available ?? false,
        stock: p.stock ?? 0,
        allowOutOfStockPurchases: p.allowOutOfStockPurchases ?? false,
        priority: p.priority ?? 0,
        metaTitle: p.metaTitle ?? '',
        metaDescription: p.metaDescription ?? '',
        metaKeywords: p.metaKeywords ?? '',
        ncm: p.ncm ?? '',
        icmsOrigem: p.icmsOrigem ?? 0,
        icmsTributeSituations: p.icmsTributeSituations ?? '',
        pisTributeSituations: p.pisTributeSituations ?? '',
        cofinsTributeSituations: p.cofinsTributeSituations ?? ''
      }
    }

    if (categoriesRes.status === 'fulfilled') {
      productCategories.value = categoriesRes.value.data?._embedded?.productcategory ?? []
    }
    if (brandsRes.status === 'fulfilled') {
      productBrands.value = brandsRes.value.data?._embedded?.brand ?? []
    }
    if (warehousesRes.status === 'fulfilled') {
      productWarehouses.value = warehousesRes.value.data?._embedded?.warehouse ?? []
    }

    if (pricesRes.status === 'fulfilled') {
      const prices = pricesRes.value.data?._embedded?.productprice ?? []
      regularPrice.value = prices.find((p) => p.field === null) ?? null
      compareAtPrice.value = prices.find((p) => p.field === 'compare_at') ?? null
      regularPriceDisplay.value = formatCentsToDisplay(regularPrice.value?.price ?? 0)
      compareAtPriceDisplay.value = formatCentsToDisplay(compareAtPrice.value?.price ?? 0)
    }

    if (variantsRes.status === 'fulfilled') {
      const rawVariants = variantsRes.value.data?._embedded?.variant ?? []
      // Load variant prices in parallel
      const variantPricesResults = await Promise.allSettled(
        rawVariants.map((v) => api.getVariantPrices(v.id))
      )
      variants.value = rawVariants.map((v, idx) => {
        const prices =
          variantPricesResults[idx].status === 'fulfilled'
            ? variantPricesResults[idx].value.data?._embedded?.productprice ?? []
            : []
        return variantToForm(v, prices)
      })
    }

    if (allCatsRes.status === 'fulfilled') {
      allCategories.value = allCatsRes.value.data?._embedded?.productcategory ?? []
    }
    if (allBrandsRes.status === 'fulfilled') {
      allBrands.value = allBrandsRes.value.data?._embedded?.brand ?? []
    }
    if (allWarehousesRes.status === 'fulfilled') {
      allWarehouses.value = allWarehousesRes.value.data?._embedded?.warehouse ?? []
    }

    // Load elastic hit
    await loadElasticHit()
  } finally {
    isLoading.value = false
    isDirty.value = false
  }
}

// ─── Save ─────────────────────────────────────────────────────────────────────

async function save() {
  if (!productId.value || isSaving.value) return
  isSaving.value = true
  try {
    // 1. Patch product fields
    await api.patchProduct(productId.value, {
      name: form.value.name,
      slug: form.value.slug,
      shortDescription: form.value.shortDescription || null,
      description: form.value.description || null,
      isVirtual: form.value.isVirtual,
      shippable: form.value.shippable,
      weekOffer: form.value.weekOffer,
      published: form.value.published,
      available: form.value.available,
      stock: form.value.stock,
      allowOutOfStockPurchases: form.value.allowOutOfStockPurchases,
      priority: form.value.priority,
      metaTitle: form.value.metaTitle || null,
      metaDescription: form.value.metaDescription || null,
      metaKeywords: form.value.metaKeywords || null,
      ncm: form.value.ncm || null,
      icmsOrigem: form.value.icmsOrigem,
      icmsTributeSituations: form.value.icmsTributeSituations || null,
      pisTributeSituations: form.value.pisTributeSituations || null,
      cofinsTributeSituations: form.value.cofinsTributeSituations || null
    })

    // 2. Update relations
    await Promise.allSettled([
      api.putProductCategories(productId.value, productCategories.value.map((c) => c.id)),
      api.putProductBrands(productId.value, productBrands.value.map((b) => b.id)),
      api.putProductWarehouses(productId.value, productWarehouses.value.map((w) => w.id))
    ])

    // 3. Prices
    const regularCents = displayToCents(regularPriceDisplay.value)
    const compareAtCents = displayToCents(compareAtPriceDisplay.value)

    if (regularPrice.value) {
      await api.patchPrice(regularPrice.value.id, { price: regularCents })
    } else if (regularCents > 0) {
      const created = await api.createProductPrice({
        price: regularCents,
        field: null,
        product: buildUri('product', productId.value)
      })
      regularPrice.value = created.data
    }

    if (compareAtPrice.value) {
      await api.patchPrice(compareAtPrice.value.id, { price: compareAtCents })
    } else if (compareAtCents > 0) {
      const created = await api.createProductPrice({
        price: compareAtCents,
        field: 'compare_at',
        product: buildUri('product', productId.value)
      })
      compareAtPrice.value = created.data
    }

    // 4. Variants
    for (const v of variants.value) {
      if (v.isDeleted && v.id) {
        await api.deleteVariant(v.id)
        continue
      }
      if (v.isDeleted) continue

      const optionValues = v.optionValues.reduce(
        (acc, pair) => {
          if (pair.key) acc[pair.key] = pair.value
          return acc
        },
        {} as Record<string, string>
      )

      if (v.isNew) {
        const created = await api.createVariant({
          name: v.name,
          optionValues,
          stock: v.stock,
          published: v.published,
          available: v.available,
          product: buildUri('product', productId.value)
        })
        v.id = created.data.id
        v.isNew = false
        // Create price for new variant
        if (v.priceCents > 0) {
          const createdPrice = await api.createVariantPrice({
            price: v.priceCents,
            variant: buildUri('variant', created.data.id)
          })
          v.priceId = createdPrice.data.id
        }
      } else if (v.id) {
        await api.patchVariant(v.id, {
          name: v.name,
          optionValues,
          stock: v.stock,
          published: v.published,
          available: v.available
        })
        // Update or create variant price
        if (v.priceId) {
          await api.patchPrice(v.priceId, { price: v.priceCents })
        } else if (v.priceCents > 0 && v.id) {
          const createdPrice = await api.createVariantPrice({
            price: v.priceCents,
            variant: buildUri('variant', v.id)
          })
          v.priceId = createdPrice.data.id
        }
      }
    }

    // Remove deleted variants from list
    variants.value = variants.value.filter((v) => !v.isDeleted)

    isDirty.value = false
    showSavedToast()
  } catch (e: any) {
    console.error('Save error', e)
    showErrorToast('Erro ao salvar. Verifique os campos e tente novamente.')
  } finally {
    isSaving.value = false
  }
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────

onMounted(() => loadProduct())
</script>

<template>
  <DefaultLayout
    :icon="{ icon: 'fa-light fa-sliders', type: 'fa' }"
    :menu-items="[]"
  >
    <!-- Toast: success -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="translate-y-4 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-4 opacity-0"
    >
      <div
        v-if="savedToast"
        class="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl bg-success px-5 py-3.5 text-white shadow-xl shadow-success/30"
      >
        <em class="fa-solid fa-circle-check text-lg"></em>
        <span class="text-sm font-semibold">Produto salvo com sucesso!</span>
      </div>
    </Transition>

    <!-- Toast: error -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="translate-y-4 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-4 opacity-0"
    >
      <div
        v-if="errorToast"
        class="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl bg-error px-5 py-3.5 text-white shadow-xl shadow-error/30"
      >
        <em class="fa-solid fa-circle-xmark text-lg"></em>
        <span class="text-sm font-semibold">{{ errorToast }}</span>
      </div>
    </Transition>

    <!-- Full page loading -->
    <div v-if="isLoading" class="flex flex-col gap-6">
      <!-- Breadcrumb skeleton -->
      <div class="h-5 w-40 animate-pulse rounded bg-slate-100 dark:bg-navy-700"></div>
      <!-- Hero skeleton -->
      <div class="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-navy-700 dark:bg-navy-750 animate-pulse">
        <div class="mb-3 h-9 w-2/3 rounded-xl bg-slate-100 dark:bg-navy-700"></div>
        <div class="h-4 w-1/3 rounded bg-slate-100 dark:bg-navy-700"></div>
      </div>
      <!-- Tabs skeleton -->
      <div class="flex gap-2">
        <div v-for="i in 7" :key="i" class="h-9 w-24 animate-pulse rounded-xl bg-slate-100 dark:bg-navy-700"></div>
      </div>
      <!-- Content skeleton -->
      <div class="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-navy-700 dark:bg-navy-750 animate-pulse space-y-4">
        <div class="h-5 w-1/4 rounded bg-slate-100 dark:bg-navy-700"></div>
        <div class="h-11 rounded-xl bg-slate-100 dark:bg-navy-700"></div>
        <div class="h-11 rounded-xl bg-slate-100 dark:bg-navy-700"></div>
        <div class="h-24 rounded-xl bg-slate-100 dark:bg-navy-700"></div>
      </div>
    </div>

    <!-- Main content (loaded) -->
    <div v-else class="mx-auto max-w-5xl space-y-6">

      <!-- Breadcrumb back -->
      <button
        class="flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-primary dark:text-navy-400 dark:hover:text-primary"
        @click="router.push({ name: 'product-customizer' })"
      >
        <em class="fa-solid fa-arrow-left text-xs"></em>
        Voltar aos Produtos
      </button>

      <!-- Hero card -->
      <div class="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-navy-700 dark:bg-navy-750">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div class="flex-1 min-w-0">
            <!-- Published toggle + name row -->
            <div class="flex items-center gap-3 flex-wrap">
              <!-- Published pill toggle -->
              <button
                class="flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold transition-all"
                :class="form.published
                  ? 'bg-success/10 text-success hover:bg-success/20'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-navy-700 dark:text-navy-400 dark:hover:bg-navy-600'"
                @click="form.published = !form.published; markDirty()"
              >
                <span
                  class="h-2 w-2 rounded-full"
                  :class="form.published ? 'bg-success' : 'bg-slate-400 dark:bg-navy-500'"
                ></span>
                {{ form.published ? 'Publicado' : 'Rascunho' }}
              </button>
            </div>

            <!-- Name (large editable) -->
            <input
              v-model="form.name"
              type="text"
              class="mt-2 w-full rounded-xl border-2 border-transparent bg-transparent px-2 py-1 text-2xl font-bold text-slate-800 placeholder-slate-300 outline-none transition-all focus:border-primary/30 focus:bg-primary/5 dark:text-navy-100 dark:placeholder-navy-600 dark:focus:border-primary/30 dark:focus:bg-primary/5"
              placeholder="Nome do produto"
              @input="markDirty()"
            />

            <!-- Slug + stock + categories summary -->
            <div class="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-navy-400">
              <span class="flex items-center gap-1">
                <em class="fa-light fa-link text-xs"></em>
                {{ form.slug || '—' }}
              </span>
              <span class="text-slate-200 dark:text-navy-600">·</span>
              <span class="flex items-center gap-1">
                <em class="fa-light fa-boxes-stacked text-xs"></em>
                Estoque: {{ form.stock }}
              </span>
              <span class="text-slate-200 dark:text-navy-600">·</span>
              <div class="flex flex-wrap gap-1.5">
                <span
                  v-for="cat in productCategories.slice(0, 3)"
                  :key="cat.id"
                  class="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                >
                  {{ cat.name }}
                </span>
                <span
                  v-if="productCategories.length > 3"
                  class="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500 dark:bg-navy-700 dark:text-navy-400"
                >
                  +{{ productCategories.length - 3 }}
                </span>
              </div>
            </div>
          </div>

          <!-- Save button -->
          <div class="flex shrink-0 items-center gap-3">
            <span
              v-if="isDirty && !isSaving"
              class="text-xs text-warning"
            >
              <em class="fa-light fa-circle-dot mr-1"></em>
              Alterações não salvas
            </span>
            <button
              class="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:opacity-60"
              :disabled="isSaving"
              @click="save"
            >
              <em v-if="isSaving" class="fa-duotone fa-spinner-third animate-spin text-sm"></em>
              <em v-else class="fa-light fa-floppy-disk text-sm"></em>
              {{ isSaving ? 'Salvando…' : 'Salvar' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Tab bar -->
      <div class="flex gap-1 overflow-x-auto rounded-2xl border border-slate-100 bg-white p-2 shadow-sm dark:border-navy-700 dark:bg-navy-750">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all"
          :class="activeTab === tab.id
            ? 'bg-primary text-white shadow-sm shadow-primary/30'
            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:text-navy-400 dark:hover:bg-navy-700 dark:hover:text-navy-200'"
          @click="activeTab = tab.id"
        >
          <em :class="tab.icon" class="text-[13px]"></em>
          {{ tab.label }}
        </button>
      </div>

      <!-- Tab content wrapper -->
      <div class="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-navy-700 dark:bg-navy-750">

        <!-- ═══ TAB: Identidade ═══ -->
        <div v-if="activeTab === 'identity'" class="space-y-6">
          <h3 class="text-base font-bold text-slate-700 dark:text-navy-200">Identidade do Produto</h3>

          <!-- Name -->
          <div>
            <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-navy-400">
              Nome
            </label>
            <input
              v-model="form.name"
              type="text"
              class="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition-all focus:border-primary focus:bg-white dark:border-navy-700 dark:bg-navy-800 dark:text-navy-100 dark:focus:border-primary dark:focus:bg-navy-750"
              placeholder="Nome completo do produto"
              @input="markDirty()"
            />
          </div>

          <!-- Slug -->
          <div>
            <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-navy-400">
              Slug (URL)
            </label>
            <div class="flex gap-2">
              <input
                v-model="form.slug"
                type="text"
                class="flex-1 rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition-all focus:border-primary focus:bg-white dark:border-navy-700 dark:bg-navy-800 dark:text-navy-100 dark:focus:border-primary dark:focus:bg-navy-750"
                placeholder="meu-produto-exemplo"
                @input="markDirty()"
              />
              <button
                class="flex items-center gap-2 rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600 transition-all hover:border-primary hover:bg-primary/5 hover:text-primary dark:border-navy-700 dark:bg-navy-800 dark:text-navy-300 dark:hover:border-primary dark:hover:text-primary"
                title="Gerar slug a partir do nome"
                @click="autoSlug"
              >
                <em class="fa-light fa-wand-magic-sparkles text-sm"></em>
                Gerar
              </button>
            </div>
          </div>

          <!-- Short description -->
          <div>
            <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-navy-400">
              Descrição Curta
            </label>
            <input
              v-model="form.shortDescription"
              type="text"
              class="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition-all focus:border-primary focus:bg-white dark:border-navy-700 dark:bg-navy-800 dark:text-navy-100 dark:focus:border-primary dark:focus:bg-navy-750"
              placeholder="Resumo em uma linha do produto"
              @input="markDirty()"
            />
          </div>

          <!-- Description -->
          <div>
            <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-navy-400">
              Descrição Completa
            </label>
            <textarea
              v-model="form.description"
              rows="5"
              class="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition-all focus:border-primary focus:bg-white dark:border-navy-700 dark:bg-navy-800 dark:text-navy-100 dark:focus:border-primary dark:focus:bg-navy-750"
              placeholder="Descrição detalhada do produto..."
              style="min-height: 120px; resize: vertical"
              @input="markDirty()"
            ></textarea>
          </div>

          <!-- Categories + Brands -->
          <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <!-- Categories -->
            <div>
              <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-navy-400">
                Categorias
              </label>
              <!-- Selected chips -->
              <div class="mb-2 flex flex-wrap gap-2">
                <span
                  v-for="cat in productCategories"
                  :key="cat.id"
                  class="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                >
                  {{ cat.name }}
                  <button
                    class="flex h-4 w-4 items-center justify-center rounded-full bg-primary/20 text-primary transition-colors hover:bg-primary hover:text-white"
                    @click="removeCategory(cat.id)"
                  >
                    <em class="fa-solid fa-xmark text-[9px]"></em>
                  </button>
                </span>
                <span
                  v-if="productCategories.length === 0"
                  class="text-xs text-slate-400 dark:text-navy-500"
                >
                  Nenhuma categoria
                </span>
              </div>
              <!-- Search input -->
              <div class="relative">
                <input
                  v-model="categorySearch"
                  type="text"
                  placeholder="Buscar e adicionar categorias..."
                  class="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all focus:border-primary focus:bg-white dark:border-navy-700 dark:bg-navy-800 dark:text-navy-100 dark:focus:border-primary dark:focus:bg-navy-750"
                  @focus="showCategoryDropdown = true"
                  @blur="hideCategoryDropdown()"
                />
                <div
                  v-if="showCategoryDropdown && filteredCategories.length > 0"
                  class="absolute left-0 top-full z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg dark:border-navy-700 dark:bg-navy-750"
                >
                  <button
                    v-for="cat in filteredCategories.slice(0, 10)"
                    :key="cat.id"
                    class="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 transition-colors hover:bg-primary/5 hover:text-primary dark:text-navy-200 dark:hover:bg-primary/10"
                    @mousedown.prevent="addCategory(cat)"
                  >
                    <em class="fa-light fa-folder text-xs text-slate-400"></em>
                    {{ cat.name }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Brands -->
            <div>
              <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-navy-400">
                Marcas
              </label>
              <!-- Selected chips -->
              <div class="mb-2 flex flex-wrap gap-2">
                <span
                  v-for="brand in productBrands"
                  :key="brand.id"
                  class="inline-flex items-center gap-1.5 rounded-full bg-info/10 px-3 py-1 text-xs font-medium text-info"
                >
                  {{ brand.name }}
                  <button
                    class="flex h-4 w-4 items-center justify-center rounded-full bg-info/20 text-info transition-colors hover:bg-info hover:text-white"
                    @click="removeBrand(brand.id)"
                  >
                    <em class="fa-solid fa-xmark text-[9px]"></em>
                  </button>
                </span>
                <span
                  v-if="productBrands.length === 0"
                  class="text-xs text-slate-400 dark:text-navy-500"
                >
                  Nenhuma marca
                </span>
              </div>
              <!-- Search input -->
              <div class="relative">
                <input
                  v-model="brandSearch"
                  type="text"
                  placeholder="Buscar e adicionar marcas..."
                  class="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all focus:border-primary focus:bg-white dark:border-navy-700 dark:bg-navy-800 dark:text-navy-100 dark:focus:border-primary dark:focus:bg-navy-750"
                  @focus="showBrandDropdown = true"
                  @blur="hideBrandDropdown()"
                />
                <div
                  v-if="showBrandDropdown && filteredBrands.length > 0"
                  class="absolute left-0 top-full z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg dark:border-navy-700 dark:bg-navy-750"
                >
                  <button
                    v-for="brand in filteredBrands.slice(0, 10)"
                    :key="brand.id"
                    class="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 transition-colors hover:bg-info/5 hover:text-info dark:text-navy-200 dark:hover:bg-info/10"
                    @mousedown.prevent="addBrand(brand)"
                  >
                    <em class="fa-light fa-tag text-xs text-slate-400"></em>
                    {{ brand.name }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Toggles row -->
          <div class="flex flex-wrap gap-6 rounded-xl bg-slate-50 p-4 dark:bg-navy-800">
            <!-- Virtual -->
            <label class="flex cursor-pointer items-center gap-3">
              <span class="relative inline-flex h-6 w-11 flex-shrink-0">
                <input
                  v-model="form.isVirtual"
                  type="checkbox"
                  class="peer sr-only"
                  @change="markDirty()"
                />
                <span
                  class="absolute inset-0 rounded-full bg-slate-300 transition-colors peer-checked:bg-primary dark:bg-navy-600"
                ></span>
                <span
                  class="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5"
                ></span>
              </span>
              <span class="text-sm font-medium text-slate-700 dark:text-navy-200">Produto Virtual</span>
            </label>

            <!-- Shippable -->
            <label class="flex cursor-pointer items-center gap-3">
              <span class="relative inline-flex h-6 w-11 flex-shrink-0">
                <input
                  v-model="form.shippable"
                  type="checkbox"
                  class="peer sr-only"
                  @change="markDirty()"
                />
                <span
                  class="absolute inset-0 rounded-full bg-slate-300 transition-colors peer-checked:bg-primary dark:bg-navy-600"
                ></span>
                <span
                  class="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5"
                ></span>
              </span>
              <span class="text-sm font-medium text-slate-700 dark:text-navy-200">Frete habilitado</span>
            </label>

            <!-- Week offer -->
            <label class="flex cursor-pointer items-center gap-3">
              <span class="relative inline-flex h-6 w-11 flex-shrink-0">
                <input
                  v-model="form.weekOffer"
                  type="checkbox"
                  class="peer sr-only"
                  @change="markDirty()"
                />
                <span
                  class="absolute inset-0 rounded-full bg-slate-300 transition-colors peer-checked:bg-warning dark:bg-navy-600"
                ></span>
                <span
                  class="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5"
                ></span>
              </span>
              <span class="text-sm font-medium text-slate-700 dark:text-navy-200">Oferta da Semana</span>
            </label>
          </div>
        </div>

        <!-- ═══ TAB: Preços & Markup ═══ -->
        <div v-else-if="activeTab === 'prices'" class="space-y-6">
          <h3 class="text-base font-bold text-slate-700 dark:text-navy-200">Preços & Markup</h3>

          <!-- Price cards -->
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <!-- Regular price -->
            <div class="rounded-2xl border-2 border-slate-200 bg-slate-50 p-5 transition-all focus-within:border-success focus-within:bg-success/5 dark:border-navy-700 dark:bg-navy-800 dark:focus-within:border-success dark:focus-within:bg-success/5">
              <p class="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-navy-400">
                <em class="fa-light fa-tag text-success"></em>
                Preço de Venda
              </p>
              <div class="flex items-baseline gap-2">
                <span class="text-lg font-semibold text-slate-400 dark:text-navy-500">R$</span>
                <input
                  :value="regularPriceDisplay"
                  type="text"
                  inputmode="numeric"
                  class="flex-1 bg-transparent text-3xl font-bold text-success outline-none placeholder-slate-300"
                  placeholder="0,00"
                  @input="onRegularPriceInput"
                />
              </div>
            </div>

            <!-- Compare at price -->
            <div class="rounded-2xl border-2 border-slate-200 bg-slate-50 p-5 transition-all focus-within:border-warning focus-within:bg-warning/5 dark:border-navy-700 dark:bg-navy-800 dark:focus-within:border-warning dark:focus-within:bg-warning/5">
              <p class="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-navy-400">
                <em class="fa-light fa-badge-percent text-warning"></em>
                Preço Comparado <span class="font-normal normal-case tracking-normal">(De)</span>
              </p>
              <div class="flex items-baseline gap-2">
                <span class="text-lg font-semibold text-slate-400 dark:text-navy-500">R$</span>
                <input
                  :value="compareAtPriceDisplay"
                  type="text"
                  inputmode="numeric"
                  class="flex-1 bg-transparent text-3xl font-bold text-warning outline-none placeholder-slate-300"
                  placeholder="0,00"
                  @input="onCompareAtPriceInput"
                />
              </div>
            </div>
          </div>

          <!-- Markup calculator -->
          <div class="rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-navy-700 dark:bg-navy-800">
            <h4 class="mb-4 flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-navy-200">
              <em class="fa-light fa-calculator text-primary"></em>
              Calculadora de Markup
            </h4>

            <!-- Cost input -->
            <div class="mb-5">
              <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-navy-400">
                Custo do Produto (R$)
              </label>
              <div class="flex items-baseline gap-2 rounded-xl border-2 border-slate-200 bg-white px-4 py-3 transition-all focus-within:border-primary dark:border-navy-700 dark:bg-navy-750 dark:focus-within:border-primary">
                <span class="text-sm font-semibold text-slate-400">R$</span>
                <input
                  v-model="costInput"
                  type="text"
                  inputmode="numeric"
                  class="flex-1 bg-transparent text-lg font-bold text-slate-700 outline-none placeholder-slate-300 dark:text-navy-100"
                  placeholder="0,00"
                />
              </div>
            </div>

            <!-- Markup bar -->
            <div v-if="costCents > 0" class="mb-5">
              <div class="mb-2 flex items-center justify-between">
                <span class="text-xs text-slate-500 dark:text-navy-400">Markup</span>
                <span class="text-sm font-bold" :class="markupTextColor">
                  {{ markup.toFixed(1) }}%
                </span>
              </div>
              <div class="h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-navy-700">
                <div
                  class="h-3 rounded-full bg-gradient-to-r transition-all duration-500"
                  :class="markupColor"
                  :style="{ width: markupBarWidth + '%' }"
                ></div>
              </div>
              <p class="mt-1.5 text-[11px] text-slate-400 dark:text-navy-500">
                Varejo mínimo 30% · Varejo ideal 50–100%
              </p>
            </div>

            <!-- Stats row -->
            <div v-if="costCents > 0" class="mb-5 grid grid-cols-3 gap-3">
              <div class="rounded-xl bg-white p-3 text-center shadow-sm dark:bg-navy-750">
                <p class="text-[10px] uppercase tracking-wide text-slate-400 dark:text-navy-500">Markup</p>
                <p class="mt-1 text-lg font-bold" :class="markupTextColor">
                  {{ markup.toFixed(1) }}%
                </p>
              </div>
              <div class="rounded-xl bg-white p-3 text-center shadow-sm dark:bg-navy-750">
                <p class="text-[10px] uppercase tracking-wide text-slate-400 dark:text-navy-500">Margem</p>
                <p class="mt-1 text-lg font-bold" :class="markupTextColor">
                  {{ margin.toFixed(1) }}%
                </p>
              </div>
              <div class="rounded-xl bg-white p-3 text-center shadow-sm dark:bg-navy-750">
                <p class="text-[10px] uppercase tracking-wide text-slate-400 dark:text-navy-500">Lucro</p>
                <p class="mt-1 text-lg font-bold" :class="markupTextColor">
                  {{ formatCurrency(profitPerUnit) }}
                </p>
              </div>
            </div>

            <!-- Suggest buttons -->
            <div v-if="costCents > 0" class="flex flex-wrap gap-3">
              <button
                class="flex items-center gap-2 rounded-xl border-2 border-warning/30 bg-warning/10 px-4 py-2 text-sm font-semibold text-warning transition-all hover:bg-warning hover:text-white"
                @click="suggestPrice(50)"
              >
                <em class="fa-light fa-wand-magic-sparkles text-xs"></em>
                Sugerir para 50% markup
              </button>
              <button
                class="flex items-center gap-2 rounded-xl border-2 border-success/30 bg-success/10 px-4 py-2 text-sm font-semibold text-success transition-all hover:bg-success hover:text-white"
                @click="suggestPrice(100)"
              >
                <em class="fa-light fa-wand-magic-sparkles text-xs"></em>
                Sugerir para 100% markup
              </button>
            </div>

            <!-- Hint when no cost -->
            <p
              v-if="costCents === 0"
              class="text-center text-sm text-slate-400 dark:text-navy-500"
            >
              Informe o custo do produto para ver os cálculos de markup.
            </p>
          </div>
        </div>

        <!-- ═══ TAB: Variantes ═══ -->
        <div v-else-if="activeTab === 'variants'" class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-base font-bold text-slate-700 dark:text-navy-200">Variantes</h3>
            <button
              class="flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
              @click="addNewVariant"
            >
              <em class="fa-light fa-plus text-xs"></em>
              Adicionar variante
            </button>
          </div>

          <!-- Empty state -->
          <div
            v-if="variants.filter(v => !v.isDeleted).length === 0"
            class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-12 dark:border-navy-700 dark:bg-navy-800"
          >
            <em class="fa-light fa-layer-group text-4xl text-slate-300 dark:text-navy-600"></em>
            <p class="mt-3 text-sm font-medium text-slate-500 dark:text-navy-400">
              Nenhuma variante cadastrada
            </p>
            <p class="mt-1 text-xs text-slate-400 dark:text-navy-500">
              Clique em "Adicionar variante" para começar
            </p>
          </div>

          <!-- Variant cards -->
          <div
            v-for="(variant, index) in variants"
            :key="index"
            v-show="!variant.isDeleted"
            class="rounded-xl border border-slate-200 p-4 transition-all hover:border-primary/40 dark:border-navy-700 dark:hover:border-primary/40"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1 space-y-3">
                <!-- Name -->
                <div>
                  <label class="mb-1 block text-xs font-semibold text-slate-500 dark:text-navy-400">
                    Nome da Variante
                  </label>
                  <input
                    v-model="variant.name"
                    type="text"
                    class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition-all focus:border-primary focus:bg-white dark:border-navy-700 dark:bg-navy-800 dark:text-navy-100 dark:focus:border-primary dark:focus:bg-navy-750"
                    placeholder="Ex: Tamanho M – Cor Azul"
                    @input="markDirty()"
                  />
                </div>

                <!-- Option values -->
                <div>
                  <label class="mb-1 block text-xs font-semibold text-slate-500 dark:text-navy-400">
                    Atributos (chave : valor)
                  </label>
                  <div class="space-y-2">
                    <div
                      v-for="(pair, pairIdx) in variant.optionValues"
                      :key="pairIdx"
                      class="flex items-center gap-2"
                    >
                      <input
                        v-model="pair.key"
                        type="text"
                        class="w-32 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none transition-all focus:border-primary focus:bg-white dark:border-navy-700 dark:bg-navy-800 dark:text-navy-100"
                        placeholder="chave"
                        @input="markDirty()"
                      />
                      <em class="fa-light fa-colon text-slate-300 dark:text-navy-600 text-xs"></em>
                      <input
                        v-model="pair.value"
                        type="text"
                        class="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none transition-all focus:border-primary focus:bg-white dark:border-navy-700 dark:bg-navy-800 dark:text-navy-100"
                        placeholder="valor"
                        @input="markDirty()"
                      />
                      <button
                        class="flex h-7 w-7 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-error/10 hover:text-error dark:text-navy-600"
                        @click="removeOptionPair(variant, pairIdx)"
                      >
                        <em class="fa-solid fa-xmark text-xs"></em>
                      </button>
                    </div>
                    <button
                      class="flex items-center gap-1 text-xs text-slate-400 transition-colors hover:text-primary dark:text-navy-500"
                      @click="addOptionPair(variant)"
                    >
                      <em class="fa-light fa-plus text-[10px]"></em>
                      Adicionar atributo
                    </button>
                  </div>
                </div>

                <!-- Price + Stock row -->
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="mb-1 block text-xs font-semibold text-slate-500 dark:text-navy-400">
                      Preço (R$)
                    </label>
                    <div class="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 transition-all focus-within:border-primary dark:border-navy-700 dark:bg-navy-800 dark:focus-within:border-primary">
                      <span class="text-xs text-slate-400">R$</span>
                      <input
                        :value="variant.priceDisplay"
                        type="text"
                        inputmode="numeric"
                        class="flex-1 bg-transparent text-sm font-semibold text-success outline-none placeholder-slate-300"
                        placeholder="0,00"
                        @input="(e) => onVariantPriceInput(variant, e)"
                      />
                    </div>
                  </div>
                  <div>
                    <label class="mb-1 block text-xs font-semibold text-slate-500 dark:text-navy-400">
                      Estoque
                    </label>
                    <input
                      v-model.number="variant.stock"
                      type="number"
                      min="0"
                      class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition-all focus:border-primary focus:bg-white dark:border-navy-700 dark:bg-navy-800 dark:text-navy-100"
                      @input="markDirty()"
                    />
                  </div>
                </div>

                <!-- Published toggle -->
                <label class="flex cursor-pointer items-center gap-2">
                  <span class="relative inline-flex h-5 w-9 flex-shrink-0">
                    <input
                      v-model="variant.published"
                      type="checkbox"
                      class="peer sr-only"
                      @change="markDirty()"
                    />
                    <span
                      class="absolute inset-0 rounded-full bg-slate-300 transition-colors peer-checked:bg-primary dark:bg-navy-600"
                    ></span>
                    <span
                      class="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4"
                    ></span>
                  </span>
                  <span class="text-xs font-medium text-slate-600 dark:text-navy-300">Publicada</span>
                </label>
              </div>

              <!-- Delete button -->
              <button
                class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-error/10 hover:text-error dark:text-navy-600 dark:hover:bg-error/10"
                title="Remover variante"
                @click="removeVariantRow(index)"
              >
                <em class="fa-light fa-trash-can text-sm"></em>
              </button>
            </div>

            <!-- New badge -->
            <div
              v-if="variant.isNew"
              class="mt-3 inline-flex items-center gap-1 rounded-full bg-info/10 px-2.5 py-0.5 text-[10px] font-semibold text-info"
            >
              <em class="fa-solid fa-circle text-[6px]"></em>
              Nova – será salva ao clicar em Salvar
            </div>
          </div>
        </div>

        <!-- ═══ TAB: Estoque ═══ -->
        <div v-else-if="activeTab === 'stock'" class="space-y-6">
          <h3 class="text-base font-bold text-slate-700 dark:text-navy-200">Controle de Estoque</h3>

          <!-- Big stock number control -->
          <div class="flex flex-col items-center rounded-2xl border border-slate-200 bg-slate-50 p-8 dark:border-navy-700 dark:bg-navy-800">
            <p class="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-navy-400">
              Quantidade em estoque
            </p>
            <div class="flex items-center gap-4">
              <button
                class="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-slate-200 bg-white text-slate-600 transition-all hover:border-error hover:bg-error/10 hover:text-error dark:border-navy-700 dark:bg-navy-750 dark:text-navy-300 dark:hover:border-error"
                @click="form.stock = Math.max(0, form.stock - 1); markDirty()"
              >
                <em class="fa-solid fa-minus text-sm"></em>
              </button>
              <input
                v-model.number="form.stock"
                type="number"
                min="0"
                class="w-28 rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-center text-3xl font-bold text-slate-800 outline-none transition-all focus:border-primary dark:border-navy-700 dark:bg-navy-750 dark:text-navy-100 dark:focus:border-primary"
                @input="markDirty()"
              />
              <button
                class="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-slate-200 bg-white text-slate-600 transition-all hover:border-success hover:bg-success/10 hover:text-success dark:border-navy-700 dark:bg-navy-750 dark:text-navy-300 dark:hover:border-success"
                @click="form.stock += 1; markDirty()"
              >
                <em class="fa-solid fa-plus text-sm"></em>
              </button>
            </div>
            <p class="mt-3 text-xs text-slate-400 dark:text-navy-500">
              {{ form.stock > 0 ? 'Em estoque' : 'Sem estoque' }}
            </p>
          </div>

          <!-- Options -->
          <div class="space-y-4">
            <!-- Allow out of stock purchases -->
            <div class="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-navy-700 dark:bg-navy-800">
              <div>
                <p class="text-sm font-semibold text-slate-700 dark:text-navy-200">
                  Permitir compra sem estoque
                </p>
                <p class="mt-0.5 text-xs text-slate-400 dark:text-navy-500">
                  Clientes poderão comprar mesmo sem estoque disponível
                </p>
              </div>
              <label class="flex cursor-pointer items-center">
                <span class="relative inline-flex h-6 w-11">
                  <input
                    v-model="form.allowOutOfStockPurchases"
                    type="checkbox"
                    class="peer sr-only"
                    @change="markDirty()"
                  />
                  <span
                    class="absolute inset-0 rounded-full bg-slate-300 transition-colors peer-checked:bg-primary dark:bg-navy-600"
                  ></span>
                  <span
                    class="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5"
                  ></span>
                </span>
              </label>
            </div>

            <!-- Priority -->
            <div>
              <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-navy-400">
                Prioridade de exibição
              </label>
              <input
                v-model.number="form.priority"
                type="number"
                class="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition-all focus:border-primary focus:bg-white dark:border-navy-700 dark:bg-navy-800 dark:text-navy-100 dark:focus:border-primary dark:focus:bg-navy-750"
                placeholder="0"
                @input="markDirty()"
              />
              <p class="mt-1 text-xs text-slate-400 dark:text-navy-500">
                Valores maiores aparecem primeiro. Padrão: 0.
              </p>
            </div>

            <!-- Warehouses -->
            <div>
              <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-navy-400">
                Depósitos
              </label>
              <!-- Selected warehouses chips -->
              <div class="mb-2 flex flex-wrap gap-2">
                <span
                  v-for="wh in productWarehouses"
                  :key="wh.id"
                  class="inline-flex items-center gap-1.5 rounded-full bg-slate-200 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-navy-700 dark:text-navy-200"
                >
                  <em class="fa-light fa-warehouse text-[10px]"></em>
                  {{ wh.name }}
                  <button
                    class="flex h-4 w-4 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-error/20 hover:text-error"
                    @click="removeWarehouse(wh.id)"
                  >
                    <em class="fa-solid fa-xmark text-[9px]"></em>
                  </button>
                </span>
                <span
                  v-if="productWarehouses.length === 0"
                  class="text-xs text-slate-400 dark:text-navy-500"
                >
                  Nenhum depósito associado
                </span>
              </div>
              <!-- Dropdown -->
              <div class="relative">
                <input
                  v-model="warehouseSearch"
                  type="text"
                  placeholder="Adicionar depósito..."
                  class="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all focus:border-primary focus:bg-white dark:border-navy-700 dark:bg-navy-800 dark:text-navy-100 dark:focus:border-primary dark:focus:bg-navy-750"
                  @focus="showWarehouseDropdown = true"
                  @blur="hideWarehouseDropdown()"
                />
                <div
                  v-if="showWarehouseDropdown && filteredWarehouses.length > 0"
                  class="absolute left-0 top-full z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg dark:border-navy-700 dark:bg-navy-750"
                >
                  <button
                    v-for="wh in filteredWarehouses.slice(0, 10)"
                    :key="wh.id"
                    class="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 transition-colors hover:bg-primary/5 hover:text-primary dark:text-navy-200 dark:hover:bg-primary/10"
                    @mousedown.prevent="addWarehouse(wh)"
                  >
                    <em class="fa-light fa-warehouse text-xs text-slate-400"></em>
                    {{ wh.name }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ═══ TAB: Fiscal ═══ -->
        <div v-else-if="activeTab === 'fiscal'" class="space-y-6">
          <h3 class="text-base font-bold text-slate-700 dark:text-navy-200">Dados Fiscais</h3>

          <!-- NCM -->
          <div>
            <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-navy-400">
              NCM – Nomenclatura Comum do Mercosul
            </label>
            <input
              v-model="form.ncm"
              type="text"
              class="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition-all focus:border-primary focus:bg-white dark:border-navy-700 dark:bg-navy-800 dark:text-navy-100 dark:focus:border-primary dark:focus:bg-navy-750"
              placeholder="Ex: 8471.30.12"
              @input="markDirty()"
            />
          </div>

          <!-- ICMS Origem -->
          <div>
            <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-navy-400">
              ICMS Origem
            </label>
            <select
              v-model.number="form.icmsOrigem"
              class="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition-all focus:border-primary focus:bg-white dark:border-navy-700 dark:bg-navy-800 dark:text-navy-100 dark:focus:border-primary dark:focus:bg-navy-750"
              @change="markDirty()"
            >
              <option
                v-for="opt in icmsOrigemOptions"
                :key="opt.value"
                :value="opt.value"
              >
                {{ opt.label }}
              </option>
            </select>
          </div>

          <!-- Tributações -->
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-navy-400">
                ICMS Tributação (CST)
              </label>
              <input
                v-model="form.icmsTributeSituations"
                type="text"
                class="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition-all focus:border-primary focus:bg-white dark:border-navy-700 dark:bg-navy-800 dark:text-navy-100 dark:focus:border-primary dark:focus:bg-navy-750"
                placeholder="Ex: 00"
                @input="markDirty()"
              />
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-navy-400">
                PIS Tributação (CST)
              </label>
              <input
                v-model="form.pisTributeSituations"
                type="text"
                class="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition-all focus:border-primary focus:bg-white dark:border-navy-700 dark:bg-navy-800 dark:text-navy-100 dark:focus:border-primary dark:focus:bg-navy-750"
                placeholder="Ex: 01"
                @input="markDirty()"
              />
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-navy-400">
                COFINS Tributação (CST)
              </label>
              <input
                v-model="form.cofinsTributeSituations"
                type="text"
                class="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition-all focus:border-primary focus:bg-white dark:border-navy-700 dark:bg-navy-800 dark:text-navy-100 dark:focus:border-primary dark:focus:bg-navy-750"
                placeholder="Ex: 01"
                @input="markDirty()"
              />
            </div>
          </div>

          <!-- Info note -->
          <div class="flex items-start gap-3 rounded-xl border border-info/20 bg-info/5 p-4">
            <em class="fa-light fa-circle-info mt-0.5 text-info"></em>
            <p class="text-xs text-slate-600 dark:text-navy-300">
              Os dados fiscais são utilizados na emissão de NF-e e NFC-e. Consulte seu contador para os valores corretos de CST e NCM para cada produto.
            </p>
          </div>
        </div>

        <!-- ═══ TAB: SEO ═══ -->
        <div v-else-if="activeTab === 'seo'" class="space-y-6">
          <h3 class="text-base font-bold text-slate-700 dark:text-navy-200">SEO & Metadados</h3>

          <!-- Meta title -->
          <div>
            <div class="mb-1.5 flex items-center justify-between">
              <label class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-navy-400">
                Meta Title
              </label>
              <span
                class="text-xs font-medium"
                :class="metaTitleCount > 60 ? 'text-error' : metaTitleCount > 50 ? 'text-warning' : 'text-slate-400 dark:text-navy-500'"
              >
                {{ metaTitleCount }}/60
              </span>
            </div>
            <input
              v-model="form.metaTitle"
              type="text"
              class="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition-all focus:border-primary focus:bg-white dark:border-navy-700 dark:bg-navy-800 dark:text-navy-100 dark:focus:border-primary dark:focus:bg-navy-750"
              placeholder="Título para mecanismos de busca"
              @input="markDirty()"
            />
            <p v-if="metaTitleCount > 60" class="mt-1 text-xs text-error">
              <em class="fa-solid fa-triangle-exclamation mr-1"></em>
              Título muito longo. Recomendado: até 60 caracteres.
            </p>
          </div>

          <!-- Meta description -->
          <div>
            <div class="mb-1.5 flex items-center justify-between">
              <label class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-navy-400">
                Meta Description
              </label>
              <span
                class="text-xs font-medium"
                :class="metaDescCount > 160 ? 'text-error' : metaDescCount > 140 ? 'text-warning' : 'text-slate-400 dark:text-navy-500'"
              >
                {{ metaDescCount }}/160
              </span>
            </div>
            <textarea
              v-model="form.metaDescription"
              rows="3"
              class="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition-all focus:border-primary focus:bg-white dark:border-navy-700 dark:bg-navy-800 dark:text-navy-100 dark:focus:border-primary dark:focus:bg-navy-750"
              placeholder="Descrição para mecanismos de busca"
              style="resize: vertical"
              @input="markDirty()"
            ></textarea>
            <p v-if="metaDescCount > 160" class="mt-1 text-xs text-error">
              <em class="fa-solid fa-triangle-exclamation mr-1"></em>
              Descrição muito longa. Recomendado: até 160 caracteres.
            </p>
          </div>

          <!-- Meta keywords -->
          <div>
            <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-navy-400">
              Meta Keywords
            </label>
            <input
              v-model="form.metaKeywords"
              type="text"
              class="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition-all focus:border-primary focus:bg-white dark:border-navy-700 dark:bg-navy-800 dark:text-navy-100 dark:focus:border-primary dark:focus:bg-navy-750"
              placeholder="palavra1, palavra2, palavra3"
              @input="markDirty()"
            />
          </div>

          <!-- Google preview -->
          <div>
            <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-navy-400">
              Prévia nos resultados de busca
            </p>
            <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-navy-700 dark:bg-navy-750">
              <!-- URL line -->
              <p class="mb-1 text-xs text-success truncate">
                www.sualoja.com.br / {{ form.slug || 'produto' }}
              </p>
              <!-- Title -->
              <p class="text-base font-medium text-blue-600 hover:underline cursor-pointer line-clamp-1">
                {{ form.metaTitle || form.name || 'Título do produto' }}
              </p>
              <!-- Description -->
              <p class="mt-1 text-sm text-slate-500 dark:text-navy-400 line-clamp-2">
                {{ form.metaDescription || form.shortDescription || form.description || 'Descrição do produto aparecerá aqui nos resultados de busca do Google.' }}
              </p>
            </div>
          </div>
        </div>

        <!-- ═══ TAB: Elastic ═══ -->
        <div v-else-if="activeTab === 'elastic'" class="space-y-6">
          <div class="flex items-center justify-between">
            <h3 class="text-base font-bold text-slate-700 dark:text-navy-200">Índice Elasticsearch</h3>
            <button
              class="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600 transition-all hover:border-primary hover:bg-primary/5 hover:text-primary dark:border-navy-700 dark:bg-navy-800 dark:text-navy-300 dark:hover:border-primary dark:hover:text-primary"
              :disabled="elasticLoading"
              @click="loadElasticHit"
            >
              <em
                :class="elasticLoading ? 'fa-duotone fa-spinner-third animate-spin' : 'fa-light fa-rotate'"
                class="text-xs"
              ></em>
              Recarregar do índice
            </button>
          </div>

          <!-- Status card -->
          <div
            class="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-navy-700 dark:bg-navy-800"
          >
            <span
              class="flex h-9 w-9 items-center justify-center rounded-full"
              :class="elasticHit ? 'bg-success/10' : 'bg-slate-200 dark:bg-navy-700'"
            >
              <em
                class="text-sm"
                :class="elasticHit ? 'fa-solid fa-circle-check text-success' : 'fa-light fa-circle-xmark text-slate-400'"
              ></em>
            </span>
            <div>
              <p class="text-sm font-semibold text-slate-700 dark:text-navy-200">
                Status:
                <span :class="elasticHit ? 'text-success' : 'text-slate-400 dark:text-navy-400'">
                  {{ elasticHit ? 'Indexado' : 'Não encontrado no índice' }}
                </span>
              </p>
              <p class="text-xs text-slate-400 dark:text-navy-500">
                {{ elasticHit ? 'Este produto está visível na busca da loja.' : 'O produto pode não aparecer na busca da loja.' }}
              </p>
            </div>
          </div>

          <!-- Loading -->
          <div
            v-if="elasticLoading"
            class="flex items-center justify-center py-8"
          >
            <em class="fa-duotone fa-spinner-third animate-spin text-2xl text-primary"></em>
          </div>

          <!-- Hit data viewer -->
          <div
            v-else-if="elasticHit"
            class="rounded-xl border border-slate-200 bg-slate-50 dark:border-navy-700 dark:bg-navy-800 overflow-hidden"
          >
            <div class="border-b border-slate-200 bg-white px-4 py-3 dark:border-navy-700 dark:bg-navy-750">
              <p class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-navy-400">
                Dados do índice
              </p>
            </div>
            <div class="divide-y divide-slate-100 dark:divide-navy-700">
              <div class="flex items-center justify-between px-4 py-3">
                <span class="text-xs font-medium text-slate-500 dark:text-navy-400">id</span>
                <span class="font-mono text-xs text-slate-700 dark:text-navy-200">{{ elasticHit.id }}</span>
              </div>
              <div class="flex items-center justify-between px-4 py-3">
                <span class="text-xs font-medium text-slate-500 dark:text-navy-400">name</span>
                <span class="text-xs text-slate-700 dark:text-navy-200">{{ elasticHit.name }}</span>
              </div>
              <div class="flex items-center justify-between px-4 py-3">
                <span class="text-xs font-medium text-slate-500 dark:text-navy-400">price</span>
                <span class="text-xs font-semibold text-success">{{ formatCurrency(elasticHit.price) }}</span>
              </div>
              <div class="flex items-center justify-between px-4 py-3">
                <span class="text-xs font-medium text-slate-500 dark:text-navy-400">inStock</span>
                <span
                  class="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                  :class="elasticHit.inStock ? 'bg-success/10 text-success' : 'bg-error/10 text-error'"
                >
                  {{ elasticHit.inStock }}
                </span>
              </div>
              <div class="flex items-center justify-between px-4 py-3">
                <span class="text-xs font-medium text-slate-500 dark:text-navy-400">hasVariants</span>
                <span
                  class="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                  :class="elasticHit.hasVariants ? 'bg-info/10 text-info' : 'bg-slate-100 text-slate-500 dark:bg-navy-700 dark:text-navy-400'"
                >
                  {{ elasticHit.hasVariants }}
                </span>
              </div>
            </div>
          </div>

          <!-- Empty state -->
          <div
            v-else-if="!elasticLoading"
            class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-12 dark:border-navy-700 dark:bg-navy-800"
          >
            <em class="fa-light fa-bolt text-4xl text-slate-300 dark:text-navy-600"></em>
            <p class="mt-3 text-sm font-medium text-slate-500 dark:text-navy-400">
              Produto não encontrado no índice
            </p>
            <p class="mt-1 text-xs text-slate-400 dark:text-navy-500">
              Tente recarregar ou verifique se o produto está publicado
            </p>
          </div>
        </div>

      </div>
      <!-- End tab content -->

    </div>
  </DefaultLayout>
</template>
