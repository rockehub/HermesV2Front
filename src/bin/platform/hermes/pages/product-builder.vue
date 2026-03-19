<script lang="ts" setup>
import DefaultLayout from '@/bin/platform/hermes/layouts/default.vue'
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount, type Ref } from 'vue'
import { useRouter } from 'vue-router'
import { $axios } from '@/helpers/integration/integration'

const router = useRouter()

// ── Types ────────────────────────────────────────────────────────────────────
type Category = { id: string; name: string }
type Brand = { id: string; name: string }
type Variant = { name: string; price: string; stock: number }

// ── Wizard state ─────────────────────────────────────────────────────────────
const currentStep = ref(1)
const direction = ref<'forward' | 'backward'>('forward')
const totalSteps = 5

const steps = [
  { number: 1, label: 'Identidade' },
  { number: 2, label: 'Conteúdo' },
  { number: 3, label: 'Preços & Estoque' },
  { number: 4, label: 'Variantes' },
  { number: 5, label: 'Revisão' }
]

// ── Step 1 ───────────────────────────────────────────────────────────────────
const name = ref('')
const slug = ref('')
const slugManuallyEdited = ref(false)

type Vendor = { id: string; name: string }
type Unit   = { id: string; code: string }

const allCategories  = ref<Category[]>([])
const allBrands      = ref<Brand[]>([])
const allVendors     = ref<Vendor[]>([])
const allUnits       = ref<Unit[]>([])
const allWarehouses  = ref<WareHouse[]>([])
const selectedCategories = ref<Category[]>([])
const selectedBrands     = ref<Brand[]>([])
type WareHouse = { id: string; name: string }
const selectedVendor     = ref<Vendor | null>(null)
const selectedUnit       = ref<Unit | null>(null)
const selectedWarehouses = ref<WareHouse[]>([])

const categorySearch  = ref('')
const brandSearch     = ref('')
const vendorSearch    = ref('')
const unitSearch      = ref('')
const warehouseSearch = ref('')

const categoryOpen  = ref(false)
const brandOpen     = ref(false)
const vendorOpen    = ref(false)
const unitOpen      = ref(false)
const warehouseOpen = ref(false)

const filteredCategories = computed(() =>
  allCategories.value.filter(
    (c) =>
      c.name.toLowerCase().includes(categorySearch.value.toLowerCase()) &&
      !selectedCategories.value.find((s) => s.id === c.id)
  )
)
const filteredBrands = computed(() =>
  allBrands.value.filter(
    (b) =>
      b.name.toLowerCase().includes(brandSearch.value.toLowerCase()) &&
      !selectedBrands.value.find((s) => s.id === b.id)
  )
)
const filteredVendors = computed(() =>
  allVendors.value.filter((v) =>
    v.name.toLowerCase().includes(vendorSearch.value.toLowerCase())
  )
)
const filteredUnits = computed(() =>
  allUnits.value.filter((u) =>
    u.code.toLowerCase().includes(unitSearch.value.toLowerCase())
  )
)
const filteredWarehouses = computed(() =>
  allWarehouses.value.filter(
    (w) =>
      w.name.toLowerCase().includes(warehouseSearch.value.toLowerCase()) &&
      !selectedWarehouses.value.find((s) => s.id === w.id)
  )
)

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

watch(name, (val) => {
  if (!slugManuallyEdited.value) {
    slug.value = slugify(val)
  }
})

function onSlugInput() {
  slugManuallyEdited.value = true
  slug.value = slugify(slug.value)
}

function addCategory(cat: Category) {
  selectedCategories.value.push(cat)
  categorySearch.value = ''
}
function removeCategory(id: string) {
  selectedCategories.value = selectedCategories.value.filter((c) => c.id !== id)
}
function addBrand(brand: Brand) {
  selectedBrands.value.push(brand)
  brandSearch.value = ''
}
function removeBrand(id: string) {
  selectedBrands.value = selectedBrands.value.filter((b) => b.id !== id)
}
function selectVendor(vendor: Vendor) {
  selectedVendor.value = vendor
  vendorSearch.value   = vendor.name
  vendorOpen.value     = false
}
function clearVendor() {
  selectedVendor.value = null
  vendorSearch.value   = ''
}
function selectUnit(unit: Unit) {
  selectedUnit.value = unit
  unitSearch.value   = unit.code
  unitOpen.value     = false
}
function clearUnit() {
  selectedUnit.value = null
  unitSearch.value   = ''
}
function addWarehouse(wh: WareHouse) {
  selectedWarehouses.value.push(wh)
  warehouseSearch.value = ''
}
function removeWarehouse(id: string) {
  selectedWarehouses.value = selectedWarehouses.value.filter((w) => w.id !== id)
}

// ── Step 2 ───────────────────────────────────────────────────────────────────
const shortDescription = ref('')
const description = ref('')
const isVirtual = ref(false)
const shippable = ref(true)
const weekOffer = ref(false)

// ── Fiscal (Step 2) ──────────────────────────────────────────────────────────
const ncm = ref('')
const icmsOrigem = ref('0')
const icmsTributeSituations = ref('')
const pisTributeSituations = ref('')
const cofinsTributeSituations = ref('')

// ── Step 3 ───────────────────────────────────────────────────────────────────
const regularPriceDisplay = ref('')
const comparePriceDisplay = ref('')
const stock = ref(0)
const allowOutOfStock = ref(false)
const priority = ref<number | null>(null)

function parseCents(display: string): number {
  const digits = display.replace(/\D/g, '')
  return parseInt(digits || '0', 10)
}

