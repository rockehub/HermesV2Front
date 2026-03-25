<script lang="ts" setup>
import { ref, onMounted, watch } from 'vue'
import { usePosStore } from '../../store/usePosStore'
import { usePosApi } from '../../composables/usePosApi'

const posStore = usePosStore()
const api = usePosApi()

const paymentMethods = ref<any[]>([])
const selectedMethod = ref<any | null>(null)
const customAmount = ref('')
const adminNotes = ref('')
const showNotesInput = ref(false)
const showBillingForm = ref(false)
const emitNfce = ref(false)
const lastOrderRef = ref<any>(null)
const amountError = ref<string | null>(null)
const finalizeError = ref<string | null>(null)

const BILLING_KEY = 'pos_billing_address'
const billingLoading = ref(false)
const billingZipLoading = ref(false)

const billingAddress = ref({
  name: '',
  street: '',
  number: '',
  complement: '',
  district: '',
  city: '',
  zip: '',
  company: '',
  document: '',
  uf: ''
})

const billingAddressSaved = ref(false)

function loadBillingFromStorage() {
  try {
    const raw = localStorage.getItem(BILLING_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      billingAddress.value = { ...billingAddress.value, ...parsed }
      billingAddressSaved.value = !!(parsed.name && parsed.street && parsed.number && parsed.district && parsed.city && parsed.zip)
    }
  } catch { /* ignore */ }
}

async function loadBillingFromBackend() {
  if (!posStore.cartId) return
  try {
    const res = await api.getCustomerBillingAddress(posStore.cartId)
    const addr = res.data?.data
    if (addr && addr.street) {
      billingAddress.value = {
        name: addr.name ?? '',
        street: addr.street ?? '',
        number: addr.number ?? '',
        complement: addr.details ?? '',
        district: addr.district ?? '',
        city: addr.city ?? '',
        zip: addr.zip ?? '',
        company: addr.company ?? '',
        document: addr.document ?? '',
        uf: addr.state?.code ?? '',
      }
      billingAddressSaved.value = true
    }
  } catch { /* ignore — fall back to localStorage */ }
}

async function saveBillingAddress() {
  localStorage.setItem(BILLING_KEY, JSON.stringify(billingAddress.value))
  if (posStore.cartId && posStore.cart?.customerId) {
    try {
      await api.saveCustomerBillingAddress(posStore.cartId, {
        name: billingAddress.value.name,
        street: billingAddress.value.street,
        number: billingAddress.value.number,
        complement: billingAddress.value.complement || null,
        district: billingAddress.value.district,
        city: billingAddress.value.city,
        zip: billingAddress.value.zip,
        company: billingAddress.value.company || null,
        document: billingAddress.value.document || null,
        uf: billingAddress.value.uf || null,
      })
    } catch { /* ignore — address still saved locally */ }
  }
}

