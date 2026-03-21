<script lang="ts" setup>
import { ref, computed, watch, onMounted } from 'vue'
import { usePosStore } from '../../store/usePosStore'
import { usePosApi } from '../../composables/usePosApi'
import type { SetDeliveryShippingRequest } from '../../composables/usePosApi'

const posStore = usePosStore()
const api = usePosApi()

// ------------------------------------------------------------------ state

const SHIPPING_KEY = 'pos_shipping_address'

const addressSaved = ref(false)
const addressLoading = ref(false)
const addressError = ref<string | null>(null)
const splitsLoading = ref(false)
const selectingFor = ref<string | null>(null)   // deliveryId currently being saved
const pendingSelectionByDelivery = ref<Record<string, { provider: string; serviceCode: string }>>({})
const selectedDateByDelivery = ref<Record<string, string>>({})
const addressesLoading = ref(false)
const showNewAddressForm = ref(false)
const editingAddressId = ref<string | null>(null)  // addressId currently being edited

const form = ref({
  name: '',
  zip: '',
  street: '',
  number: '',
  complement: '',
  district: '',
  city: '',
  uf: '',
})

// ------------------------------------------------------------------ computed

const canSaveAddress = computed(() =>
  form.value.name.trim() &&
  form.value.zip.trim() &&
  form.value.street.trim() &&
  form.value.number.trim() &&
  form.value.district.trim() &&
  form.value.city.trim() &&
  form.value.uf.trim()
)

const hasCustomerAddresses = computed(() => posStore.customerAddresses.length > 0)

const splits = computed(() => posStore.deliveryShippingOptions)

const allSplitsSelected = computed(() =>
  splits.value.length > 0 &&
  splits.value.every(s => s.selectedProvider && s.selectedServiceCode)
)

// ------------------------------------------------------------------ helpers

