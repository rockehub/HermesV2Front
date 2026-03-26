<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { $axios } from '@/helpers/integration/integration'
import { usePosApi, type PosCustomerRequest } from '../../composables/usePosApi'
import { usePosStore, type PosCustomer } from '../../store/usePosStore'
import { validateIE } from '../../composables/ieValidator'

const api = usePosApi()
const posStore = usePosStore()

const query = ref('')
const results = ref<any[]>([])
const searching = ref(false)
const showNewForm = ref(false)
const saving = ref(false)
const cnpjLookupLoading = ref(false)
const cnpjLookupError = ref<string | null>(null)
const cnpjLookupResult = ref<any | null>(null)
const cnpjUf = ref<string | null>(null)

const newCustomer = ref<PosCustomerRequest>({
  name: '',
  surname: null,
  email: '',
  document: null,
  phone: null,
  companyName: null,
  inscricaoEstadual: null,
  indIEDest: 9
})

// Detect if document is CNPJ (14 digits) or CPF (11 digits)
const isCnpj = computed(() => {
  const d = (newCustomer.value.document ?? '').replace(/\D/g, '')
  return d.length === 14
})

const isCpf = computed(() => {
  const d = (newCustomer.value.document ?? '').replace(/\D/g, '')
  return d.length === 11
})

const indIEDestOptions = [
  { value: 1, label: 'Contribuinte ICMS (tem IE)' },
  { value: 2, label: 'Contribuinte isento' },
  { value: 9, label: 'Não contribuinte' }
]

const ieRequired = computed(() => newCustomer.value.indIEDest === 1)

const ieValidation = computed(() => {
  const ie = newCustomer.value.inscricaoEstadual?.trim()
  if (!ie) return null
  if (!cnpjUf.value) return null // sem UF do lookup ainda não valida
  return validateIE(cnpjUf.value, ie)
})

const ieValid   = computed(() => ieValidation.value?.valid ?? null)
const ieInvalid = computed(() => ieValidation.value !== null && !ieValidation.value.valid)
const canSave = computed(() => {
  if (!newCustomer.value.name) return false
  if (ieRequired.value && !newCustomer.value.inscricaoEstadual?.trim()) return false
  if (ieInvalid.value) return false
  return true
})

// Auto-lookup CNPJ when 14 digits are entered
const doCnpjLookup = useDebounceFn(async () => {
  const digits = (newCustomer.value.document ?? '').replace(/\D/g, '')
  if (digits.length !== 14) return

  cnpjLookupLoading.value = true
  cnpjLookupError.value = null
  try {
    const res = await $axios.get(`/api/v1/admin/pos/cnpj/${digits}`)
    const data = res.data?.data
    if (data) {
      cnpjLookupResult.value = data
      cnpjUf.value = data.uf ?? null
      newCustomer.value.name = data.razaoSocial ?? newCustomer.value.name
      newCustomer.value.companyName = data.nomeFantasia ?? data.razaoSocial
      newCustomer.value.indIEDest = data.indIEDest ?? 9
      if (!newCustomer.value.email && data.email) newCustomer.value.email = data.email
      if (!newCustomer.value.phone && data.telefone) newCustomer.value.phone = data.telefone
    }
  } catch (e: any) {
    cnpjLookupError.value = e?.response?.data?.message ?? 'CNPJ não encontrado'
  } finally {
    cnpjLookupLoading.value = false
  }
}, 600)

function onDocumentInput() {
  cnpjLookupError.value = null
  cnpjLookupResult.value = null
  cnpjUf.value = null
  doCnpjLookup()
}

const doSearch = useDebounceFn(async () => {
  if (!query.value.trim() || query.value.length < 2) {
    results.value = []
    return
  }
  searching.value = true
  try {
    const res = await api.searchCustomers(query.value)
    results.value = res.data.data ?? []
  } finally {
    searching.value = false
  }
}, 350)

async function selectCustomer(c: any) {
  const mapped: PosCustomer = {
    id: c.id,
    name: c.name,
    surname: c.surname,
    email: c.email,
    document: c.document,
    phone: c.phone
  }
  await posStore.setCustomer(mapped)
  query.value = ''
  results.value = []
}

function clearCustomer() {
  posStore.customer = null
}

