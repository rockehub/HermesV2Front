<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { $axios } from '@/helpers/integration/integration'
import { useAuthStore } from '@/stores/auth'
import notification from '@/helpers/utils/notification'

const router = useRouter()
const auth = useAuthStore()
const toast = notification

// ── Steps ──────────────────────────────────────────────────────────────────
const TOTAL_STEPS = 5
const step = ref(1)
const loading = ref(false)
const submitting = ref(false)

// ── Step 1: Empresa ─────────────────────────────────────────────────────────
const empresa = ref({ legalName: '', tradeName: '', cnpj: '' })

function formatCnpj(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 14)
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}
function onCnpjInput(e: Event) {
  empresa.value.cnpj = formatCnpj((e.target as HTMLInputElement).value)
}

// ── Step 2: Endereço ────────────────────────────────────────────────────────
const BRAZIL_STATES = [
  { code: 'AC', name: 'Acre' }, { code: 'AL', name: 'Alagoas' }, { code: 'AM', name: 'Amazonas' },
  { code: 'AP', name: 'Amapá' }, { code: 'BA', name: 'Bahia' }, { code: 'CE', name: 'Ceará' },
  { code: 'DF', name: 'Distrito Federal' }, { code: 'ES', name: 'Espírito Santo' }, { code: 'GO', name: 'Goiás' },
  { code: 'MA', name: 'Maranhão' }, { code: 'MG', name: 'Minas Gerais' }, { code: 'MS', name: 'Mato Grosso do Sul' },
  { code: 'MT', name: 'Mato Grosso' }, { code: 'PA', name: 'Pará' }, { code: 'PB', name: 'Paraíba' },
  { code: 'PE', name: 'Pernambuco' }, { code: 'PI', name: 'Piauí' }, { code: 'PR', name: 'Paraná' },
  { code: 'RJ', name: 'Rio de Janeiro' }, { code: 'RN', name: 'Rio Grande do Norte' }, { code: 'RO', name: 'Rondônia' },
  { code: 'RR', name: 'Roraima' }, { code: 'RS', name: 'Rio Grande do Sul' }, { code: 'SC', name: 'Santa Catarina' },
  { code: 'SE', name: 'Sergipe' }, { code: 'SP', name: 'São Paulo' }, { code: 'TO', name: 'Tocantins' }
]

const address = ref({
  zip: '', street: '', number: '', district: '', city: '', stateCode: 'SP'
})
const loadingCep = ref(false)

async function searchCep() {
  const cep = address.value.zip.replace(/\D/g, '')
  if (cep.length !== 8) return
  loadingCep.value = true
  try {
    const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
    const data = await res.json()
    if (!data.erro) {
      address.value.street = data.logradouro || ''
      address.value.district = data.bairro || ''
      address.value.city = data.localidade || ''
      address.value.stateCode = data.uf || 'SP'
    }
  } catch {
    // ignore, user fills manually
  } finally {
    loadingCep.value = false
  }
}

function formatCep(value: string) {
  const d = value.replace(/\D/g, '').slice(0, 8)
  return d.length > 5 ? d.replace(/(\d{5})(\d)/, '$1-$2') : d
}
function onCepInput(e: Event) {
  address.value.zip = formatCep((e.target as HTMLInputElement).value)
  if (address.value.zip.replace(/\D/g, '').length === 8) searchCep()
}

// ── Step 3: Moeda & Unidades ────────────────────────────────────────────────
interface CurrencyOption { name: string; symbol: string; decimals: number; selected: boolean; isDefault: boolean }
interface UnitOption { code: string; label: string; selected: boolean }

const currencies = ref<CurrencyOption[]>([
  { name: 'Real Brasileiro', symbol: 'R$', decimals: 2, selected: true, isDefault: true },
  { name: 'Dólar Americano', symbol: 'USD', decimals: 2, selected: false, isDefault: false },
  { name: 'Euro', symbol: '€', decimals: 2, selected: false, isDefault: false },
  { name: 'Libra Esterlina', symbol: '£', decimals: 2, selected: false, isDefault: false },
])

const units = ref<UnitOption[]>([
  { code: 'UN', label: 'Unidade (UN)', selected: true },
  { code: 'KG', label: 'Quilograma (KG)', selected: true },
  { code: 'G',  label: 'Grama (G)', selected: false },
  { code: 'L',  label: 'Litro (L)', selected: false },
  { code: 'ML', label: 'Mililitro (ML)', selected: false },
  { code: 'M',  label: 'Metro (M)', selected: false },
  { code: 'CM', label: 'Centímetro (CM)', selected: false },
  { code: 'M2', label: 'Metro² (M²)', selected: false },
  { code: 'CX', label: 'Caixa (CX)', selected: false },
  { code: 'PCT',label: 'Pacote (PCT)', selected: false },
])