function formatCurrency(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDays(days: number) {
  if (!days || days <= 0) return ''
  return days === 1 ? '1 dia útil' : `${days} dias úteis`
}

function formatDate(value?: string | null) {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--'
  return date.toLocaleDateString('pt-BR')
}

function tomorrowDateInput() {
  const date = new Date()
  date.setDate(date.getDate() + 1)
  return date.toISOString().slice(0, 10)
}

function splitKey(split: any, index: number) {
  return split.deliveryId ?? `${split.warehouseId ?? 'unassigned'}-${index}`
}

function optionKey(split: any, opt: any, index: number) {
  return `${splitKey(split, index)}-${opt.provider}-${opt.serviceCode}`
}

function ensureSelectedDateState() {
  const next: Record<string, string> = {}
  for (const split of splits.value) {
    if (!split.deliveryId) continue
    next[split.deliveryId] = selectedDateByDelivery.value[split.deliveryId] ?? split.selectedDate?.slice(0, 10) ?? tomorrowDateInput()
  }
  selectedDateByDelivery.value = next
}

function isSelected(split: any, opt: any) {
  const deliveryId = split.deliveryId
  const pending = deliveryId ? pendingSelectionByDelivery.value[deliveryId] : null
  if (pending) {
    return pending.provider === opt.provider && pending.serviceCode === opt.serviceCode
  }
  return split.selectedProvider === opt.provider && split.selectedServiceCode === opt.serviceCode
}

// ------------------------------------------------------------------ actions

async function onModeChange() {
  if (posStore.deliveryMode === 'pickup') {
    addressSaved.value = false
    showNewAddressForm.value = false
  } else {
    await loadCustomerAddresses()
    if (!hasCustomerAddresses.value) {
      showNewAddressForm.value = true
    }
    if (splits.value.length > 0) {
      addressSaved.value = true
    }
  }
}

async function loadCustomerAddresses() {
  if (!posStore.cart?.customerId) return
  addressesLoading.value = true
  try {
    await posStore.loadCustomerAddresses()
  } finally {
    addressesLoading.value = false
  }
}

async function selectExistingAddress(addressId: string) {
  addressError.value = null
  addressLoading.value = true
  try {
    await posStore.selectCustomerAddress(addressId)
    addressSaved.value = true
  } catch (e: any) {
    addressError.value = e?.response?.data?.message ?? 'Erro ao selecionar endereço'
  } finally {
    addressLoading.value = false
  }
}

async function saveAddress() {
  if (!canSaveAddress.value) return
  addressError.value = null
  addressLoading.value = true
  try {
    const payload = {
      name: form.value.name,
      zip: form.value.zip.replace(/\D/g, ''),
      street: form.value.street,
      number: form.value.number,
      complement: form.value.complement || null,
      district: form.value.district,
      city: form.value.city,
      uf: form.value.uf || null,
    }
    if (editingAddressId.value && posStore.cartId) {
      await api.updateCustomerAddress(posStore.cartId, editingAddressId.value, payload)
      await posStore.loadCustomerAddresses()
      // Also update cart shipping address with the updated data
      await posStore.setShippingAddress(payload)
    } else {
      await posStore.setShippingAddress(payload)
      if (posStore.cart?.customerId) {
        await posStore.loadCustomerAddresses()
      }
    }
    localStorage.setItem(SHIPPING_KEY, JSON.stringify({ ...form.value }))
    editingAddressId.value = null
    showNewAddressForm.value = false
    addressSaved.value = true
  } catch (e: any) {
    addressError.value = e?.response?.data?.message ?? 'Erro ao salvar endereço'
  } finally {
    addressLoading.value = false
  }
}

function editAddress() {
  addressSaved.value = false
}

function startEditAddress(addr: any) {
  editingAddressId.value = addr.id
  form.value = {
    name: addr.name ?? '',
    zip: addr.zip ?? '',
    street: addr.street ?? '',
    number: addr.number ?? '',
    complement: addr.details ?? '',
    district: addr.district ?? '',
    city: addr.city ?? '',
    uf: addr.state?.code ?? '',
  }
  showNewAddressForm.value = true
}

async function loadSplitOptions() {
  splitsLoading.value = true
  try {
    await posStore.loadDeliveryShippingOptions()
  } finally {
    splitsLoading.value = false
  }
}

async function selectOption(deliveryId: string | null, opt: any) {
  if (!deliveryId) return
  const selectedDate = selectedDateByDelivery.value[deliveryId]
  if (!selectedDate) return
  selectingFor.value = deliveryId
  pendingSelectionByDelivery.value = {
    ...pendingSelectionByDelivery.value,
    [deliveryId]: { provider: opt.provider, serviceCode: opt.serviceCode },
  }
  try {
    const req: SetDeliveryShippingRequest = {
      provider: opt.provider,
      serviceCode: opt.serviceCode,
      name: opt.name,
      company: opt.company ?? null,
      priceInCents: opt.priceInCents,
      deliveryDays: opt.deliveryDays,
      selectedDate,
      providerData: opt.providerData ?? null,
    }
    await posStore.setDeliveryShipping(deliveryId, req)
  } finally {
    selectingFor.value = null
    const next = { ...pendingSelectionByDelivery.value }
    delete next[deliveryId]
    pendingSelectionByDelivery.value = next
  }
}

// ------------------------------------------------------------------ lifecycle

function loadShippingFromStorage() {
  try {
    const raw = localStorage.getItem(SHIPPING_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      form.value = { ...form.value, ...parsed }
    }
  } catch { /* ignore */ }
}

onMounted(async () => {
  loadShippingFromStorage()
  if (splits.value.length > 0) {
    posStore.deliveryMode = 'delivery'
    addressSaved.value = true
  }
  ensureSelectedDateState()
})

// Reset widget state when a new sale starts, but keep last address in form
watch(() => posStore.cartId, () => {
  posStore.deliveryMode = 'pickup'
  addressSaved.value = false
  showNewAddressForm.value = false
  loadShippingFromStorage()
})

// Reload customer addresses when customer changes
watch(() => posStore.cart?.customerId, async (newId) => {
  if (posStore.deliveryMode === 'delivery' && newId) {
    await loadCustomerAddresses()
    if (!hasCustomerAddresses.value) {
      showNewAddressForm.value = true
    }
  }
})

watch(splits, () => {
  ensureSelectedDateState()
}, { deep: true, immediate: true })
</script>

<template>
  <div class="flex h-full flex-col bg-white dark:bg-navy-750 rounded-lg overflow-hidden">
    <!-- Header -->
    <div class="border-b border-slate-100 dark:border-navy-700 px-4 py-3">
      <h3 class="text-sm font-semibold text-slate-700 dark:text-navy-100">
        <em class="fa-light fa-truck mr-2 text-primary"></em>
        Entrega
      </h3>
    </div>

    <div class="flex-1 overflow-y-auto p-4 space-y-4 is-scrollbar-hidden">

      <!-- Delivery mode toggle -->
      <div class="grid grid-cols-2 gap-2">
        <button
          class="rounded-lg border px-3 py-2.5 text-xs font-medium transition-all flex items-center justify-center gap-2"
          :class="posStore.deliveryMode === 'pickup'
            ? 'border-primary bg-primary/10 text-primary'
            : 'border-slate-200 dark:border-navy-600 text-slate-600 dark:text-navy-300 hover:border-primary/40'"
          @click="posStore.deliveryMode = 'pickup'; onModeChange()"
        >
          <em class="fa-light fa-store"></em>
          Retirada na loja
        </button>
        <button
          class="rounded-lg border px-3 py-2.5 text-xs font-medium transition-all flex items-center justify-center gap-2"
          :class="posStore.deliveryMode === 'delivery'
            ? 'border-primary bg-primary/10 text-primary'
            : 'border-slate-200 dark:border-navy-600 text-slate-600 dark:text-navy-300 hover:border-primary/40'"
          @click="posStore.deliveryMode = 'delivery'; onModeChange()"
        >
          <em class="fa-light fa-truck"></em>
          Entrega
        </button>
      </div>

      <!-- Pickup confirmation -->
      <div v-if="posStore.deliveryMode === 'pickup'"
           class="rounded-lg bg-slate-50 dark:bg-navy-700 px-4 py-3 text-center">
        <em class="fa-light fa-store text-xl text-slate-400 mb-1 block"></em>
        <p class="text-xs text-slate-500 dark:text-navy-400">
          Cliente retira na loja — sem frete
        </p>
      </div>

      <!-- Delivery flow -->
      <template v-else>

        <!-- Step 1: Address -->
        <div v-if="!addressSaved" class="space-y-3">
          <p class="text-xs font-medium text-slate-600 dark:text-navy-300">
            <em class="fa-light fa-map-marker-alt mr-1 text-primary"></em>
            Endereço de entrega
          </p>

          <div v-if="addressesLoading" class="text-center py-3">
            <em class="fa-duotone fa-spinner-third fa-spin text-primary"></em>
          </div>

          <template v-else-if="hasCustomerAddresses && !showNewAddressForm">
            <div class="space-y-2">
              <div
                v-for="addr in posStore.customerAddresses"
                :key="addr.id"
                class="w-full rounded-lg border border-slate-200 dark:border-navy-600 px-3 py-2.5 text-xs"
              >
                <div class="flex items-start justify-between gap-2">
                  <button
                    class="flex-1 text-left hover:opacity-80 transition-opacity"
                    :disabled="addressLoading"
                    @click="selectExistingAddress(addr.id)"
                  >
                    <p class="font-medium text-slate-700 dark:text-navy-100">
                      <em class="fa-light fa-map-marker-alt mr-1 text-primary"></em>
                      {{ addr.name }}
                    </p>
                    <p class="text-slate-500 dark:text-navy-400 mt-0.5">
                      {{ addr.street }}, {{ addr.number }}
                      <span v-if="addr.details"> — {{ addr.details }}</span>
                    </p>
                    <p class="text-slate-400">{{ addr.district }}, {{ addr.city }}<span v-if="addr.state?.code"> — {{ addr.state.code }}</span> · CEP {{ addr.zip }}</p>
                  </button>
                  <button
                    class="shrink-0 text-slate-300 hover:text-primary transition-colors mt-0.5"
                    title="Editar endereço"
                    @click.stop="startEditAddress(addr)"
                  >
                    <em class="fa-light fa-pen"></em>
                  </button>
                </div>
              </div>
            </div>
            <button
              class="w-full rounded-lg border border-dashed border-slate-300 dark:border-navy-600 px-3 py-2 text-xs text-slate-500 dark:text-navy-400 hover:border-primary/40 hover:text-primary transition-all"
              @click="showNewAddressForm = true"
            >
              <em class="fa-light fa-plus mr-1"></em>
              Usar outro endereço
            </button>
            <p v-if="addressError" class="text-[10px] text-error">
              <em class="fa-light fa-circle-exclamation mr-1"></em>{{ addressError }}
            </p>
            <div v-if="addressLoading" class="text-center py-1">
              <em class="fa-duotone fa-spinner-third fa-spin text-primary text-sm"></em>
            </div>
          </template>

          <template v-else>
            <button
              v-if="hasCustomerAddresses"
              class="text-xs text-slate-400 hover:text-primary"
              @click="showNewAddressForm = false; editingAddressId = null"
            >
              <em class="fa-light fa-arrow-left mr-1"></em>
              Voltar para endereços salvos
            </button>

            <div class="space-y-2">
              <input v-model="form.name" type="text" placeholder="Nome do destinatário *"
                class="form-input w-full rounded-lg border border-slate-200 dark:border-navy-600 bg-white dark:bg-navy-700 px-3 py-2 text-sm text-slate-700 dark:text-navy-100 focus:border-primary focus:outline-none" />
              <div class="grid grid-cols-2 gap-2">
                <input v-model="form.zip" type="text" placeholder="CEP *" maxlength="9"
                  class="form-input w-full rounded-lg border border-slate-200 dark:border-navy-600 bg-white dark:bg-navy-700 px-3 py-2 text-sm text-slate-700 dark:text-navy-100 focus:border-primary focus:outline-none" />
                <input v-model="form.city" type="text" placeholder="Cidade *"
                  class="form-input w-full rounded-lg border border-slate-200 dark:border-navy-600 bg-white dark:bg-navy-700 px-3 py-2 text-sm text-slate-700 dark:text-navy-100 focus:border-primary focus:outline-none" />
              </div>
              <select v-model="form.uf"
                class="form-select w-full rounded-lg border border-slate-200 dark:border-navy-600 bg-white dark:bg-navy-700 px-3 py-2 text-sm text-slate-700 dark:text-navy-100 focus:border-primary focus:outline-none">
                <option value="">Estado (UF) *</option>
                <option value="AC">AC — Acre</option>
                <option value="AL">AL — Alagoas</option>
                <option value="AM">AM — Amazonas</option>
                <option value="AP">AP — Amapá</option>
                <option value="BA">BA — Bahia</option>
                <option value="CE">CE — Ceará</option>
                <option value="DF">DF — Distrito Federal</option>
                <option value="ES">ES — Espírito Santo</option>
                <option value="GO">GO — Goiás</option>
                <option value="MA">MA — Maranhão</option>
                <option value="MG">MG — Minas Gerais</option>
                <option value="MS">MS — Mato Grosso do Sul</option>
                <option value="MT">MT — Mato Grosso</option>
                <option value="PA">PA — Pará</option>
                <option value="PB">PB — Paraíba</option>
                <option value="PE">PE — Pernambuco</option>
                <option value="PI">PI — Piauí</option>
                <option value="PR">PR — Paraná</option>
                <option value="RJ">RJ — Rio de Janeiro</option>
                <option value="RN">RN — Rio Grande do Norte</option>
                <option value="RO">RO — Rondônia</option>
                <option value="RR">RR — Roraima</option>
                <option value="RS">RS — Rio Grande do Sul</option>
                <option value="SC">SC — Santa Catarina</option>
                <option value="SE">SE — Sergipe</option>
                <option value="SP">SP — São Paulo</option>
                <option value="TO">TO — Tocantins</option>
              </select>
              <input v-model="form.street" type="text" placeholder="Logradouro *"
                class="form-input w-full rounded-lg border border-slate-200 dark:border-navy-600 bg-white dark:bg-navy-700 px-3 py-2 text-sm text-slate-700 dark:text-navy-100 focus:border-primary focus:outline-none" />
              <div class="grid grid-cols-2 gap-2">
                <input v-model="form.number" type="text" placeholder="Número *"
                  class="form-input w-full rounded-lg border border-slate-200 dark:border-navy-600 bg-white dark:bg-navy-700 px-3 py-2 text-sm text-slate-700 dark:text-navy-100 focus:border-primary focus:outline-none" />
                <input v-model="form.complement" type="text" placeholder="Complemento"
                  class="form-input w-full rounded-lg border border-slate-200 dark:border-navy-600 bg-white dark:bg-navy-700 px-3 py-2 text-sm text-slate-700 dark:text-navy-100 focus:border-primary focus:outline-none" />
              </div>
              <input v-model="form.district" type="text" placeholder="Bairro *"
                class="form-input w-full rounded-lg border border-slate-200 dark:border-navy-600 bg-white dark:bg-navy-700 px-3 py-2 text-sm text-slate-700 dark:text-navy-100 focus:border-primary focus:outline-none" />
            </div>

            <p v-if="addressError" class="text-[10px] text-error">
              <em class="fa-light fa-circle-exclamation mr-1"></em>{{ addressError }}
            </p>

            <button
              class="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all"
              :class="canSaveAddress
                ? 'bg-primary text-white hover:bg-primary/90'
                : 'bg-slate-100 dark:bg-navy-700 text-slate-400 cursor-not-allowed'"
              :disabled="!canSaveAddress || addressLoading"
              @click="saveAddress"
            >
              <em v-if="addressLoading" class="fa-duotone fa-spinner-third fa-spin"></em>
              <em v-else class="fa-light fa-map-marker-check"></em>
              {{ addressLoading ? 'Salvando...' : 'Confirmar endereço' }}
            </button>
          </template>
        </div>

        <!-- Step 1 confirmed: address summary -->
        <div v-else class="flex items-start justify-between rounded-lg bg-slate-50 dark:bg-navy-700 px-3 py-2.5">
          <div class="text-xs text-slate-600 dark:text-navy-300 space-y-0.5">
            <p class="font-medium text-slate-700 dark:text-navy-100">
              <em class="fa-light fa-map-marker-alt mr-1 text-success"></em>
              {{ form.name || 'Endereço confirmado' }}
            </p>
            <p v-if="form.street">{{ form.street }}, {{ form.number }}<span v-if="form.complement"> — {{ form.complement }}</span></p>
            <p v-if="form.district">{{ form.district }}, {{ form.city }}<span v-if="form.uf"> — {{ form.uf }}</span></p>
            <p v-if="form.zip">CEP {{ form.zip }}</p>
          </div>
          <button class="text-xs text-slate-400 hover:text-primary ml-2 shrink-0" @click="editAddress">
            <em class="fa-light fa-pen"></em>
          </button>
        </div>

        <!-- Step 2: Per-split shipping options -->
        <div v-if="addressSaved" class="space-y-4">

          <!-- Loading spinner -->
          <div v-if="splitsLoading" class="text-center py-4">
            <em class="fa-duotone fa-spinner-third fa-spin text-primary"></em>
            <p class="text-[10px] text-slate-400 mt-1">Buscando opções de frete…</p>
          </div>

          <!-- No splits -->
          <p v-else-if="splits.length === 0" class="text-center text-[10px] text-slate-400 py-2">
            Nenhuma opção de frete disponível.
          </p>

          <!-- One section per delivery split (warehouse bucket) -->
          <template v-else>
            <div v-for="(split, idx) in splits" :key="splitKey(split, idx)" class="space-y-2">
              <!-- Split header -->
              <div class="flex items-center justify-between">
                <p class="text-xs font-medium text-slate-600 dark:text-navy-300">
                  <em class="fa-light fa-warehouse mr-1 text-primary"></em>
                  {{ split.warehouseName ?? 'Sem depósito atribuído' }}
                  <span class="text-slate-400 font-normal">({{ split.itemCount }} {{ split.itemCount === 1 ? 'item' : 'itens' }})</span>
                </p>
                <span v-if="split.selectedServiceCode" class="text-[10px] text-success">
                  <em class="fa-solid fa-circle-check mr-0.5"></em>selecionado
                </span>
              </div>

              <!-- Options list -->
              <div v-if="split.options.length === 0" class="text-[10px] text-slate-400 pl-1">
                Nenhuma opção disponível para este depósito.
              </div>

              <div v-if="split.deliveryId" class="rounded-lg border border-slate-200 dark:border-navy-600 px-3 py-3 bg-white dark:bg-navy-800 space-y-2">
                <label class="block">
                  <span class="text-[10px] uppercase tracking-[0.16em] text-slate-400">Data desejada da entrega</span>
                  <input v-model="selectedDateByDelivery[split.deliveryId]" type="date"
                    class="mt-1.5 w-full rounded-lg border border-slate-200 dark:border-navy-600 bg-white dark:bg-navy-700 px-3 py-2 text-xs text-slate-700 dark:text-navy-100 focus:border-primary focus:outline-none" />
                </label>
                <div class="grid grid-cols-2 gap-2 text-[10px] text-slate-500 dark:text-navy-400">
                  <div class="rounded-lg bg-slate-50 dark:bg-navy-700 px-2.5 py-2">
                    <p class="uppercase tracking-[0.14em] text-slate-400">Cotacao</p>
                    <p class="mt-1 text-slate-700 dark:text-navy-100">{{ formatDate(split.quotedDateToDelivery) }}</p>
                  </div>
                  <div class="rounded-lg bg-slate-50 dark:bg-navy-700 px-2.5 py-2">
                    <p class="uppercase tracking-[0.14em] text-slate-400">Delivery in</p>
                    <p class="mt-1 text-slate-700 dark:text-navy-100">{{ formatDate(split.deliveryIn) }}</p>
                  </div>
                </div>
              </div>

              <button
                v-for="opt in split.options"
                :key="optionKey(split, opt, idx)"
                class="w-full rounded-lg border px-3 py-2.5 text-left transition-all"
                :class="[
                  isSelected(split, opt)
                    ? 'border-primary bg-primary/10'
                    : opt.error
                      ? 'border-slate-100 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 cursor-not-allowed opacity-60'
                      : 'border-slate-200 dark:border-navy-600 hover:border-primary/40',
                ]"
                :disabled="!!opt.error || !split.deliveryId || !selectedDateByDelivery[split.deliveryId] || (!!split.deliveryId && selectingFor === split.deliveryId)"
                @click="!opt.error && selectOption(split.deliveryId, opt)"
              >
                <div class="flex items-center justify-between gap-2">
                  <div class="min-w-0">
                    <p class="text-xs font-semibold truncate"
                       :class="isSelected(split, opt) ? 'text-primary' : 'text-slate-700 dark:text-navy-100'">
                      {{ opt.name }}
                      <span v-if="opt.company" class="font-normal text-slate-400"> · {{ opt.company }}</span>
                    </p>
                    <p v-if="opt.error" class="text-[10px] text-error mt-0.5">{{ opt.error }}</p>
                    <p v-else-if="opt.deliveryDays" class="text-[10px] text-slate-400 mt-0.5">
                      {{ formatDays(opt.deliveryDays) }}
                    </p>
                    <p v-if="split.deliveryId && !selectedDateByDelivery[split.deliveryId]" class="text-[10px] text-amber-500 mt-0.5">Selecione a data desejada antes de aplicar o frete.</p>
                  </div>
                  <div class="text-right shrink-0">
                    <p class="text-sm font-semibold"
                       :class="isSelected(split, opt) ? 'text-primary' : 'text-slate-700 dark:text-navy-100'">
                      {{ opt.priceInCents > 0 ? formatCurrency(opt.priceInCents) : 'Grátis' }}
                    </p>
                    <em v-if="!!split.deliveryId && selectingFor === split.deliveryId && isSelected(split, opt)"
                        class="fa-duotone fa-spinner-third fa-spin text-primary text-xs"></em>
                    <em v-else-if="isSelected(split, opt)"
                        class="fa-solid fa-circle-check text-primary text-xs"></em>
                  </div>
                </div>
              </button>
            </div>

            <!-- Total de frete -->
            <div v-if="allSplitsSelected && posStore.cart?.shippingTotal"
                 class="flex justify-between text-xs text-slate-500 dark:text-navy-400 pt-1 border-t border-slate-100 dark:border-navy-700">
              <span>Total frete</span>
              <span class="text-primary font-medium">
                {{ formatCurrency(posStore.cart.shippingTotal) }}
              </span>
            </div>
          </template>
        </div>

      </template>
    </div>
  </div>
</template>