async function saveNewCustomer() {
  if (!canSave.value) return
  saving.value = true
  try {
    const res = await api.createCustomer(newCustomer.value)
    await selectCustomer(res.data.data)
    showNewForm.value = false
    newCustomer.value = {
      name: '', surname: null, email: '', document: null,
      phone: null, companyName: null, inscricaoEstadual: null, indIEDest: 9
    }
  } finally {
    saving.value = false
  }
}

function formatDocument(doc: string | null | undefined) {
  if (!doc) return ''
  const d = doc.replace(/\D/g, '')
  if (d.length === 14) return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  if (d.length === 11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  return doc
}
</script>

<template>
  <div class="flex h-full flex-col bg-white dark:bg-navy-750 rounded-lg overflow-hidden">
    <div class="border-b border-slate-100 dark:border-navy-700 px-4 py-3">
      <h3 class="text-sm font-semibold text-slate-700 dark:text-navy-100">
        <em class="fa-light fa-user mr-2 text-primary"></em>
        Cliente
      </h3>
    </div>

    <div class="flex-1 overflow-y-auto p-4 space-y-3 is-scrollbar-hidden">

      <!-- Selected customer card -->
      <div
        v-if="posStore.customer"
        class="flex items-center gap-3 rounded-lg bg-primary/5 border border-primary/20 px-3 py-2.5"
      >
        <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
          {{ posStore.customer.name.charAt(0).toUpperCase() }}
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-slate-700 dark:text-navy-100 truncate">
            {{ posStore.customer.name }} {{ posStore.customer.surname }}
          </p>
          <p class="text-xs text-slate-400 truncate">{{ posStore.customer.email }}</p>
          <p v-if="posStore.customer.document" class="text-xs text-slate-400">
            {{ formatDocument(posStore.customer.document) }}
          </p>
        </div>
        <button class="shrink-0 text-slate-300 hover:text-error transition-colors" @click="clearCustomer">
          <em class="fa-light fa-times text-sm"></em>
        </button>
      </div>

      <!-- Search -->
      <div v-if="!posStore.customer">
        <div class="relative">
          <em class="fa-light fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none"></em>
          <input
            v-model="query"
            type="text"
            placeholder="Buscar por nome, e-mail, CPF, CNPJ..."
            class="form-input w-full rounded-lg border border-slate-200 dark:border-navy-600 bg-white dark:bg-navy-700 py-2 pl-9 pr-4 text-xs text-slate-700 dark:text-navy-100 placeholder:text-slate-400 focus:border-primary focus:outline-none"
            @input="doSearch"
          />
          <em v-if="searching" class="fa-duotone fa-spinner-third fa-spin absolute right-3 top-1/2 -translate-y-1/2 text-primary text-xs"></em>
        </div>

        <div v-if="results.length" class="mt-2 rounded-lg border border-slate-100 dark:border-navy-700 overflow-hidden">
          <button
            v-for="c in results"
            :key="c.id"
            class="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-navy-700 border-b border-slate-50 dark:border-navy-700 last:border-0 transition-colors"
            @click="selectCustomer(c)"
          >
            <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-navy-600 text-xs font-semibold text-slate-500">
              {{ c.name?.charAt(0)?.toUpperCase() }}
            </div>
            <div class="min-w-0">
              <p class="text-xs font-medium text-slate-700 dark:text-navy-100 truncate">{{ c.name }} {{ c.surname }}</p>
              <p class="text-[10px] text-slate-400 truncate">{{ c.email }} · {{ formatDocument(c.document) }}</p>
            </div>
          </button>
        </div>
      </div>

      <!-- New customer toggle -->
      <button
        v-if="!posStore.customer && !showNewForm"
        class="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-200 dark:border-navy-600 py-2.5 text-xs text-slate-400 hover:border-primary/50 hover:text-primary transition-colors"
        @click="showNewForm = true"
      >
        <em class="fa-light fa-user-plus"></em>
        Novo cliente
      </button>

      <!-- New customer form -->
      <div v-if="showNewForm && !posStore.customer" class="rounded-lg border border-slate-200 dark:border-navy-600 p-3 space-y-2.5">
        <p class="text-xs font-semibold text-slate-600 dark:text-navy-200">Cadastro rápido</p>

        <!-- CPF / CNPJ with auto-lookup -->
        <div class="relative">
          <input
            v-model="newCustomer.document"
            type="text"
            placeholder="CPF ou CNPJ *"
            maxlength="18"
            class="form-input w-full rounded-lg border px-3 py-1.5 text-xs"
            :class="cnpjLookupError ? 'border-error' : 'border-slate-200 dark:border-navy-600 bg-white dark:bg-navy-700'"
            @input="onDocumentInput"
          />
          <em
            v-if="cnpjLookupLoading"
            class="fa-duotone fa-spinner-third fa-spin absolute right-3 top-1/2 -translate-y-1/2 text-primary text-xs"
          ></em>
          <em
            v-else-if="isCnpj && !cnpjLookupError"
            class="fa-light fa-circle-check absolute right-3 top-1/2 -translate-y-1/2 text-success text-xs"
          ></em>
        </div>
        <p v-if="cnpjLookupError" class="text-[10px] text-error -mt-1">{{ cnpjLookupError }}</p>

        <!-- CNPJ: Razão social + nome fantasia -->
        <template v-if="isCnpj">
          <input
            v-model="newCustomer.name"
            type="text"
            placeholder="Razão Social *"
            class="form-input w-full rounded-lg border border-slate-200 dark:border-navy-600 bg-white dark:bg-navy-700 px-3 py-1.5 text-xs"
          />
          <input
            v-model="newCustomer.companyName"
            type="text"
            placeholder="Nome Fantasia"
            class="form-input w-full rounded-lg border border-slate-200 dark:border-navy-600 bg-white dark:bg-navy-700 px-3 py-1.5 text-xs"
          />

          <!-- CNAE IE classification banner -->
          <div
            v-if="cnpjLookupResult"
            class="flex items-start gap-2 rounded-lg px-3 py-2 text-[11px]"
            :class="{
              'bg-amber-50 border border-amber-200 text-amber-700': cnpjLookupResult.ieConfianca === 'alta' && cnpjLookupResult.ieRequired,
              'bg-slate-50 border border-slate-200 text-slate-500 dark:bg-navy-700 dark:border-navy-600': cnpjLookupResult.ieConfianca !== 'alta' || !cnpjLookupResult.ieRequired,
            }"
          >
            <em
              class="mt-0.5 shrink-0 text-xs"
              :class="{
                'fa-light fa-triangle-exclamation text-amber-500': cnpjLookupResult.ieRequired,
                'fa-light fa-circle-info text-slate-400': !cnpjLookupResult.ieRequired
              }"
            ></em>
            <div>
              <p class="font-medium">
                {{ cnpjLookupResult.ieRequired ? 'IE provavelmente exigida' : 'IE geralmente não exigida' }}
                <span class="ml-1 rounded px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide"
                  :class="{
                    'bg-amber-100 text-amber-600': cnpjLookupResult.ieConfianca === 'alta',
                    'bg-blue-100 text-blue-600': cnpjLookupResult.ieConfianca === 'media',
                    'bg-slate-200 text-slate-500': cnpjLookupResult.ieConfianca === 'baixa'
                  }"
                >
                  confiança {{ cnpjLookupResult.ieConfianca }}
                </span>
              </p>
              <p class="mt-0.5 opacity-80">CNAE {{ cnpjLookupResult.cnae }} — {{ cnpjLookupResult.ieJustificativa }}</p>
            </div>
          </div>

          <!-- Tipo contribuinte -->
          <div>
            <label class="mb-1 block text-[10px] font-medium text-slate-500 dark:text-navy-400">
              Situação fiscal (indIEDest)
            </label>
            <div class="grid grid-cols-1 gap-1">
              <button
                v-for="opt in indIEDestOptions"
                :key="opt.value"
                type="button"
                class="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[11px] text-left transition-all"
                :class="newCustomer.indIEDest === opt.value
                  ? 'border-primary bg-primary/5 text-primary font-medium'
                  : 'border-slate-200 dark:border-navy-600 text-slate-600 dark:text-navy-300 hover:border-primary/40'"
                @click="newCustomer.indIEDest = opt.value"
              >
                <em
                  class="fa-solid fa-circle text-[6px]"
                  :class="newCustomer.indIEDest === opt.value ? 'text-primary' : 'text-slate-300'"
                ></em>
                {{ opt.label }}
              </button>
            </div>
          </div>

          <!-- IE — obrigatória se contribuinte -->
          <div>
            <label class="mb-1 block text-[10px] font-medium text-slate-500 dark:text-navy-400">
              Inscrição Estadual
              <span v-if="ieRequired" class="text-error ml-1">*</span>
              <span v-else class="text-slate-400 ml-1">(opcional para não contribuinte)</span>
            </label>
            <div class="relative">
              <input
                v-model="newCustomer.inscricaoEstadual"
                type="text"
                placeholder="Ex: 123456789"
                class="form-input w-full rounded-lg border px-3 py-1.5 pr-8 text-xs"
                :class="ieInvalid
                  ? 'border-error bg-error/5'
                  : (ieRequired && !newCustomer.inscricaoEstadual?.trim()
                    ? 'border-error bg-error/5'
                    : 'border-slate-200 dark:border-navy-600 bg-white dark:bg-navy-700')"
              />
              <em v-if="ieValid === true"
                class="fa-light fa-circle-check absolute right-2.5 top-1/2 -translate-y-1/2 text-success text-xs pointer-events-none"
              ></em>
              <em v-else-if="ieInvalid"
                class="fa-light fa-circle-xmark absolute right-2.5 top-1/2 -translate-y-1/2 text-error text-xs pointer-events-none"
              ></em>
            </div>
            <p v-if="ieInvalid" class="mt-0.5 text-[10px] text-error">
              {{ ieValidation?.message }}
            </p>
            <p v-else-if="ieRequired && !newCustomer.inscricaoEstadual?.trim()" class="mt-0.5 text-[10px] text-error">
              IE obrigatória para contribuinte ICMS
            </p>
            <p v-else-if="!cnpjUf && newCustomer.inscricaoEstadual?.trim()" class="mt-0.5 text-[10px] text-slate-400">
              Informe o CNPJ primeiro para validar a IE do estado
            </p>
          </div>
        </template>

        <!-- CPF: only name fields -->
        <template v-else>
          <div class="grid grid-cols-2 gap-2">
            <input v-model="newCustomer.name" type="text" placeholder="Nome *" class="form-input rounded-lg border border-slate-200 dark:border-navy-600 bg-white dark:bg-navy-700 px-3 py-1.5 text-xs" />
            <input v-model="newCustomer.surname" type="text" placeholder="Sobrenome" class="form-input rounded-lg border border-slate-200 dark:border-navy-600 bg-white dark:bg-navy-700 px-3 py-1.5 text-xs" />
          </div>
        </template>

        <!-- Email + phone (always) -->
        <input
          v-model="newCustomer.email"
          type="email"
          placeholder="E-mail *"
          class="form-input w-full rounded-lg border border-slate-200 dark:border-navy-600 bg-white dark:bg-navy-700 px-3 py-1.5 text-xs"
        />
        <input
          v-model="newCustomer.phone"
          type="text"
          placeholder="Telefone"
          class="form-input w-full rounded-lg border border-slate-200 dark:border-navy-600 bg-white dark:bg-navy-700 px-3 py-1.5 text-xs"
        />

        <!-- Validation hint for CNPJ contribuinte -->
        <div v-if="isCnpj && newCustomer.indIEDest === 1 && newCustomer.inscricaoEstadual" class="flex items-center gap-1.5 rounded-lg bg-success/5 border border-success/20 px-3 py-2">
          <em class="fa-light fa-shield-check text-success text-xs"></em>
          <p class="text-[10px] text-success">Contribuinte ICMS com IE — apto para NF-e</p>
        </div>

        <div class="flex gap-2 pt-1">
          <button
            class="flex-1 rounded-lg bg-primary py-1.5 text-xs font-medium text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
            :disabled="saving || !canSave"
            @click="saveNewCustomer"
          >
            <em v-if="saving" class="fa-duotone fa-spinner-third fa-spin mr-1"></em>
            Salvar
          </button>
          <button
            class="flex-1 rounded-lg border border-slate-200 dark:border-navy-600 py-1.5 text-xs text-slate-500 hover:bg-slate-50 dark:hover:bg-navy-700 transition-colors"
            @click="showNewForm = false"
          >
            Cancelar
          </button>
        </div>
      </div>

      <p v-if="!posStore.customer && !showNewForm" class="text-center text-[10px] text-slate-400">
        Venda sem cliente vinculado
      </p>
    </div>
  </div>
</template>