function setDefaultCurrency(index: number) {
  currencies.value.forEach((c, i) => (c.isDefault = i === index))
}

const selectedCurrencies = computed(() => currencies.value.filter(c => c.selected))
const hasDefaultCurrency = computed(() => currencies.value.some(c => c.selected && c.isDefault))

// ── Step 4: Loja & Pagamento ────────────────────────────────────────────────
interface PaymentOption { code: string; label: string; selected: boolean }

const storeName = ref('')
const payments = ref<PaymentOption[]>([
  { code: 'dinheiro',      label: 'Dinheiro', selected: true },
  { code: 'pix',           label: 'PIX', selected: true },
  { code: 'debito',        label: 'Cartão Débito', selected: true },
  { code: 'credito',       label: 'Cartão Crédito', selected: true },
  { code: 'transferencia', label: 'Transferência Bancária', selected: false },
  { code: 'faturado',      label: 'Faturado', selected: false },
])

// ── Step 5: Entrega ─────────────────────────────────────────────────────────
interface ShippingOption { code: string; label: string; description: string; selected: boolean }

const shippings = ref<ShippingOption[]>([
  { code: 'pickup', label: 'Retirada na Loja', description: 'Cliente retira pessoalmente', selected: true },
  { code: 'pac',    label: 'PAC', description: 'Envio via PAC (Melhor Envio)', selected: false },
  { code: 'sedex',  label: 'SEDEX', description: 'Envio expresso via SEDEX (Melhor Envio)', selected: false },
])

// ── Navigation ──────────────────────────────────────────────────────────────
function nextStep() {
  if (!validateCurrentStep()) return
  if (step.value === 4 && !storeName.value) {
    storeName.value = empresa.value.tradeName || empresa.value.legalName
  }
  step.value++
}

function prevStep() {
  if (step.value > 1) step.value--
}

function validateCurrentStep(): boolean {
  if (step.value === 1) {
    if (!empresa.value.legalName.trim()) {
      toast({ text: 'Razão social é obrigatória', variant: 'error' })
      return false
    }
  }
  if (step.value === 2) {
    const a = address.value
    if (!a.zip || !a.street || !a.number || !a.city || !a.stateCode) {
      toast({ text: 'Preencha todos os campos obrigatórios do endereço', variant: 'error' })
      return false
    }
  }
  if (step.value === 3) {
    if (selectedCurrencies.value.length === 0) {
      toast({ text: 'Selecione pelo menos uma moeda', variant: 'error' })
      return false
    }
    if (!hasDefaultCurrency.value) {
      toast({ text: 'Selecione uma moeda padrão entre as selecionadas', variant: 'error' })
      return false
    }
    if (units.value.every(u => !u.selected)) {
      toast({ text: 'Selecione pelo menos uma unidade de medida', variant: 'error' })
      return false
    }
  }
  if (step.value === 4) {
    if (!storeName.value.trim()) {
      toast({ text: 'Nome da loja é obrigatório', variant: 'error' })
      return false
    }
    if (payments.value.every(p => !p.selected)) {
      toast({ text: 'Selecione pelo menos um meio de pagamento', variant: 'error' })
      return false
    }
  }
  if (step.value === 5) {
    if (shippings.value.every(s => !s.selected)) {
      toast({ text: 'Selecione pelo menos um método de entrega', variant: 'error' })
      return false
    }
  }
  return true
}

// ── Submit ──────────────────────────────────────────────────────────────────
async function submit() {
  if (!validateCurrentStep()) return
  submitting.value = true
  try {
    const payload = {
      legalName: empresa.value.legalName.trim(),
      tradeName: empresa.value.tradeName.trim() || null,
      cnpj: empresa.value.cnpj.replace(/\D/g, '') || null,
      storeName: storeName.value.trim(),
      addressZip: address.value.zip.replace(/\D/g, ''),
      addressStreet: address.value.street,
      addressNumber: address.value.number,
      addressDistrict: address.value.district || null,
      addressCity: address.value.city,
      addressStateCode: address.value.stateCode,
      currencies: selectedCurrencies.value.map(c => ({
        name: c.name,
        symbol: c.symbol,
        decimals: c.decimals,
        isDefault: c.isDefault
      })),
      unitCodes: units.value.filter(u => u.selected).map(u => u.code),
      paymentMethodCodes: payments.value.filter(p => p.selected).map(p => p.code),
      shippingOptions: shippings.value.filter(s => s.selected).map(s => s.code),
    }

    await $axios.post('/api/v1/account/store-setup', payload)

    // Refresh user profile so storeSetupComplete = true
    await auth.fetchUserProfile()

    toast({ text: 'Loja configurada com sucesso! Bem-vindo(a) ao painel.', variant: 'success' })
    router.push({ name: 'dashboard' })
  } catch (error: any) {
    const msg = error.response?.data?.message ?? 'Erro ao salvar configuração'
    toast({ text: msg, variant: 'error' })
  } finally {
    submitting.value = false
  }
}