// ViaCEP for billing address
async function fetchBillingViaCep(zip: string) {
  const clean = zip.replace(/\D/g, '')
  if (clean.length !== 8) return
  billingZipLoading.value = true
  try {
    const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`)
    const data = await res.json()
    if (!data.erro) {
      if (data.logradouro) billingAddress.value.street = data.logradouro
      if (data.bairro) billingAddress.value.district = data.bairro
      if (data.localidade) billingAddress.value.city = data.localidade
      if (data.uf) billingAddress.value.uf = data.uf
    }
  } catch { /* ignore */ } finally {
    billingZipLoading.value = false
  }
}

watch(() => billingAddress.value.zip, (val) => {
  const clean = val.replace(/\D/g, '')
  if (clean.length === 8) fetchBillingViaCep(clean)
})

// Clear billing address and reload from backend when customer changes
watch(() => posStore.cart?.customerId, async (newId, oldId) => {
  if (newId === oldId) return
  billingAddress.value = { name: '', street: '', number: '', complement: '', district: '', city: '', zip: '', company: '', document: '', uf: '' }
  billingAddressSaved.value = false
  showBillingForm.value = false
  if (newId) {
    billingLoading.value = true
    try {
      await loadBillingFromBackend()
    } finally {
      billingLoading.value = false
    }
  }
})

onMounted(async () => {
  loadBillingFromStorage()
  billingLoading.value = true
  try {
    const [methodsRes] = await Promise.all([
      api.listPaymentMethods(),
      loadBillingFromBackend(),
    ])
    paymentMethods.value = methodsRes.data.data ?? []
  } catch {
    paymentMethods.value = []
  } finally {
    billingLoading.value = false
  }
  if (paymentMethods.value.length > 0) {
    selectedMethod.value = paymentMethods.value[0]
  }
})

function formatCurrency(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function addExactAmount() {
  if (!selectedMethod.value) return
  const amount = posStore.remaining > 0 ? posStore.remaining : posStore.cartTotal
  posStore.addPayment(selectedMethod.value.code, selectedMethod.value.name, amount)
}

function addCustomAmount() {
  amountError.value = null

  if (!selectedMethod.value) {
    amountError.value = 'Selecione um método de pagamento'
    return
  }
  if (!customAmount.value || customAmount.value.trim() === '') {
    amountError.value = 'Informe o valor'
    return
  }

  const cents = Math.round(parseFloat(customAmount.value.replace(',', '.')) * 100)
  if (isNaN(cents) || cents <= 0) {
    amountError.value = 'Valor inválido'
    return
  }

  posStore.addPayment(selectedMethod.value.code, selectedMethod.value.name, cents)
  customAmount.value = ''
}

async function finalize() {
  if (!posStore.canCheckout) return
  if (!selectedMethod.value) {
    finalizeError.value = 'Selecione o método de pagamento principal'
    return
  }

  if (posStore.deliveryMode === 'delivery') {
    const splits = posStore.deliveryShippingOptions
    const unassigned = splits.filter(s => !s.warehouseId)
    if (unassigned.length > 0) {
      const itemCount = unassigned.reduce((s, x) => s + x.itemCount, 0)
      finalizeError.value = `${itemCount} ${itemCount === 1 ? 'item sem' : 'itens sem'} warehouse configurado — o pedido será gerado sem deliveries válidas. Configure o warehouse dos produtos antes de finalizar.`
      return
    }
    const missing = splits.filter(s => !s.selectedProvider || !s.selectedServiceCode)
    if (missing.length > 0) {
      finalizeError.value = `Selecione o frete para ${missing.length === 1 ? 'o depósito' : 'todos os depósitos'} antes de finalizar.`
      return
    }
  }

  const ba = billingAddress.value
  if (!ba.name.trim() || !ba.street.trim() || !ba.number.trim() || !ba.district.trim() || !ba.city.trim() || !ba.zip.trim() || !ba.uf.trim()) {
    billingAddressSaved.value = false
    showBillingForm.value = true
    finalizeError.value = 'Preencha o endereço de cobrança (obrigatório para NF-e)'
    return
  }
  await saveBillingAddress()
  billingAddressSaved.value = true
  finalizeError.value = null
  lastOrderRef.value = null
  await posStore.finalizeSale(
    selectedMethod.value.id,
    {
      name: ba.name,
      street: ba.street,
      number: ba.number,
      complement: ba.complement || null,
      district: ba.district,
      city: ba.city,
      zip: ba.zip,
      company: ba.company || null,
      document: ba.document || null,
      uf: ba.uf || null,
    },
    adminNotes.value || undefined,
    emitNfce.value || undefined
  )
  lastOrderRef.value = posStore.lastOrder
  adminNotes.value = ''
  showNotesInput.value = false
  showBillingForm.value = false
}
</script>

<template>
  <div class="flex h-full flex-col bg-white dark:bg-navy-750 rounded-lg overflow-hidden">
    <div class="border-b border-slate-100 dark:border-navy-700 px-4 py-3">
      <h3 class="text-sm font-semibold text-slate-700 dark:text-navy-100">
        <em class="fa-light fa-credit-card mr-2 text-primary"></em>
        Pagamento
      </h3>
    </div>

    <div class="flex-1 overflow-y-auto p-4 space-y-4 is-scrollbar-hidden">

      <!-- Success banner after checkout -->
      <div v-if="lastOrderRef" class="rounded-lg bg-success/10 border border-success/20 px-4 py-3 text-center">
        <em class="fa-light fa-circle-check text-2xl text-success mb-1 block"></em>
        <p class="text-sm font-semibold text-success">Venda finalizada!</p>
        <p class="text-xs text-slate-500 mt-0.5">Pedido #{{ lastOrderRef.number }}</p>
        <button
          class="mt-2 text-xs text-primary hover:underline"
          @click="lastOrderRef = null"
        >
          Nova venda
        </button>
      </div>

      <!-- Payment method selector -->
      <div>
        <label class="mb-1.5 block text-xs font-medium text-slate-600 dark:text-navy-300">Método de pagamento</label>
        <div class="grid grid-cols-2 gap-1.5">
          <button
            v-for="method in paymentMethods"
            :key="method.code"
            class="rounded-lg border px-3 py-2 text-xs font-medium transition-all"
            :class="selectedMethod?.code === method.code
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-slate-200 dark:border-navy-600 text-slate-600 dark:text-navy-300 hover:border-primary/40'"
            @click="selectedMethod = method; amountError = null"
          >
            {{ method.name }}
          </button>
          <p v-if="paymentMethods.length === 0" class="col-span-2 text-center text-[10px] text-slate-400 py-2">
            Nenhum método disponível
          </p>
        </div>
      </div>

      <!-- Amount buttons -->
      <div v-if="posStore.hasItems" class="space-y-2">
        <button
          class="flex w-full items-center justify-between rounded-lg bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary/20 transition-colors"
          @click="addExactAmount"
        >
          <span>Pagar valor exato</span>
          <span>{{ formatCurrency(posStore.remaining > 0 ? posStore.remaining : posStore.cartTotal) }}</span>
        </button>

        <div class="space-y-1">
          <div class="flex gap-2">
            <div class="relative flex-1">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">R$</span>
              <input
                v-model="customAmount"
                type="text"
                inputmode="decimal"
                placeholder="0,00"
                class="form-input w-full rounded-lg border pl-9 pr-3 py-2 text-sm focus:outline-none transition-colors"
                :class="amountError
                  ? 'border-error bg-error/5 text-error focus:border-error'
                  : 'border-slate-200 dark:border-navy-600 bg-white dark:bg-navy-700 text-slate-700 dark:text-navy-100 focus:border-primary'"
                @keydown.enter="addCustomAmount"
                @input="amountError = null"
              />
            </div>
            <button
              class="rounded-lg border px-4 py-2 text-xs font-medium transition-colors"
              :class="selectedMethod
                ? 'border-primary/40 bg-primary/5 text-primary hover:bg-primary/10'
                : 'border-slate-200 dark:border-navy-600 text-slate-400 cursor-not-allowed'"
              @click="addCustomAmount"
            >
              Adicionar
            </button>
          </div>
          <p v-if="amountError" class="text-[10px] text-error">
            <em class="fa-light fa-circle-exclamation mr-1"></em>{{ amountError }}
          </p>
        </div>
      </div>

      <!-- Payments list -->
      <div v-if="posStore.payments.length > 0" class="space-y-1.5">
        <p class="text-xs font-medium text-slate-500 dark:text-navy-400">Pagamentos adicionados</p>
        <div
          v-for="(payment, idx) in posStore.payments"
          :key="idx"
          class="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-navy-700 px-3 py-2"
        >
          <div class="flex items-center gap-2 text-xs">
            <em class="fa-light fa-circle-check text-success"></em>
            <span class="text-slate-700 dark:text-navy-100 font-medium">{{ payment.methodName }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-sm font-semibold text-slate-700 dark:text-navy-100">{{ formatCurrency(payment.amountInCents) }}</span>
            <button class="text-slate-300 hover:text-error transition-colors text-xs" @click="posStore.removePayment(idx)">
              <em class="fa-light fa-times"></em>
            </button>
          </div>
        </div>
      </div>

      <!-- Progress and totals -->
      <div v-if="posStore.hasItems" class="space-y-2">
        <div class="flex justify-between text-xs text-slate-500 dark:text-navy-400">
          <span>Total</span>
          <span>{{ formatCurrency(posStore.cartTotal) }}</span>
        </div>
        <div class="flex justify-between text-xs text-slate-500 dark:text-navy-400">
          <span>Pago</span>
          <span class="text-success font-medium">{{ formatCurrency(posStore.paid) }}</span>
        </div>
        <div v-if="posStore.remaining > 0" class="flex justify-between text-xs font-medium text-amber-600">
          <span>Falta</span>
          <span>{{ formatCurrency(posStore.remaining) }}</span>
        </div>
        <div v-if="posStore.change > 0" class="flex justify-between text-xs font-semibold text-success">
          <span>Troco</span>
          <span>{{ formatCurrency(posStore.change) }}</span>
        </div>

        <!-- Progress bar -->
        <div class="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-navy-600">
          <div
            class="h-full rounded-full bg-primary transition-all duration-300"
            :style="{ width: Math.min(100, (posStore.paid / Math.max(posStore.cartTotal, 1)) * 100) + '%' }"
          ></div>
        </div>
      </div>

      <!-- Billing address -->
      <div v-if="posStore.hasItems" class="space-y-1.5">
        <p class="text-xs font-medium text-slate-500 dark:text-navy-400">
          <em class="fa-light fa-file-invoice mr-1 text-primary"></em>
          Endereço de cobrança (NF-e)
        </p>

        <!-- Saved summary -->
        <div v-if="billingAddressSaved && !showBillingForm"
             class="flex items-start justify-between rounded-lg bg-slate-50 dark:bg-navy-700 px-3 py-2">
          <div class="text-xs text-slate-600 dark:text-navy-300 space-y-0.5 min-w-0">
            <p class="font-medium text-slate-700 dark:text-navy-100 truncate">
              <em class="fa-light fa-circle-check mr-1 text-success"></em>
              {{ billingAddress.name }}<span v-if="billingAddress.document"> · {{ billingAddress.document }}</span>
            </p>
            <p class="truncate">{{ billingAddress.street }}, {{ billingAddress.number }}<span v-if="billingAddress.complement"> — {{ billingAddress.complement }}</span></p>
            <p class="truncate">{{ billingAddress.district }}, {{ billingAddress.city }}<span v-if="billingAddress.uf"> — {{ billingAddress.uf }}</span> · CEP {{ billingAddress.zip }}</p>
          </div>
          <button class="text-xs text-slate-400 hover:text-primary ml-2 shrink-0 mt-0.5" @click="showBillingForm = true">
            <em class="fa-light fa-pen"></em>
          </button>
        </div>

        <!-- Form -->
        <div v-else>
          <button v-if="billingAddressSaved" class="mb-1.5 text-xs text-slate-400 hover:text-primary transition-colors" @click="showBillingForm = false">
            <em class="fa-light fa-arrow-left mr-1"></em>
            Usar endereço salvo
          </button>
          <div class="grid grid-cols-2 gap-2">
            <input v-model="billingAddress.name" placeholder="Nome *" class="col-span-2 form-input rounded border border-slate-200 dark:border-navy-600 bg-white dark:bg-navy-700 px-2 py-1.5 text-xs" />
            <input v-model="billingAddress.document" placeholder="CPF / CNPJ" class="col-span-2 form-input rounded border border-slate-200 dark:border-navy-600 bg-white dark:bg-navy-700 px-2 py-1.5 text-xs" />
            <input v-model="billingAddress.street" placeholder="Rua *" class="col-span-2 form-input rounded border border-slate-200 dark:border-navy-600 bg-white dark:bg-navy-700 px-2 py-1.5 text-xs" />
            <input v-model="billingAddress.number" placeholder="Número *" class="form-input rounded border border-slate-200 dark:border-navy-600 bg-white dark:bg-navy-700 px-2 py-1.5 text-xs" />
            <input v-model="billingAddress.complement" placeholder="Complemento" class="form-input rounded border border-slate-200 dark:border-navy-600 bg-white dark:bg-navy-700 px-2 py-1.5 text-xs" />
            <input v-model="billingAddress.district" placeholder="Bairro *" class="form-input rounded border border-slate-200 dark:border-navy-600 bg-white dark:bg-navy-700 px-2 py-1.5 text-xs" />
            <input v-model="billingAddress.city" placeholder="Cidade *" class="form-input rounded border border-slate-200 dark:border-navy-600 bg-white dark:bg-navy-700 px-2 py-1.5 text-xs" />
            <div class="relative">
              <input v-model="billingAddress.zip" placeholder="CEP *" class="form-input w-full rounded border border-slate-200 dark:border-navy-600 bg-white dark:bg-navy-700 px-2 py-1.5 text-xs" :class="billingZipLoading ? 'pr-7' : ''" />
              <em v-if="billingZipLoading" class="fa-duotone fa-spinner-third fa-spin absolute right-2 top-1/2 -translate-y-1/2 text-primary text-[10px] pointer-events-none"></em>
            </div>
            <select v-model="billingAddress.uf" class="col-span-2 form-select rounded border border-slate-200 dark:border-navy-600 bg-white dark:bg-navy-700 px-2 py-1.5 text-xs">
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
            <input v-model="billingAddress.company" placeholder="Empresa" class="form-input rounded border border-slate-200 dark:border-navy-600 bg-white dark:bg-navy-700 px-2 py-1.5 text-xs" />
          </div>
          <button
            class="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-all bg-primary/10 text-primary hover:bg-primary/20"
            @click="saveBillingAddress(); billingAddressSaved = true; showBillingForm = false"
          >
            <em class="fa-light fa-circle-check"></em>
            Confirmar endereço
          </button>
        </div>
      </div>

      <!-- NF-Ce toggle (por venda) -->
      <div v-if="posStore.hasItems" class="flex items-center gap-2.5">
        <button
          type="button"
          :class="['relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0',
            emitNfce ? 'bg-cyan-500' : 'bg-slate-200 dark:bg-navy-600']"
          @click="emitNfce = !emitNfce"
        >
          <span :class="['inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform',
            emitNfce ? 'translate-x-4' : 'translate-x-0.5']" />
        </button>
        <span class="text-xs text-slate-600 dark:text-navy-300">
          Emitir <strong :class="emitNfce ? 'text-cyan-600' : ''">{{ emitNfce ? 'NF-Ce' : 'sem nota fiscal' }}</strong>
          <span v-if="emitNfce" class="ml-1 text-[10px] text-slate-400">(consumidor final)</span>
        </span>
      </div>

      <!-- Notes toggle -->
      <div v-if="posStore.hasItems">
        <button class="text-xs text-slate-400 hover:text-primary transition-colors" @click="showNotesInput = !showNotesInput">
          <em class="fa-light fa-note-sticky mr-1"></em>
          {{ showNotesInput ? 'Ocultar observações' : 'Adicionar observações' }}
        </button>
        <textarea
          v-if="showNotesInput"
          v-model="adminNotes"
          placeholder="Observações da venda..."
          class="mt-2 form-textarea w-full rounded-lg border border-slate-200 dark:border-navy-600 bg-white dark:bg-navy-700 px-3 py-2 text-xs text-slate-700 dark:text-navy-100 resize-none focus:border-primary focus:outline-none"
          rows="2"
        ></textarea>
      </div>
    </div>

    <!-- Finalize button -->
    <div class="border-t border-slate-200 dark:border-navy-700 p-4 space-y-2">
      <p v-if="finalizeError" class="text-[10px] text-error text-center">
        <em class="fa-light fa-circle-exclamation mr-1"></em>{{ finalizeError }}
      </p>
      <button
        class="flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold transition-all"
        :class="posStore.canCheckout
          ? 'bg-success text-white hover:bg-success/90 active:scale-95 shadow-lg shadow-success/20'
          : 'bg-slate-100 dark:bg-navy-700 text-slate-400 dark:text-navy-400 cursor-not-allowed'"
        :disabled="!posStore.canCheckout || posStore.isCheckingOut"
        @click="finalize"
      >
        <em v-if="posStore.isCheckingOut" class="fa-duotone fa-spinner-third fa-spin"></em>
        <em v-else class="fa-light fa-cash-register"></em>
        {{ posStore.isCheckingOut ? 'Processando...' : 'Finalizar Venda' }}
      </button>
    </div>
  </div>
</template>