function formatCurrency(display: string): string {
  const digits = display.replace(/\D/g, '')
  if (!digits) return ''
  const cents = parseInt(digits, 10)
  return (cents / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

function onPriceInput(field: 'regular' | 'compare', event: Event) {
  const raw = (event.target as HTMLInputElement).value
  if (field === 'regular') {
    regularPriceDisplay.value = formatCurrency(raw)
  } else {
    comparePriceDisplay.value = formatCurrency(raw)
  }
}

// ── Step 4 ───────────────────────────────────────────────────────────────────
const variants = ref<Variant[]>([])

function addVariant() {
  variants.value.push({ name: '', price: '', stock: 0 })
}
function removeVariant(idx: number) {
  variants.value.splice(idx, 1)
}
function onVariantPriceInput(idx: number, event: Event) {
  const raw = (event.target as HTMLInputElement).value
  variants.value[idx].price = formatCurrency(raw)
}

// ── Step 5 ───────────────────────────────────────────────────────────────────
const published = ref(true)
const available = ref(true)
const seoOpen = ref(false)
const metaTitle = ref('')
const metaDesc = ref('')
const metaKeywords = ref('')

// ── Saving state ─────────────────────────────────────────────────────────────
const saving = ref(false)
const saveStep = ref('')
const saveProgress = ref(0)
const saveError = ref<string | null>(null)
const createdId = ref<string | null>(null)

const saveSteps = [
  'Criando produto...',
  'Configurando preços...',
  'Criando variantes...',
  'Concluído!'
]

// ── Validation ───────────────────────────────────────────────────────────────
const errors = ref<Record<string, string>>({})

function validateStep(step: number): boolean {
  errors.value = {}
  if (step === 1) {
    if (!name.value || name.value.trim().length < 2) {
      errors.value.name = 'O nome é obrigatório e deve ter pelo menos 2 caracteres.'
    }
    return !errors.value.name
  }
  if (step === 2) return true
  if (step === 3) {
    const cents = parseCents(regularPriceDisplay.value)
    if (cents <= 0) {
      errors.value.price = 'O preço regular é obrigatório e deve ser maior que zero.'
    }
    return !errors.value.price
  }
  if (step === 4) {
    for (let i = 0; i < variants.value.length; i++) {
      const v = variants.value[i]
      if (!v.name.trim()) {
        errors.value[`variant_name_${i}`] = 'Nome obrigatório.'
      }
      if (parseCents(v.price) <= 0) {
        errors.value[`variant_price_${i}`] = 'Preço obrigatório.'
      }
    }
    return Object.keys(errors.value).length === 0
  }
  return true
}

// ── Navigation ───────────────────────────────────────────────────────────────
function goNext() {
  if (!validateStep(currentStep.value)) return
  if (currentStep.value < totalSteps) {
    direction.value = 'forward'
    currentStep.value++
  }
}
function goBack() {
  if (currentStep.value > 1) {
    direction.value = 'backward'
    currentStep.value--
  }
}
function goToStep(n: number) {
  if (n < currentStep.value) {
    direction.value = 'backward'
    currentStep.value = n
  } else if (n > currentStep.value) {
    if (validateStep(currentStep.value)) {
      direction.value = 'forward'
      currentStep.value = n
    }
  }
}

// ── API Calls ─────────────────────────────────────────────────────────────────
async function loadOptions() {
  try {
    const [catRes, brandRes, vendorRes, unitRes, whRes] = await Promise.all([
      $axios.get('/api/v1/data/productcategory?size=200&sort=name,asc'),
      $axios.get('/api/v1/data/brand?size=200&sort=name,asc'),
      $axios.get('/api/v1/data/vendor?size=200&sort=name,asc'),
      $axios.get('/api/v1/data/unit?size=200&sort=code,asc'),
      $axios.get('/api/v1/data/warehouse?size=200&sort=name,asc'),
    ])
    allCategories.value = (catRes.data?._embedded?.productcategory ?? []).map((c: any) => ({
      id: c.id ?? c._links?.self?.href?.split('/').pop(),
      name: c.name
    }))
    allBrands.value = (brandRes.data?._embedded?.brand ?? []).map((b: any) => ({
      id: b.id ?? b._links?.self?.href?.split('/').pop(),
      name: b.name
    }))
    allVendors.value = (vendorRes.data?._embedded?.vendor ?? []).map((v: any) => ({
      id: v.id ?? v._links?.self?.href?.split('/').pop(),
      name: v.name
    }))
    allUnits.value = (unitRes.data?._embedded?.unit ?? []).map((u: any) => ({
      id: u.id ?? u._links?.self?.href?.split('/').pop(),
      code: u.code
    }))
    allWarehouses.value = (whRes.data?._embedded?.warehouse ?? []).map((w: any) => ({
      id: w.id ?? w._links?.self?.href?.split('/').pop(),
      name: w.name
    }))
  } catch {
    // non-fatal — selects just stay empty
  }
}

async function save() {
  if (!validateStep(5)) return
  saving.value = true
  saveError.value = null
  saveProgress.value = 0

  try {
    // Step 1 — Create product
    saveStep.value = saveSteps[0]
    saveProgress.value = 10
    const productRes = await $axios.post('/api/v1/data/product', {
      name: name.value.trim(),
      slug: slug.value.trim(),
      shortDescription: shortDescription.value.trim() || null,
      description: description.value.trim() || null,
      isVirtual: isVirtual.value,
      shippable: isVirtual.value ? false : shippable.value,
      weekOffer: weekOffer.value,
      published: published.value,
      available: available.value,
      stock: stock.value,
      allowOutOfStockPurchases: allowOutOfStock.value,
      priority: priority.value ?? null,
      metaTitle: metaTitle.value.trim() || null,
      metaDescription: metaDesc.value.trim() || null,
      metaKeywords: metaKeywords.value.trim() || null,
      // Fiscal
      ncm: ncm.value.trim() || null,
      icmsOrigem: icmsOrigem.value || '0',
      icmsTributeSituations: icmsTributeSituations.value.trim() || null,
      pisTributeSituations: pisTributeSituations.value.trim() || null,
      cofinsTributeSituations: cofinsTributeSituations.value.trim() || null,
      // Associations
      vendor: selectedVendor.value ? `/api/v1/data/vendor/${selectedVendor.value.id}` : null,
      unit:   selectedUnit.value   ? `/api/v1/data/unit/${selectedUnit.value.id}`     : null,
    })
    const productId: string = productRes.data.id
    saveProgress.value = 25

    // Categories
    if (selectedCategories.value.length) {
      const uriList = selectedCategories.value
        .map((c) => `/api/v1/data/productcategory/${c.id}`)
        .join('\n')
      await $axios.put(`/api/v1/data/product/${productId}/categories`, uriList, {
        headers: { 'Content-Type': 'text/uri-list' }
      })
    }
    saveProgress.value = 35

    // Brands
    if (selectedBrands.value.length) {
      const uriList = selectedBrands.value.map((b) => `/api/v1/data/brand/${b.id}`).join('\n')
      await $axios.put(`/api/v1/data/product/${productId}/brands`, uriList, {
        headers: { 'Content-Type': 'text/uri-list' }
      })
    }

    // Warehouses
    if (selectedWarehouses.value.length) {
      const uriList = selectedWarehouses.value.map((w) => `/api/v1/data/warehouse/${w.id}`).join('\n')
      await $axios.put(`/api/v1/data/product/${productId}/warehouses`, uriList, {
        headers: { 'Content-Type': 'text/uri-list' }
      })
    }
    saveProgress.value = 45

    // Step 2 — Prices
    saveStep.value = saveSteps[1]
    await $axios.post('/api/v1/data/productprice', {
      price: parseCents(regularPriceDisplay.value),
      product: `/api/v1/data/product/${productId}`
    })
    saveProgress.value = 60

    if (comparePriceDisplay.value && parseCents(comparePriceDisplay.value) > 0) {
      await $axios.post('/api/v1/data/productprice', {
        price: parseCents(comparePriceDisplay.value),
        field: 'compare_at',
        product: `/api/v1/data/product/${productId}`
      })
    }
    saveProgress.value = 70

    // Step 3 — Variants
    saveStep.value = saveSteps[2]
    for (const variant of variants.value) {
      const vRes = await $axios.post('/api/v1/data/variant', {
        name: variant.name.trim(),
        stock: variant.stock,
        published: true,
        available: true,
        allowOutOfStockPurchases: false,
        product: `/api/v1/data/product/${productId}`
      })
      const variantId: string = vRes.data.id
      await $axios.post('/api/v1/data/productprice', {
        price: parseCents(variant.price),
        variant: `/api/v1/data/variant/${variantId}`
      })
    }
    saveProgress.value = 95

    // Done
    saveStep.value = saveSteps[3]
    saveProgress.value = 100
    createdId.value = productId
  } catch (e: any) {
    saveError.value = e?.response?.data?.message ?? e?.message ?? 'Erro ao salvar produto'
  } finally {
    saving.value = false
  }
}

function resetWizard() {
  currentStep.value = 1
  direction.value = 'forward'
  name.value = ''
  slug.value = ''
  slugManuallyEdited.value = false
  selectedCategories.value = []
  selectedBrands.value = []
  categorySearch.value = ''
  brandSearch.value = ''
  shortDescription.value = ''
  description.value = ''
  isVirtual.value = false
  shippable.value = true
  weekOffer.value = false
  regularPriceDisplay.value = ''
  comparePriceDisplay.value = ''
  stock.value = 0
  allowOutOfStock.value = false
  priority.value = null
  variants.value = []
  published.value = true
  available.value = true
  seoOpen.value = false
  metaTitle.value = ''
  metaDesc.value = ''
  metaKeywords.value = ''
  ncm.value = ''
  icmsOrigem.value = '0'
  icmsTributeSituations.value = ''
  pisTributeSituations.value = ''
  cofinsTributeSituations.value = ''
  errors.value = {}
  createdId.value = null
  saveError.value = null
  saveProgress.value = 0
  saveStep.value = ''
}

function goToMedia() {
  if (createdId.value) {
    router.push({ name: 'product-media', params: { productId: createdId.value } })
  }
}

// ── Click-outside helper ──────────────────────────────────────────────────────
const categoryRef   = ref<HTMLElement | null>(null)
const brandRef      = ref<HTMLElement | null>(null)
const vendorRef     = ref<HTMLElement | null>(null)
const unitRef       = ref<HTMLElement | null>(null)
const warehouseRef  = ref<HTMLElement | null>(null)

const categoryInputRef  = ref<HTMLInputElement | null>(null)
const brandInputRef     = ref<HTMLInputElement | null>(null)
const vendorInputRef    = ref<HTMLInputElement | null>(null)
const unitInputRef      = ref<HTMLInputElement | null>(null)
const warehouseInputRef = ref<HTMLInputElement | null>(null)

const categoryDropRef  = ref<HTMLElement | null>(null)
const brandDropRef     = ref<HTMLElement | null>(null)
const vendorDropRef    = ref<HTMLElement | null>(null)
const unitDropRef      = ref<HTMLElement | null>(null)
const warehouseDropRef = ref<HTMLElement | null>(null)

const categoryDropPos  = reactive({ top: 0, left: 0, width: 0 })
const brandDropPos     = reactive({ top: 0, left: 0, width: 0 })
const vendorDropPos    = reactive({ top: 0, left: 0, width: 0 })
const unitDropPos      = reactive({ top: 0, left: 0, width: 0 })
const warehouseDropPos = reactive({ top: 0, left: 0, width: 0 })

function calcPos(inputRef: Ref<HTMLInputElement | null>, pos: { top: number; left: number; width: number }) {
  const rect = inputRef.value?.getBoundingClientRect()
  if (rect) { pos.top = rect.bottom; pos.left = rect.left; pos.width = rect.width }
}

function openCategory()  { calcPos(categoryInputRef,  categoryDropPos);  categoryOpen.value  = true }
function openBrand()     { calcPos(brandInputRef,     brandDropPos);     brandOpen.value     = true }
function openVendor()    { calcPos(vendorInputRef,    vendorDropPos);    vendorOpen.value    = true }
function openUnit()      { calcPos(unitInputRef,      unitDropPos);      unitOpen.value      = true }
function openWarehouse() { calcPos(warehouseInputRef, warehouseDropPos); warehouseOpen.value = true }

function handleClickOutside(e: MouseEvent) {
  const t = e.target as Node
  if (!categoryRef.value?.contains(t)  && !categoryDropRef.value?.contains(t))  categoryOpen.value  = false
  if (!brandRef.value?.contains(t)     && !brandDropRef.value?.contains(t))     brandOpen.value     = false
  if (!vendorRef.value?.contains(t)    && !vendorDropRef.value?.contains(t))    vendorOpen.value    = false
  if (!unitRef.value?.contains(t)      && !unitDropRef.value?.contains(t))      unitOpen.value      = false
  if (!warehouseRef.value?.contains(t) && !warehouseDropRef.value?.contains(t)) warehouseOpen.value = false
}

onMounted(() => {
  loadOptions()
  document.body.classList.remove('has-min-sidebar', 'is-header-blur')
  document.addEventListener('mousedown', handleClickOutside)
})
onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleClickOutside)
})
</script>