// ── Load current account data ────────────────────────────────────────────────
onMounted(async () => {
  loading.value = true
  try {
    const res = await $axios.get('/api/v1/account/onboarding')
    const d = res.data.data
    empresa.value.legalName = d?.legalName ?? d?.tenantName ?? ''
    empresa.value.tradeName = d?.tradeName ?? d?.tenantName ?? ''
    empresa.value.cnpj = d?.cnpj ?? ''
    storeName.value = d?.tradeName ?? d?.tenantName ?? ''
  } catch {
    // ignore
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="flex min-h-screen grow flex-col items-center justify-center bg-slate-50 px-4 py-12 dark:bg-navy-900">
    <div class="w-full max-w-xl">
      <!-- Header -->
      <div class="mb-8 text-center">
        <p class="text-xs font-semibold uppercase tracking-widest text-primary">Configuração inicial</p>
        <h1 class="mt-2 text-3xl font-bold text-slate-900 dark:text-navy-50">Configure sua loja</h1>
        <p class="mt-2 text-sm text-slate-500 dark:text-navy-300">
          Estas informações são essenciais para o funcionamento correto do sistema.
        </p>
      </div>

      <!-- Progress bar -->
      <div class="mb-8">
        <div class="mb-2 flex justify-between text-xs text-slate-400 dark:text-navy-300">
          <span>Etapa {{ step }} de {{ TOTAL_STEPS }}</span>
          <span>{{ Math.round((step / TOTAL_STEPS) * 100) }}%</span>
        </div>
        <div class="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-navy-600">
          <div
            class="h-full rounded-full bg-primary transition-all duration-300"
            :style="{ width: `${(step / TOTAL_STEPS) * 100}%` }"
          />
        </div>
        <div class="mt-3 flex justify-between">
          <button
            v-for="i in TOTAL_STEPS"
            :key="i"
            class="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors"
            :class="i < step
              ? 'bg-primary text-white'
              : i === step
                ? 'border-2 border-primary bg-white text-primary dark:bg-navy-700'
                : 'border border-slate-200 bg-white text-slate-400 dark:border-navy-500 dark:bg-navy-700 dark:text-navy-400'"
          >
            <svg v-if="i < step" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
            </svg>
            <span v-else>{{ i }}</span>
          </button>
        </div>
      </div>

      <!-- Card -->
      <div class="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-navy-500 dark:bg-navy-700">

        <!-- Step 1: Empresa -->
        <div v-if="step === 1">
          <h2 class="mb-1 text-lg font-semibold text-slate-900 dark:text-navy-50">Dados da empresa</h2>
          <p class="mb-6 text-sm text-slate-500 dark:text-navy-300">Informações legais do seu negócio.</p>
          <div class="grid gap-4">
            <div>
              <label class="mb-1.5 block text-xs font-medium text-slate-700 dark:text-navy-100">
                Razão social <span class="text-error">*</span>
              </label>
              <input
                v-model="empresa.legalName"
                class="form-input w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2.5 text-sm placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:text-navy-50 dark:hover:border-navy-400 dark:focus:border-accent"
                placeholder="Ex: Empresa LTDA"
              />
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-medium text-slate-700 dark:text-navy-100">Nome fantasia</label>
              <input
                v-model="empresa.tradeName"
                class="form-input w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2.5 text-sm placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:text-navy-50 dark:hover:border-navy-400 dark:focus:border-accent"
                placeholder="Ex: Minha Loja"
              />
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-medium text-slate-700 dark:text-navy-100">CNPJ</label>
              <input
                :value="empresa.cnpj"
                @input="onCnpjInput"
                inputmode="numeric"
                class="form-input w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2.5 text-sm placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:text-navy-50 dark:hover:border-navy-400 dark:focus:border-accent"
                placeholder="00.000.000/0000-00"
              />
            </div>
          </div>
        </div>

        <!-- Step 2: Endereço -->
        <div v-else-if="step === 2">
          <h2 class="mb-1 text-lg font-semibold text-slate-900 dark:text-navy-50">Endereço principal</h2>
          <p class="mb-6 text-sm text-slate-500 dark:text-navy-300">
            Usado como origem dos pedidos e depósito principal.
          </p>
          <div class="grid gap-4">
            <div>
              <label class="mb-1.5 block text-xs font-medium text-slate-700 dark:text-navy-100">
                CEP <span class="text-error">*</span>
              </label>
              <div class="relative">
                <input
                  :value="address.zip"
                  @input="onCepInput"
                  inputmode="numeric"
                  class="form-input w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2.5 text-sm placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:text-navy-50 dark:hover:border-navy-400 dark:focus:border-accent"
                  placeholder="00000-000"
                />
                <div v-if="loadingCep" class="absolute inset-y-0 right-3 flex items-center">
                  <div class="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              </div>
            </div>
            <div class="grid grid-cols-3 gap-3">
              <div class="col-span-2">
                <label class="mb-1.5 block text-xs font-medium text-slate-700 dark:text-navy-100">
                  Logradouro <span class="text-error">*</span>
                </label>
                <input
                  v-model="address.street"
                  class="form-input w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2.5 text-sm placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:text-navy-50 dark:hover:border-navy-400 dark:focus:border-accent"
                  placeholder="Rua, Av., etc."
                />
              </div>
              <div>
                <label class="mb-1.5 block text-xs font-medium text-slate-700 dark:text-navy-100">
                  Número <span class="text-error">*</span>
                </label>
                <input
                  v-model="address.number"
                  class="form-input w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2.5 text-sm placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:text-navy-50 dark:hover:border-navy-400 dark:focus:border-accent"
                  placeholder="100"
                />
              </div>
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-medium text-slate-700 dark:text-navy-100">Bairro</label>
              <input
                v-model="address.district"
                class="form-input w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2.5 text-sm placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:text-navy-50 dark:hover:border-navy-400 dark:focus:border-accent"
                placeholder="Bairro"
              />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="mb-1.5 block text-xs font-medium text-slate-700 dark:text-navy-100">
                  Cidade <span class="text-error">*</span>
                </label>
                <input
                  v-model="address.city"
                  class="form-input w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2.5 text-sm placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:text-navy-50 dark:hover:border-navy-400 dark:focus:border-accent"
                  placeholder="São Paulo"
                />
              </div>
              <div>
                <label class="mb-1.5 block text-xs font-medium text-slate-700 dark:text-navy-100">
                  Estado <span class="text-error">*</span>
                </label>
                <select
                  v-model="address.stateCode"
                  class="form-select w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2.5 text-sm hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:text-navy-50 dark:hover:border-navy-400 dark:focus:border-accent"
                >
                  <option v-for="s in BRAZIL_STATES" :key="s.code" :value="s.code">
                    {{ s.code }} – {{ s.name }}
                  </option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 3: Moeda & Unidades -->
        <div v-else-if="step === 3">
          <h2 class="mb-1 text-lg font-semibold text-slate-900 dark:text-navy-50">Moedas e unidades</h2>
          <p class="mb-6 text-sm text-slate-500 dark:text-navy-300">Configure as moedas e unidades de medida da loja.</p>

          <div class="mb-6">
            <label class="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-navy-300">
              Moedas aceitas
            </label>
            <div class="space-y-2">
              <div
                v-for="(c, i) in currencies"
                :key="c.symbol"
                class="flex items-center justify-between rounded-xl border p-3 transition-colors"
                :class="c.selected
                  ? 'border-primary/30 bg-primary/5 dark:border-primary/40 dark:bg-primary/10'
                  : 'border-slate-200 dark:border-navy-500'"
              >
                <label class="flex cursor-pointer items-center gap-3">
                  <input type="checkbox" v-model="c.selected" class="form-checkbox h-4 w-4 rounded text-primary" />
                  <span class="text-sm font-medium text-slate-800 dark:text-navy-50">
                    {{ c.name }}
                    <span class="ml-1 font-normal text-slate-400 dark:text-navy-300">({{ c.symbol }})</span>
                  </span>
                </label>
                <button
                  v-if="c.selected"
                  type="button"
                  @click="setDefaultCurrency(i)"
                  class="ml-2 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors"
                  :class="c.isDefault
                    ? 'bg-primary text-white'
                    : 'border border-slate-300 text-slate-500 hover:border-primary hover:text-primary dark:border-navy-400 dark:text-navy-300'"
                >
                  {{ c.isDefault ? 'Padrão' : 'Definir padrão' }}
                </button>
              </div>
            </div>
          </div>

          <div>
            <label class="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-navy-300">
              Unidades de medida
            </label>
            <div class="grid grid-cols-2 gap-2">
              <label
                v-for="u in units"
                :key="u.code"
                class="flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 transition-colors"
                :class="u.selected
                  ? 'border-primary/30 bg-primary/5 dark:border-primary/40 dark:bg-primary/10'
                  : 'border-slate-200 dark:border-navy-500'"
              >
                <input type="checkbox" v-model="u.selected" class="form-checkbox h-4 w-4 rounded text-primary" />
                <span class="text-sm text-slate-700 dark:text-navy-100">{{ u.label }}</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Step 4: Loja & Pagamento -->
        <div v-else-if="step === 4">
          <h2 class="mb-1 text-lg font-semibold text-slate-900 dark:text-navy-50">Loja e pagamentos</h2>
          <p class="mb-6 text-sm text-slate-500 dark:text-navy-300">Configure a identidade da loja e os meios de pagamento no caixa.</p>

          <div class="mb-6">
            <label class="mb-1.5 block text-xs font-medium text-slate-700 dark:text-navy-100">
              Nome da loja <span class="text-error">*</span>
            </label>
            <input
              v-model="storeName"
              class="form-input w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2.5 text-sm placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:text-navy-50 dark:hover:border-navy-400 dark:focus:border-accent"
              placeholder="Ex: Minha Loja"
            />
            <p class="mt-1 text-xs text-slate-400 dark:text-navy-300">
              Usado para criar o fornecedor principal e a marca padrão.
            </p>
          </div>

          <div>
            <label class="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-navy-300">
              Meios de pagamento (POS)
            </label>
            <div class="grid grid-cols-2 gap-2">
              <label
                v-for="p in payments"
                :key="p.code"
                class="flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 transition-colors"
                :class="p.selected
                  ? 'border-primary/30 bg-primary/5 dark:border-primary/40 dark:bg-primary/10'
                  : 'border-slate-200 dark:border-navy-500'"
              >
                <input type="checkbox" v-model="p.selected" class="form-checkbox h-4 w-4 rounded text-primary" />
                <span class="text-sm text-slate-700 dark:text-navy-100">{{ p.label }}</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Step 5: Entrega -->
        <div v-else-if="step === 5">
          <h2 class="mb-1 text-lg font-semibold text-slate-900 dark:text-navy-50">Métodos de entrega</h2>
          <p class="mb-6 text-sm text-slate-500 dark:text-navy-300">
            Selecione como você entrega ou disponibiliza seus produtos.
          </p>
          <div class="space-y-3">
            <label
              v-for="s in shippings"
              :key="s.code"
              class="flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors"
              :class="s.selected
                ? 'border-primary/30 bg-primary/5 dark:border-primary/40 dark:bg-primary/10'
                : 'border-slate-200 dark:border-navy-500'"
            >
              <input type="checkbox" v-model="s.selected" class="form-checkbox mt-0.5 h-4 w-4 rounded text-primary" />
              <div>
                <p class="text-sm font-medium text-slate-800 dark:text-navy-50">{{ s.label }}</p>
                <p class="text-xs text-slate-400 dark:text-navy-300">{{ s.description }}</p>
              </div>
            </label>
          </div>

          <div class="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-700/50 dark:bg-amber-900/20">
            <p class="text-xs font-medium text-amber-700 dark:text-amber-400">
              ℹ️ PAC e SEDEX são cotados via API do Melhor Envio. É necessário configurar a integração posteriormente nas configurações.
            </p>
          </div>
        </div>

      </div>

      <!-- Footer buttons -->
      <div class="mt-6 flex items-center justify-between gap-3">
        <button
          v-if="step > 1"
          type="button"
          @click="prevStep"
          class="btn rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-navy-500 dark:bg-navy-700 dark:text-navy-100 dark:hover:bg-navy-600"
        >
          ← Voltar
        </button>
        <div v-else />

        <button
          v-if="step < TOTAL_STEPS"
          type="button"
          @click="nextStep"
          class="btn ml-auto rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-focus"
        >
          Próximo →
        </button>
        <button
          v-else
          type="button"
          :disabled="submitting"
          @click="submit"
          class="btn ml-auto rounded-xl bg-success px-6 py-2.5 text-sm font-medium text-white hover:bg-success/90 disabled:opacity-60"
        >
          <span v-if="submitting">Configurando...</span>
          <span v-else>Concluir configuração ✓</span>
        </button>
      </div>
    </div>
  </div>
</template>