<template>
  <DefaultLayout :icon="{ type: 'material', icon: 'add_shopping_cart' }" :menu-items="[]">
    <div class="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
      <!-- Header -->
      <div>
        <h1 class="text-lg font-semibold text-slate-800 dark:text-navy-50">Novo Produto</h1>
        <p class="mt-0.5 text-xs text-slate-500 dark:text-navy-300">
          Siga os passos para criar um produto completo.
        </p>
      </div>

      <!-- ── Progress Bar ── -->
      <div
        v-if="!createdId"
        class="rounded-xl border border-slate-200 bg-white px-6 py-5 dark:border-navy-600 dark:bg-navy-700"
      >
        <div class="flex items-start justify-between">
          <template v-for="(step, idx) in steps" :key="step.number">
            <!-- Step indicator -->
            <div class="flex flex-col items-center gap-1.5" style="min-width: 48px">
              <button
                class="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition focus:outline-none"
                :class="{
                  'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-indigo-900':
                    currentStep === step.number,
                  'bg-indigo-500 text-white': currentStep > step.number,
                  'bg-slate-100 text-slate-400 dark:bg-navy-600 dark:text-navy-400':
                    currentStep < step.number
                }"
                @click="goToStep(step.number)"
              >
                <!-- Checkmark for completed -->
                <svg
                  v-if="currentStep > step.number"
                  class="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2.5"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span v-else>{{ step.number }}</span>
              </button>
              <span
                class="text-center text-[10px] font-medium leading-tight"
                :class="
                  currentStep >= step.number
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-400 dark:text-navy-400'
                "
                >{{ step.label }}</span
              >
            </div>
            <!-- Connector line -->
            <div
              v-if="idx < steps.length - 1"
              class="mt-4 h-0.5 flex-1 rounded"
              :class="currentStep > step.number ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-navy-600'"
            ></div>
          </template>
        </div>
      </div>

      <!-- ── Toast error ── -->
      <transition name="fade">
        <div
          v-if="saveError"
          class="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300"
        >
          {{ saveError }}
        </div>
      </transition>

      <!-- ── Success State ── -->
      <transition name="fade">
        <div v-if="createdId" class="space-y-4">
          <div
            class="rounded-xl border border-emerald-200 bg-emerald-50 px-6 py-8 text-center dark:border-emerald-800 dark:bg-emerald-900/20"
          >
            <div
              class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40"
            >
              <svg
                class="h-8 w-8 text-emerald-600 dark:text-emerald-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 class="text-base font-semibold text-emerald-800 dark:text-emerald-200">
              Produto criado com sucesso!
            </h2>
            <p class="mt-1 font-mono text-xs text-emerald-600 dark:text-emerald-400">
              ID: {{ createdId }}
            </p>
            <div class="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <button
                class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
                @click="goToMedia"
              >
                <svg
                  class="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Gerenciar Mídias
              </button>
              <button
                class="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:border-slate-400 dark:border-navy-500 dark:text-navy-200"
                @click="resetWizard"
              >
                <svg
                  class="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Criar outro produto
              </button>
            </div>
          </div>
        </div>
      </transition>

      <!-- ── Wizard Steps ── -->
      <div v-if="!createdId" class="relative overflow-hidden">
        <transition :name="direction === 'forward' ? 'slide-left' : 'slide-right'" mode="out-in">
          <!-- STEP 1: Identidade -->
          <div v-if="currentStep === 1" key="step1" class="space-y-5">
            <div
              class="rounded-xl border border-slate-200 bg-white p-6 dark:border-navy-600 dark:bg-navy-700"
            >
              <h2 class="mb-4 text-sm font-semibold text-slate-700 dark:text-navy-100">
                🏷️ Identidade
              </h2>
              <div class="space-y-4">
                <!-- Name -->
                <div>
                  <label class="mb-1 block text-xs font-medium text-slate-600 dark:text-navy-300">
                    Nome <span class="text-red-400">*</span>
                  </label>
                  <input
                    v-model="name"
                    type="text"
                    placeholder="Ex: Tênis Running Pro"
                    class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-navy-500 dark:bg-navy-700 dark:text-navy-100 dark:placeholder-navy-400 dark:focus:border-indigo-500"
                    :class="
                      errors.name ? 'border-red-400 focus:border-red-400 focus:ring-red-200' : ''
                    "
                  />
                  <p v-if="errors.name" class="mt-1 text-xs text-red-500">{{ errors.name }}</p>
                </div>

                <!-- Slug -->
                <div>
                  <label class="mb-1 block text-xs font-medium text-slate-600 dark:text-navy-300"
                    >Slug</label
                  >
                  <input
                    v-model="slug"
                    type="text"
                    placeholder="tenis-running-pro"
                    class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-800 placeholder-slate-400 transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-navy-500 dark:bg-navy-700 dark:text-navy-100 dark:placeholder-navy-400 dark:focus:border-indigo-500"
                    @input="onSlugInput"
                  />
                  <p class="mt-0.5 text-[11px] text-slate-400 dark:text-navy-400">
                    Gerado automaticamente a partir do nome. Editável.
                  </p>
                </div>

                <!-- Categories -->
                <div ref="categoryRef">
                  <label class="mb-1 block text-xs font-medium text-slate-600 dark:text-navy-300"
                    >Categorias</label
                  >
                  <!-- Selected pills -->
                  <div v-if="selectedCategories.length" class="mb-2 flex flex-wrap gap-1.5">
                    <span
                      v-for="cat in selectedCategories"
                      :key="cat.id"
                      class="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
                    >
                      {{ cat.name }}
                      <button
                        class="ml-0.5 hover:text-indigo-900 dark:hover:text-indigo-100"
                        @click="removeCategory(cat.id)"
                      >
                        <svg
                          class="h-3 w-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          stroke-width="3"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </span>
                  </div>
                  <div class="relative">
                    <input
                      ref="categoryInputRef"
                      v-model="categorySearch"
                      type="text"
                      placeholder="Buscar categorias..."
                      class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-navy-500 dark:bg-navy-700 dark:text-navy-100 dark:placeholder-navy-400 dark:focus:border-indigo-500"
                      @focus="openCategory"
                    />
                  </div>
                  <Teleport to="body">
                    <transition name="fade">
                      <div
                        v-if="categoryOpen && filteredCategories.length"
                        ref="categoryDropRef"
                        :style="{ position: 'fixed', top: categoryDropPos.top + 'px', left: categoryDropPos.left + 'px', width: categoryDropPos.width + 'px', zIndex: 9999 }"
                        class="mt-1 max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg dark:border-navy-600 dark:bg-navy-700"
                      >
                        <button
                          v-for="cat in filteredCategories"
                          :key="cat.id"
                          class="flex w-full items-center px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-indigo-50 dark:text-navy-100 dark:hover:bg-navy-600"
                          @mousedown.prevent="addCategory(cat)"
                        >
                          {{ cat.name }}
                        </button>
                      </div>
                    </transition>
                  </Teleport>
                </div>

                <!-- Brands -->
                <div ref="brandRef">
                  <label class="mb-1 block text-xs font-medium text-slate-600 dark:text-navy-300"
                    >Marcas</label
                  >
                  <div v-if="selectedBrands.length" class="mb-2 flex flex-wrap gap-1.5">
                    <span
                      v-for="brand in selectedBrands"
                      :key="brand.id"
                      class="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-900/40 dark:text-violet-300"
                    >
                      {{ brand.name }}
                      <button
                        class="ml-0.5 hover:text-violet-900 dark:hover:text-violet-100"
                        @click="removeBrand(brand.id)"
                      >
                        <svg
                          class="h-3 w-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          stroke-width="3"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </span>
                  </div>
                  <div class="relative">
                    <input
                      ref="brandInputRef"
                      v-model="brandSearch"
                      type="text"
                      placeholder="Buscar marcas..."
                      class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-navy-500 dark:bg-navy-700 dark:text-navy-100 dark:placeholder-navy-400 dark:focus:border-indigo-500"
                      @focus="openBrand"
                    />
                  </div>
                  <Teleport to="body">
                    <transition name="fade">
                      <div
                        v-if="brandOpen && filteredBrands.length"
                        ref="brandDropRef"
                        :style="{ position: 'fixed', top: brandDropPos.top + 'px', left: brandDropPos.left + 'px', width: brandDropPos.width + 'px', zIndex: 9999 }"
                        class="mt-1 max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg dark:border-navy-600 dark:bg-navy-700"
                      >
                        <button
                          v-for="brand in filteredBrands"
                          :key="brand.id"
                          class="flex w-full items-center px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-violet-50 dark:text-navy-100 dark:hover:bg-navy-600"
                          @mousedown.prevent="addBrand(brand)"
                        >
                          {{ brand.name }}
                        </button>
                      </div>
                    </transition>
                  </Teleport>
                </div>

                <!-- Vendor -->
                <div ref="vendorRef">
                  <label class="mb-1 block text-xs font-medium text-slate-600 dark:text-navy-300"
                    >Vendor <span class="text-red-400">*</span></label
                  >
                  <div class="relative flex items-center gap-1.5">
                    <input
                      ref="vendorInputRef"
                      v-model="vendorSearch"
                      type="text"
                      placeholder="Buscar vendor..."
                      class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-navy-500 dark:bg-navy-700 dark:text-navy-100 dark:placeholder-navy-400 dark:focus:border-indigo-500"
                      :class="selectedVendor ? 'border-indigo-300 dark:border-indigo-600' : ''"
                      @focus="openVendor"
                      @input="selectedVendor = null"
                    />
                    <button
                      v-if="selectedVendor"
                      class="shrink-0 rounded p-1 text-slate-400 hover:text-slate-600 dark:text-navy-400 dark:hover:text-navy-200"
                      @click="clearVendor"
                    >
                      <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <Teleport to="body">
                    <transition name="fade">
                      <div
                        v-if="vendorOpen && filteredVendors.length"
                        ref="vendorDropRef"
                        :style="{ position: 'fixed', top: vendorDropPos.top + 'px', left: vendorDropPos.left + 'px', width: vendorDropPos.width + 'px', zIndex: 9999 }"
                        class="mt-1 max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg dark:border-navy-600 dark:bg-navy-700"
                      >
                        <button
                          v-for="vendor in filteredVendors"
                          :key="vendor.id"
                          class="flex w-full items-center px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-indigo-50 dark:text-navy-100 dark:hover:bg-navy-600"
                          @mousedown.prevent="selectVendor(vendor)"
                        >
                          {{ vendor.name }}
                        </button>
                      </div>
                    </transition>
                  </Teleport>
                </div>

                <!-- Unidade de medida -->
                <div ref="unitRef">
                  <label class="mb-1 block text-xs font-medium text-slate-600 dark:text-navy-300"
                    >Unidade de Medida</label
                  >
                  <div class="relative flex items-center gap-1.5">
                    <input
                      ref="unitInputRef"
                      v-model="unitSearch"
                      type="text"
                      placeholder="Buscar unidade (UN, KG, L…)"
                      class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-navy-500 dark:bg-navy-700 dark:text-navy-100 dark:placeholder-navy-400 dark:focus:border-indigo-500"
                      :class="selectedUnit ? 'border-indigo-300 dark:border-indigo-600' : ''"
                      @focus="openUnit"
                      @input="selectedUnit = null"
                    />
                    <button
                      v-if="selectedUnit"
                      class="shrink-0 rounded p-1 text-slate-400 hover:text-slate-600 dark:text-navy-400 dark:hover:text-navy-200"
                      @click="clearUnit"
                    >
                      <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <Teleport to="body">
                    <transition name="fade">
                      <div
                        v-if="unitOpen && filteredUnits.length"
                        ref="unitDropRef"
                        :style="{ position: 'fixed', top: unitDropPos.top + 'px', left: unitDropPos.left + 'px', width: unitDropPos.width + 'px', zIndex: 9999 }"
                        class="mt-1 max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg dark:border-navy-600 dark:bg-navy-700"
                      >
                        <button
                          v-for="unit in filteredUnits"
                          :key="unit.id"
                          class="flex w-full items-center px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-indigo-50 dark:text-navy-100 dark:hover:bg-navy-600"
                          @mousedown.prevent="selectUnit(unit)"
                        >
                          {{ unit.code }}
                        </button>
                      </div>
                    </transition>
                  </Teleport>
                </div>

                <!-- Warehouses -->
                <div ref="warehouseRef">
                  <label class="mb-1 block text-xs font-medium text-slate-600 dark:text-navy-300"
                    >Depósitos (Warehouses)</label
                  >
                  <div v-if="selectedWarehouses.length" class="mb-2 flex flex-wrap gap-1.5">
                    <span
                      v-for="wh in selectedWarehouses"
                      :key="wh.id"
                      class="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                    >
                      {{ wh.name }}
                      <button
                        class="ml-0.5 hover:text-emerald-900 dark:hover:text-emerald-100"
                        @click="removeWarehouse(wh.id)"
                      >
                        <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  </div>
                  <div class="relative">
                    <input
                      ref="warehouseInputRef"
                      v-model="warehouseSearch"
                      type="text"
                      placeholder="Buscar depósito..."
                      class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-navy-500 dark:bg-navy-700 dark:text-navy-100 dark:placeholder-navy-400 dark:focus:border-indigo-500"
                      @focus="openWarehouse"
                    />
                  </div>
                  <Teleport to="body">
                    <transition name="fade">
                      <div
                        v-if="warehouseOpen && filteredWarehouses.length"
                        ref="warehouseDropRef"
                        :style="{ position: 'fixed', top: warehouseDropPos.top + 'px', left: warehouseDropPos.left + 'px', width: warehouseDropPos.width + 'px', zIndex: 9999 }"
                        class="mt-1 max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg dark:border-navy-600 dark:bg-navy-700"
                      >
                        <button
                          v-for="wh in filteredWarehouses"
                          :key="wh.id"
                          class="flex w-full items-center px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-emerald-50 dark:text-navy-100 dark:hover:bg-navy-600"
                          @mousedown.prevent="addWarehouse(wh)"
                        >
                          {{ wh.name }}
                        </button>
                      </div>
                    </transition>
                  </Teleport>
                </div>

              </div>
            </div>
          </div>

          <!-- STEP 2: Conteúdo -->
          <div v-else-if="currentStep === 2" key="step2" class="space-y-5">
            <div
              class="rounded-xl border border-slate-200 bg-white p-6 dark:border-navy-600 dark:bg-navy-700"
            >
              <h2 class="mb-4 text-sm font-semibold text-slate-700 dark:text-navy-100">
                📝 Conteúdo
              </h2>
              <div class="space-y-4">
                <!-- Short description -->
                <div>
                  <div class="mb-1 flex items-center justify-between">
                    <label class="text-xs font-medium text-slate-600 dark:text-navy-300"
                      >Descrição curta</label
                    >
                    <span
                      class="text-[11px]"
                      :class="
                        shortDescription.length > 300
                          ? 'text-red-500'
                          : 'text-slate-400 dark:text-navy-400'
                      "
                    >
                      {{ shortDescription.length }}/300
                    </span>
                  </div>
                  <textarea
                    v-model="shortDescription"
                    rows="3"
                    maxlength="300"
                    placeholder="Resumo em até 300 caracteres..."
                    class="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-navy-500 dark:bg-navy-700 dark:text-navy-100 dark:placeholder-navy-400 dark:focus:border-indigo-500"
                  ></textarea>
                </div>

                <!-- Full description -->
                <div>
                  <label class="mb-1 block text-xs font-medium text-slate-600 dark:text-navy-300"
                    >Descrição completa</label
                  >
                  <textarea
                    v-model="description"
                    rows="6"
                    placeholder="Descrição detalhada do produto..."
                    class="w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-navy-500 dark:bg-navy-700 dark:text-navy-100 dark:placeholder-navy-400 dark:focus:border-indigo-500"
                  ></textarea>
                </div>

                <!-- Tipo: Físico / Digital -->
                <div>
                  <label class="mb-2 block text-xs font-medium text-slate-600 dark:text-navy-300"
                    >Tipo de produto</label
                  >
                  <div class="flex gap-3">
                    <button
                      class="flex flex-1 items-center justify-center gap-2 rounded-lg border-2 py-3 text-sm font-medium transition"
                      :class="
                        !isVirtual
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-900/20 dark:text-indigo-300'
                          : 'border-slate-200 text-slate-500 hover:border-slate-300 dark:border-navy-600 dark:text-navy-400'
                      "
                      @click="isVirtual = false"
                    >
                      <svg
                        class="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                        />
                      </svg>
                      Físico
                    </button>
                    <button
                      class="flex flex-1 items-center justify-center gap-2 rounded-lg border-2 py-3 text-sm font-medium transition"
                      :class="
                        isVirtual
                          ? 'border-violet-500 bg-violet-50 text-violet-700 dark:border-violet-500 dark:bg-violet-900/20 dark:text-violet-300'
                          : 'border-slate-200 text-slate-500 hover:border-slate-300 dark:border-navy-600 dark:text-navy-400'
                      "
                      @click="isVirtual = true"
                    >
                      <svg
                        class="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                      Digital
                    </button>
                  </div>
                </div>

                <!-- Shippable (hidden if virtual) -->
                <transition name="fade">
                  <div
                    v-if="!isVirtual"
                    class="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3 dark:border-navy-600"
                  >
                    <div>
                      <p class="text-sm font-medium text-slate-700 dark:text-navy-100">
                        Pode ser enviado?
                      </p>
                      <p class="text-xs text-slate-400 dark:text-navy-400">
                        Habilita cálculo de frete
                      </p>
                    </div>
                    <button
                      class="relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                      :class="shippable ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-navy-600'"
                      @click="shippable = !shippable"
                    >
                      <span
                        class="inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                        :class="shippable ? 'translate-x-5' : 'translate-x-0'"
                      ></span>
                    </button>
                  </div>
                </transition>

                <!-- Week offer -->
                <div
                  class="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3 dark:border-navy-600"
                >
                  <div>
                    <p class="text-sm font-medium text-slate-700 dark:text-navy-100">
                      Oferta da semana?
                    </p>
                    <p class="text-xs text-slate-400 dark:text-navy-400">
                      Destaca o produto como oferta especial
                    </p>
                  </div>
                  <button
                    class="relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                    :class="weekOffer ? 'bg-amber-500' : 'bg-slate-200 dark:bg-navy-600'"
                    @click="weekOffer = !weekOffer"
                  >
                    <span
                      class="inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                      :class="weekOffer ? 'translate-x-5' : 'translate-x-0'"
                    ></span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Dados Fiscais -->
            <div class="rounded-xl border border-slate-200 bg-white p-6 dark:border-navy-600 dark:bg-navy-700">
              <h2 class="mb-1 text-sm font-semibold text-slate-700 dark:text-navy-100">🧾 Dados Fiscais</h2>
              <p class="mb-4 text-xs text-slate-400 dark:text-navy-400">
                Usados na emissão de NF-e. O CST/CSOSN do produto prevalece sobre o padrão do emitente.
                Deixe em branco para usar o fallback configurado no provedor fiscal.
              </p>
              <div class="space-y-4">
                <!-- NCM + Origem -->
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="mb-1 block text-xs font-medium text-slate-600 dark:text-navy-300">
                      NCM
                    </label>
                    <input
                      v-model="ncm"
                      type="text"
                      maxlength="8"
                      placeholder="00000000"
                      class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-800 placeholder-slate-400 transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-navy-500 dark:bg-navy-700 dark:text-navy-100 dark:placeholder-navy-400"
                    />
                    <p class="mt-0.5 text-[10px] text-slate-400">Nomenclatura Comum do Mercosul (8 dígitos)</p>
                  </div>
                  <div>
                    <label class="mb-1 block text-xs font-medium text-slate-600 dark:text-navy-300">
                      Origem ICMS
                    </label>
                    <select
                      v-model="icmsOrigem"
                      class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-navy-500 dark:bg-navy-700 dark:text-navy-100"
                    >
                      <option value="0">0 - Nacional</option>
                      <option value="1">1 - Estrangeira (importação direta)</option>
                      <option value="2">2 - Estrangeira (adquirida no mercado interno)</option>
                      <option value="3">3 - Nacional com mais de 40% conteúdo estrangeiro</option>
                      <option value="4">4 - Nacional com processo produtivo básico</option>
                      <option value="5">5 - Nacional com menos de 40% conteúdo estrangeiro</option>
                      <option value="6">6 - Estrangeira (importação direta, sem similar nacional)</option>
                      <option value="7">7 - Estrangeira (adquirida no mercado interno, sem similar nacional)</option>
                      <option value="8">8 - Nacional com produção conforme processos básicos</option>
                    </select>
                  </div>
                </div>

                <!-- ICMS CST -->
                <div>
                  <label class="mb-1 block text-xs font-medium text-slate-600 dark:text-navy-300">
                    ICMS — CST / CSOSN
                  </label>
                  <select
                    v-model="icmsTributeSituations"
                    class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-navy-500 dark:bg-navy-700 dark:text-navy-100"
                  >
                    <option value="">— Usar padrão do emitente —</option>
                    <optgroup label="Simples Nacional (CSOSN)">
                      <option value="101">101 - Tributada com permissão de crédito</option>
                      <option value="102">102 - Tributada sem permissão de crédito</option>
                      <option value="103">103 - Isenta (faixa de receita)</option>
                      <option value="300">300 - Imune</option>
                      <option value="400">400 - Não tributada</option>
                      <option value="500">500 - ICMS cobrado por ST</option>
                      <option value="900">900 - Outros</option>
                    </optgroup>
                    <optgroup label="Regime Normal (CST)">
                      <option value="00">00 - Tributada integralmente</option>
                      <option value="10">10 - Tributada com cobrança por ST</option>
                      <option value="20">20 - Com redução de BC</option>
                      <option value="30">30 - Isenta / não tributada com ST</option>
                      <option value="40">40 - Isenta</option>
                      <option value="41">41 - Não tributada</option>
                      <option value="50">50 - Suspensão</option>
                      <option value="51">51 - Diferimento</option>
                      <option value="60">60 - ICMS cobrado por ST anteriormente</option>
                      <option value="70">70 - Redução de BC com cobrança por ST</option>
                      <option value="90">90 - Outros</option>
                    </optgroup>
                  </select>
                </div>

                <!-- PIS + COFINS CST -->
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="mb-1 block text-xs font-medium text-slate-600 dark:text-navy-300">
                      PIS — CST
                    </label>
                    <select
                      v-model="pisTributeSituations"
                      class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-navy-500 dark:bg-navy-700 dark:text-navy-100"
                    >
                      <option value="">— Usar padrão do emitente —</option>
                      <option value="01">01 - Tributável (alíquota normal)</option>
                      <option value="02">02 - Tributável (alíquota diferenciada)</option>
                      <option value="04">04 - Monofásica</option>
                      <option value="06">06 - Alíquota Zero</option>
                      <option value="07">07 - Isenta</option>
                      <option value="08">08 - Sem Incidência</option>
                      <option value="09">09 - Suspensão</option>
                      <option value="49">49 - Outras saídas</option>
                    </select>
                  </div>
                  <div>
                    <label class="mb-1 block text-xs font-medium text-slate-600 dark:text-navy-300">
                      COFINS — CST
                    </label>
                    <select
                      v-model="cofinsTributeSituations"
                      class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-navy-500 dark:bg-navy-700 dark:text-navy-100"
                    >
                      <option value="">— Usar padrão do emitente —</option>
                      <option value="01">01 - Tributável (alíquota normal)</option>
                      <option value="02">02 - Tributável (alíquota diferenciada)</option>
                      <option value="04">04 - Monofásica</option>
                      <option value="06">06 - Alíquota Zero</option>
                      <option value="07">07 - Isenta</option>
                      <option value="08">08 - Sem Incidência</option>
                      <option value="09">09 - Suspensão</option>
                      <option value="49">49 - Outras saídas</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- STEP 3: Preços & Estoque -->
          <div v-else-if="currentStep === 3" key="step3" class="space-y-5">
            <div
              class="rounded-xl border border-slate-200 bg-white p-6 dark:border-navy-600 dark:bg-navy-700"
            >
              <h2 class="mb-4 text-sm font-semibold text-slate-700 dark:text-navy-100">
                💰 Preços & Estoque
              </h2>
              <div class="space-y-4">
                <!-- Regular price -->
                <div>
                  <label class="mb-1 block text-xs font-medium text-slate-600 dark:text-navy-300">
                    Preço regular <span class="text-red-400">*</span>
                  </label>
                  <div class="relative">
                    <span
                      class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 dark:text-navy-400"
                      >R$</span
                    >
                    <input
                      type="text"
                      inputmode="numeric"
                      :value="regularPriceDisplay"
                      placeholder="0,00"
                      class="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 placeholder-slate-400 transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-navy-500 dark:bg-navy-700 dark:text-navy-100 dark:placeholder-navy-400 dark:focus:border-indigo-500"
                      :class="
                        errors.price ? 'border-red-400 focus:border-red-400 focus:ring-red-200' : ''
                      "
                      @input="onPriceInput('regular', $event)"
                    />
                  </div>
                  <p v-if="errors.price" class="mt-1 text-xs text-red-500">{{ errors.price }}</p>
                </div>

                <!-- Compare price -->
                <div>
                  <label class="mb-1 block text-xs font-medium text-slate-600 dark:text-navy-300"
                    >Preço "De:" (comparativo, opcional)</label
                  >
                  <div class="relative">
                    <span
                      class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 dark:text-navy-400"
                      >R$</span
                    >
                    <input
                      type="text"
                      inputmode="numeric"
                      :value="comparePriceDisplay"
                      placeholder="0,00"
                      class="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 placeholder-slate-400 transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-navy-500 dark:bg-navy-700 dark:text-navy-100 dark:placeholder-navy-400 dark:focus:border-indigo-500"
                      @input="onPriceInput('compare', $event)"
                    />
                  </div>
                  <p class="mt-0.5 text-[11px] text-slate-400 dark:text-navy-400">
                    Exibe o preço original riscado para indicar desconto.
                  </p>
                </div>

                <!-- Stock -->
                <div>
                  <label class="mb-1 block text-xs font-medium text-slate-600 dark:text-navy-300"
                    >Estoque inicial</label
                  >
                  <input
                    v-model.number="stock"
                    type="number"
                    min="0"
                    class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-navy-500 dark:bg-navy-700 dark:text-navy-100 dark:focus:border-indigo-500"
                  />
                </div>

                <!-- Allow out of stock -->
                <div
                  class="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3 dark:border-navy-600"
                >
                  <div>
                    <p class="text-sm font-medium text-slate-700 dark:text-navy-100">
                      Permitir compra sem estoque?
                    </p>
                    <p class="text-xs text-slate-400 dark:text-navy-400">
                      Aceita pedidos mesmo com estoque zerado
                    </p>
                  </div>
                  <button
                    class="relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                    :class="allowOutOfStock ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-navy-600'"
                    @click="allowOutOfStock = !allowOutOfStock"
                  >
                    <span
                      class="inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                      :class="allowOutOfStock ? 'translate-x-5' : 'translate-x-0'"
                    ></span>
                  </button>
                </div>

                <!-- Priority -->
                <div>
                  <label class="mb-1 block text-xs font-medium text-slate-600 dark:text-navy-300"
                    >Prioridade (1-100, opcional)</label
                  >
                  <input
                    v-model.number="priority"
                    type="number"
                    min="1"
                    max="100"
                    placeholder="Ex: 10"
                    class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-navy-500 dark:bg-navy-700 dark:text-navy-100 dark:placeholder-navy-400 dark:focus:border-indigo-500"
                  />
                  <p class="mt-0.5 text-[11px] text-slate-400 dark:text-navy-400">
                    Influencia a ordem de exibição. Maior = mais destaque.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- STEP 4: Variantes -->
          <div v-else-if="currentStep === 4" key="step4" class="space-y-5">
            <div
              class="rounded-xl border border-slate-200 bg-white p-6 dark:border-navy-600 dark:bg-navy-700"
            >
              <div class="mb-4 flex items-center justify-between">
                <h2 class="text-sm font-semibold text-slate-700 dark:text-navy-100">
                  🔀 Variantes
                </h2>
                <button
                  class="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-700"
                  @click="addVariant"
                >
                  <svg
                    class="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2.5"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Adicionar variante
                </button>
              </div>

              <!-- Empty notice -->
              <div
                v-if="!variants.length"
                class="rounded-lg border border-dashed border-slate-200 bg-slate-50 py-10 text-center dark:border-navy-600 dark:bg-navy-800/30"
              >
                <p class="text-sm text-slate-400 dark:text-navy-400">
                  Deixe vazio se o produto não tem variantes.
                </p>
                <p class="mt-1 text-xs text-slate-300 dark:text-navy-500">
                  Clique em "Adicionar variante" para criar opções como tamanho, cor, etc.
                </p>
              </div>

              <!-- Variant cards -->
              <div v-else class="space-y-3">
                <div
                  v-for="(variant, idx) in variants"
                  :key="idx"
                  class="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-navy-600 dark:bg-navy-800/40"
                >
                  <div class="mb-3 flex items-center justify-between">
                    <span class="text-xs font-semibold text-slate-500 dark:text-navy-400"
                      >Variante {{ idx + 1 }}</span
                    >
                    <button
                      class="rounded p-1 text-red-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30"
                      title="Remover variante"
                      @click="removeVariant(idx)"
                    >
                      <svg
                        class="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                  <div class="grid gap-3 sm:grid-cols-3">
                    <!-- Name -->
                    <div class="sm:col-span-1">
                      <label
                        class="mb-1 block text-xs font-medium text-slate-600 dark:text-navy-300"
                        >Nome <span class="text-red-400">*</span></label
                      >
                      <input
                        v-model="variant.name"
                        type="text"
                        placeholder="Ex: P, M, Azul..."
                        class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-navy-500 dark:bg-navy-700 dark:text-navy-100 dark:placeholder-navy-400 dark:focus:border-indigo-500"
                        :class="
                          errors[`variant_name_${idx}`]
                            ? 'border-red-400 focus:border-red-400 focus:ring-red-200'
                            : ''
                        "
                      />
                      <p v-if="errors[`variant_name_${idx}`]" class="mt-1 text-xs text-red-500">
                        {{ errors[`variant_name_${idx}`] }}
                      </p>
                    </div>
                    <!-- Price -->
                    <div>
                      <label
                        class="mb-1 block text-xs font-medium text-slate-600 dark:text-navy-300"
                        >Preço <span class="text-red-400">*</span></label
                      >
                      <div class="relative">
                        <span
                          class="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 dark:text-navy-400"
                          >R$</span
                        >
                        <input
                          type="text"
                          inputmode="numeric"
                          :value="variant.price"
                          placeholder="0,00"
                          class="w-full rounded-lg border border-slate-300 bg-white py-2 pl-8 pr-3 text-sm text-slate-800 placeholder-slate-400 transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-navy-500 dark:bg-navy-700 dark:text-navy-100 dark:placeholder-navy-400 dark:focus:border-indigo-500"
                          :class="
                            errors[`variant_price_${idx}`]
                              ? 'border-red-400 focus:border-red-400 focus:ring-red-200'
                              : ''
                          "
                          @input="onVariantPriceInput(idx, $event)"
                        />
                      </div>
                      <p v-if="errors[`variant_price_${idx}`]" class="mt-1 text-xs text-red-500">
                        {{ errors[`variant_price_${idx}`] }}
                      </p>
                    </div>
                    <!-- Stock -->
                    <div>
                      <label
                        class="mb-1 block text-xs font-medium text-slate-600 dark:text-navy-300"
                        >Estoque</label
                      >
                      <input
                        v-model.number="variant.stock"
                        type="number"
                        min="0"
                        class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-navy-500 dark:bg-navy-700 dark:text-navy-100 dark:focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- STEP 5: Revisão & Publicar -->
          <div v-else-if="currentStep === 5" key="step5" class="space-y-5">
            <!-- Summary cards -->
            <div
              class="rounded-xl border border-slate-200 bg-white p-6 dark:border-navy-600 dark:bg-navy-700"
            >
              <h2 class="mb-4 text-sm font-semibold text-slate-700 dark:text-navy-100">
                ✅ Revisão & Publicar
              </h2>
              <div class="space-y-3">
                <!-- Identity summary -->
                <div
                  class="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 dark:border-navy-600 dark:bg-navy-800/30"
                >
                  <p
                    class="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-navy-400"
                  >
                    Identidade
                  </p>
                  <div class="space-y-1 text-sm">
                    <div class="flex gap-2">
                      <span class="w-20 shrink-0 text-xs text-slate-400 dark:text-navy-400"
                        >Nome</span
                      >
                      <span class="font-medium text-slate-700 dark:text-navy-100">{{
                        name || '—'
                      }}</span>
                    </div>
                    <div class="flex gap-2">
                      <span class="w-20 shrink-0 text-xs text-slate-400 dark:text-navy-400"
                        >Slug</span
                      >
                      <span class="font-mono text-xs text-slate-600 dark:text-navy-200">{{
                        slug || '—'
                      }}</span>
                    </div>
                    <div v-if="selectedCategories.length" class="flex gap-2">
                      <span class="w-20 shrink-0 text-xs text-slate-400 dark:text-navy-400"
                        >Categorias</span
                      >
                      <span class="text-slate-600 dark:text-navy-200">{{
                        selectedCategories.map((c) => c.name).join(', ')
                      }}</span>
                    </div>
                    <div v-if="selectedBrands.length" class="flex gap-2">
                      <span class="w-20 shrink-0 text-xs text-slate-400 dark:text-navy-400"
                        >Marcas</span
                      >
                      <span class="text-slate-600 dark:text-navy-200">{{
                        selectedBrands.map((b) => b.name).join(', ')
                      }}</span>
                    </div>
                  </div>
                </div>

                <!-- Content summary -->
                <div
                  class="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 dark:border-navy-600 dark:bg-navy-800/30"
                >
                  <p
                    class="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-navy-400"
                  >
                    Conteúdo
                  </p>
                  <div class="space-y-1 text-sm">
                    <div class="flex gap-2">
                      <span class="w-20 shrink-0 text-xs text-slate-400 dark:text-navy-400"
                        >Tipo</span
                      >
                      <span class="text-slate-700 dark:text-navy-100">{{
                        isVirtual ? 'Digital' : 'Físico'
                      }}</span>
                    </div>
                    <div v-if="!isVirtual" class="flex gap-2">
                      <span class="w-20 shrink-0 text-xs text-slate-400 dark:text-navy-400"
                        >Envio</span
                      >
                      <span class="text-slate-700 dark:text-navy-100">{{
                        shippable ? 'Sim' : 'Não'
                      }}</span>
                    </div>
                    <div class="flex gap-2">
                      <span class="w-20 shrink-0 text-xs text-slate-400 dark:text-navy-400"
                        >Oferta</span
                      >
                      <span class="text-slate-700 dark:text-navy-100">{{
                        weekOffer ? 'Sim' : 'Não'
                      }}</span>
                    </div>
                    <div v-if="shortDescription" class="flex gap-2">
                      <span class="w-20 shrink-0 text-xs text-slate-400 dark:text-navy-400"
                        >Resumo</span
                      >
                      <span class="line-clamp-2 text-slate-600 dark:text-navy-200">{{
                        shortDescription
                      }}</span>
                    </div>
                  </div>
                </div>

                <!-- Price summary -->
                <div
                  class="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 dark:border-navy-600 dark:bg-navy-800/30"
                >
                  <p
                    class="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-navy-400"
                  >
                    Preços & Estoque
                  </p>
                  <div class="space-y-1 text-sm">
                    <div class="flex gap-2">
                      <span class="w-20 shrink-0 text-xs text-slate-400 dark:text-navy-400"
                        >Preço</span
                      >
                      <span class="font-semibold text-slate-700 dark:text-navy-100"
                        >R$ {{ regularPriceDisplay || '0,00' }}</span
                      >
                    </div>
                    <div v-if="comparePriceDisplay" class="flex gap-2">
                      <span class="w-20 shrink-0 text-xs text-slate-400 dark:text-navy-400"
                        >De:</span
                      >
                      <span class="text-slate-500 line-through dark:text-navy-300"
                        >R$ {{ comparePriceDisplay }}</span
                      >
                    </div>
                    <div class="flex gap-2">
                      <span class="w-20 shrink-0 text-xs text-slate-400 dark:text-navy-400"
                        >Estoque</span
                      >
                      <span class="text-slate-700 dark:text-navy-100">{{ stock }}</span>
                    </div>
                  </div>
                </div>

                <!-- Variants summary -->
                <div
                  v-if="variants.length"
                  class="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 dark:border-navy-600 dark:bg-navy-800/30"
                >
                  <p
                    class="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-navy-400"
                  >
                    Variantes ({{ variants.length }})
                  </p>
                  <div class="space-y-1">
                    <div
                      v-for="(v, i) in variants"
                      :key="i"
                      class="flex items-center gap-3 text-sm text-slate-700 dark:text-navy-100"
                    >
                      <span class="font-medium">{{ v.name }}</span>
                      <span class="text-slate-400 dark:text-navy-400">·</span>
                      <span>R$ {{ v.price }}</span>
                      <span class="text-slate-400 dark:text-navy-400">·</span>
                      <span class="text-xs text-slate-500 dark:text-navy-400"
                        >estoque: {{ v.stock }}</span
                      >
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Publish toggles -->
            <div
              class="rounded-xl border border-slate-200 bg-white p-6 dark:border-navy-600 dark:bg-navy-700"
            >
              <h3 class="mb-4 text-sm font-semibold text-slate-700 dark:text-navy-100">
                Visibilidade
              </h3>
              <div class="space-y-3">
                <div
                  class="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3 dark:border-navy-600"
                >
                  <div>
                    <p class="text-sm font-medium text-slate-700 dark:text-navy-100">Publicado?</p>
                    <p class="text-xs text-slate-400 dark:text-navy-400">
                      Torna o produto visível na loja
                    </p>
                  </div>
                  <button
                    class="relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                    :class="published ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-navy-600'"
                    @click="published = !published"
                  >
                    <span
                      class="inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                      :class="published ? 'translate-x-5' : 'translate-x-0'"
                    ></span>
                  </button>
                </div>
                <div
                  class="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3 dark:border-navy-600"
                >
                  <div>
                    <p class="text-sm font-medium text-slate-700 dark:text-navy-100">Disponível?</p>
                    <p class="text-xs text-slate-400 dark:text-navy-400">
                      Permite que o produto seja comprado
                    </p>
                  </div>
                  <button
                    class="relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                    :class="available ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-navy-600'"
                    @click="available = !available"
                  >
                    <span
                      class="inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                      :class="available ? 'translate-x-5' : 'translate-x-0'"
                    ></span>
                  </button>
                </div>
              </div>
            </div>

            <!-- SEO accordion -->
            <div
              class="rounded-xl border border-slate-200 bg-white dark:border-navy-600 dark:bg-navy-700"
            >
              <button
                class="flex w-full items-center justify-between px-6 py-4 text-sm font-medium text-slate-700 dark:text-navy-100"
                @click="seoOpen = !seoOpen"
              >
                <span>SEO (opcional)</span>
                <svg
                  class="h-4 w-4 text-slate-400 transition-transform dark:text-navy-400"
                  :class="seoOpen ? 'rotate-180' : ''"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <transition name="fade">
                <div
                  v-if="seoOpen"
                  class="border-t border-slate-100 px-6 pb-5 pt-4 dark:border-navy-600"
                >
                  <div class="space-y-4">
                    <div>
                      <label
                        class="mb-1 block text-xs font-medium text-slate-600 dark:text-navy-300"
                        >Meta título</label
                      >
                      <input
                        v-model="metaTitle"
                        type="text"
                        class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-navy-500 dark:bg-navy-700 dark:text-navy-100 dark:focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label
                        class="mb-1 block text-xs font-medium text-slate-600 dark:text-navy-300"
                        >Meta descrição</label
                      >
                      <textarea
                        v-model="metaDesc"
                        rows="2"
                        class="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-navy-500 dark:bg-navy-700 dark:text-navy-100 dark:focus:border-indigo-500"
                      ></textarea>
                    </div>
                    <div>
                      <label
                        class="mb-1 block text-xs font-medium text-slate-600 dark:text-navy-300"
                        >Palavras-chave</label
                      >
                      <input
                        v-model="metaKeywords"
                        type="text"
                        placeholder="Ex: tênis, corrida, esporte"
                        class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-navy-500 dark:bg-navy-700 dark:text-navy-100 dark:placeholder-navy-400 dark:focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              </transition>
            </div>
          </div>
        </transition>
      </div>

      <!-- ── Navigation Buttons ── -->
      <div v-if="!createdId" class="flex items-center justify-between">
        <button
          v-if="currentStep > 1"
          class="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-400 dark:border-navy-500 dark:text-navy-200"
          @click="goBack"
        >
          <svg
            class="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Voltar
        </button>
        <div v-else></div>

        <button
          v-if="currentStep < totalSteps"
          class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
          @click="goNext"
        >
          Próximo
          <svg
            class="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <button
          v-else
          class="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
          :disabled="saving"
          @click="save"
        >
          <svg v-if="saving" class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            />
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <svg
            v-else
            class="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2.5"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Criar Produto
        </button>
      </div>

      <!-- ── Saving Progress Overlay ── -->
      <transition name="fade">
        <div
          v-if="saving"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        >
          <div
            class="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-2xl dark:border-navy-600 dark:bg-navy-700"
          >
            <div class="flex flex-col items-center gap-5">
              <div
                class="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/40"
              >
                <svg class="h-8 w-8 animate-spin text-indigo-600" fill="none" viewBox="0 0 24 24">
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  />
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              </div>
              <div class="w-full text-center">
                <p class="text-sm font-semibold text-slate-700 dark:text-navy-100">
                  {{ saveStep }}
                </p>
                <div class="mt-3 h-2 w-full rounded-full bg-slate-200 dark:bg-navy-600">
                  <div
                    class="h-2 rounded-full bg-indigo-500 transition-all duration-500"
                    :style="{ width: `${saveProgress}%` }"
                  ></div>
                </div>
                <p class="mt-1.5 text-xs text-slate-400 dark:text-navy-400">{{ saveProgress }}%</p>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </DefaultLayout>
</template>

<style scoped>
/* Fade */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Slide left (going forward) */
.slide-left-enter-active,
.slide-left-leave-active {
  transition:
    transform 0.3s ease,
    opacity 0.3s ease;
}
.slide-left-enter-from {
  transform: translateX(48px);
  opacity: 0;
}
.slide-left-leave-to {
  transform: translateX(-48px);
  opacity: 0;
}

/* Slide right (going backward) */
.slide-right-enter-active,
.slide-right-leave-active {
  transition:
    transform 0.3s ease,
    opacity 0.3s ease;
}
.slide-right-enter-from {
  transform: translateX(-48px);
  opacity: 0;
}
.slide-right-leave-to {
  transform: translateX(48px);
  opacity: 0;
}
</style>
