<script lang="ts" setup>
import { computed, ref, onMounted } from 'vue'
import { useFiscalApi, type FiscalDocument, type FiscalDocumentType, type FiscalDocumentStatus } from '../composables/useFiscalApi'
import { useProvidersApi, type FiscalProviderConfigResponse } from '@/bin/platform/providers/composables/useProvidersApi'

const { list, cancel } = useFiscalApi()
const { listFiscalProviders } = useProvidersApi()

const documents     = ref<FiscalDocument[]>([])
const loading       = ref(false)
const loadingLinks  = ref(false)
const page          = ref(0)
const totalPages    = ref(0)
const totalElements = ref(0)
const filterType    = ref<FiscalDocumentType | ''>('')
const filterStatus  = ref<FiscalDocumentStatus | ''>('')
const cancelTarget  = ref<FiscalDocument | null>(null)
const justificativa = ref('')
const cancelling    = ref(false)
const fiscalProviders = ref<FiscalProviderConfigResponse[]>([])

const activeFiscalProvider = computed(() =>
  fiscalProviders.value.find((provider) => provider.status === 'ACTIVE') ?? null
)

async function load() {
  loading.value = true
  try {
    const params: Record<string, unknown> = { page: page.value, size: 20 }
    if (filterType.value)   params.type   = filterType.value
    if (filterStatus.value) params.status = filterStatus.value
    const res = await list(params as any)
    documents.value     = res.data.content
    totalPages.value    = res.data.totalPages
    totalElements.value = res.data.totalElements
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function loadFiscalProviders() {
  loadingLinks.value = true
  try {
    const res = await listFiscalProviders()
    fiscalProviders.value = res.data
  } catch (e) {
    console.error(e)
  } finally {
    loadingLinks.value = false
  }
}

function requestCancel(doc: FiscalDocument) {
  cancelTarget.value  = doc
  justificativa.value = ''
}

async function confirmCancel() {
  if (!cancelTarget.value) return
  cancelling.value = true
  try {
    await cancel(cancelTarget.value.id, justificativa.value)
    cancelTarget.value = null
    await load()
  } catch (e) {
    console.error(e)
  } finally {
    cancelling.value = false
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

function typeLabel(type: FiscalDocumentType) {
  return { NF_E: 'NF-e', NF_CE: 'NF-Ce', CT_E: 'CT-e', NF_E_ENTRADA: 'Entrada' }[type] ?? type
}
function typeBadge(type: FiscalDocumentType) {
  return {
    NF_E:         'bg-info/10 text-info',
    NF_CE:        'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
    CT_E:         'bg-secondary/10 text-secondary',
    NF_E_ENTRADA: 'bg-warning/10 text-warning',
  }[type] ?? 'bg-slate-100 text-slate-600'
}
function statusLabel(status: FiscalDocumentStatus) {
  return { PENDING: 'Pendente', ISSUED: 'Emitida', FAILED: 'Falha', CANCELLED: 'Cancelada' }[status] ?? status
}
function statusBadge(status: FiscalDocumentStatus) {
  return {
    PENDING:   'bg-warning/10 text-warning',
    ISSUED:    'bg-success/10 text-success',
    FAILED:    'bg-error/10 text-error',
    CANCELLED: 'bg-slate-100 text-slate-500 dark:bg-navy-600 dark:text-navy-300',
  }[status] ?? 'bg-slate-100 text-slate-600'
}

function getFiscalProviderBaseUrl(provider: FiscalProviderConfigResponse | null) {
  if (!provider) return null

  switch (provider.provider.toLowerCase()) {
    case 'focusnfe':
      return provider.sandbox
        ? 'https://homologacao.focusnfe.com.br'
        : 'https://api.focusnfe.com.br'
    default:
      return null
  }
}

function resolveDocumentUrl(path?: string) {
  if (!path) return null
  if (/^https?:\/\//i.test(path)) return path

  const baseUrl = getFiscalProviderBaseUrl(activeFiscalProvider.value)
  if (!baseUrl) return path

  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`
}

onMounted(async () => {
  await Promise.all([load(), loadFiscalProviders()])
})
</script>

<template>
  <div class="space-y-5">

    <!-- Cabeçalho -->
    <div>
      <h2 class="text-xl font-semibold text-slate-700 dark:text-navy-100">Documentos Fiscais</h2>
      <p class="text-sm text-slate-400 dark:text-navy-400 mt-0.5">
        NF-e, NF-Ce, CT-e e entradas emitidos pelo sistema.
      </p>
    </div>

    <!-- Filtros -->
    <div class="flex flex-wrap gap-3">
      <select
        v-model="filterType"
        class="form-select rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:bg-navy-700 dark:hover:border-navy-400 dark:focus:border-accent"
      >
        <option value="">Todos os tipos</option>
        <option value="NF_E">NF-e</option>
        <option value="NF_CE">NF-Ce</option>
        <option value="CT_E">CT-e</option>
        <option value="NF_E_ENTRADA">NF-e Entrada</option>
      </select>

      <select
        v-model="filterStatus"
        class="form-select rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:bg-navy-700 dark:hover:border-navy-400 dark:focus:border-accent"
      >
        <option value="">Todos os status</option>
        <option value="PENDING">Pendente</option>
        <option value="ISSUED">Emitida</option>
        <option value="FAILED">Falha</option>
        <option value="CANCELLED">Cancelada</option>
      </select>

      <button @click="page = 0; load()" class="btn bg-primary font-medium text-white hover:bg-primary-focus text-sm">
        <em class="fa-light fa-magnifying-glass mr-1.5"></em>
        Filtrar
      </button>
    </div>

    <!-- Tabela -->
    <div class="card">
      <div class="is-scrollbar-hidden min-w-full overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="border-b border-slate-200 dark:border-navy-600">
              <th class="px-4 py-3 text-xs font-semibold uppercase text-slate-500 dark:text-navy-300">Tipo</th>
              <th class="px-4 py-3 text-xs font-semibold uppercase text-slate-500 dark:text-navy-300">Nº / Série</th>
              <th class="px-4 py-3 text-xs font-semibold uppercase text-slate-500 dark:text-navy-300">Chave NF-e</th>
              <th class="px-4 py-3 text-xs font-semibold uppercase text-slate-500 dark:text-navy-300">Status</th>
              <th class="px-4 py-3 text-xs font-semibold uppercase text-slate-500 dark:text-navy-300">Emitido em</th>
              <th class="px-4 py-3 text-xs font-semibold uppercase text-slate-500 dark:text-navy-300">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="6" class="px-4 py-10 text-center text-slate-400 dark:text-navy-400">
                <em class="fa-solid fa-spinner fa-spin text-xl"></em>
              </td>
            </tr>
            <tr v-else-if="documents.length === 0">
              <td colspan="6" class="px-4 py-10 text-center text-slate-400 dark:text-navy-400 text-sm">
                Nenhum documento encontrado.
              </td>
            </tr>
            <tr
              v-for="doc in documents"
              :key="doc.id"
              class="border-b border-slate-100 dark:border-navy-700 hover:bg-slate-50 dark:hover:bg-navy-700/50 transition-colors"
            >
              <td class="px-4 py-3">
                <span :class="typeBadge(doc.type)" class="badge text-xs font-medium">
                  {{ typeLabel(doc.type) }}
                </span>
              </td>
              <td class="px-4 py-3 text-sm text-slate-600 dark:text-navy-200">
                {{ doc.numero ? `${doc.numero}/${doc.serie}` : '—' }}
              </td>
              <td class="px-4 py-3 font-mono text-xs text-slate-400 dark:text-navy-400">
                {{ doc.chaveNfe ? doc.chaveNfe.slice(0, 22) + '…' : '—' }}
              </td>
              <td class="px-4 py-3">
                <span :class="statusBadge(doc.status)" class="badge text-xs font-medium">
                  {{ statusLabel(doc.status) }}
                </span>
              </td>
              <td class="px-4 py-3 text-sm text-slate-500 dark:text-navy-400">
                {{ doc.emittedAt ? formatDate(doc.emittedAt) : '—' }}
              </td>
              <td class="px-4 py-3">
                <div class="flex gap-2">
                  <a
                    v-if="doc.caminhoXml"
                    :href="resolveDocumentUrl(doc.caminhoXml) ?? undefined"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="btn btn-xs bg-info/10 text-info hover:bg-info/20 text-[10px]"
                  >XML</a>
                  <a
                    v-if="doc.caminhoDanfe"
                    :href="resolveDocumentUrl(doc.caminhoDanfe) ?? undefined"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="btn btn-xs bg-success/10 text-success hover:bg-success/20 text-[10px]"
                  >DANFE</a>
                  <button
                    v-if="doc.status === 'ISSUED'"
                    @click="requestCancel(doc)"
                    class="btn btn-xs bg-error/10 text-error hover:bg-error/20 text-[10px]"
                  >Cancelar</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Paginação -->
    <div v-if="totalPages > 1" class="flex items-center justify-between text-sm text-slate-500 dark:text-navy-400">
      <span>{{ totalElements }} documento(s)</span>
      <div class="flex gap-2">
        <button :disabled="page === 0" @click="page--; load()" class="btn btn-sm border border-slate-200 dark:border-navy-600 disabled:opacity-40">
          <em class="fa-light fa-chevron-left text-xs"></em>
        </button>
        <span class="px-2 py-1 text-xs">{{ page + 1 }} / {{ totalPages }}</span>
        <button :disabled="page >= totalPages - 1" @click="page++; load()" class="btn btn-sm border border-slate-200 dark:border-navy-600 disabled:opacity-40">
          <em class="fa-light fa-chevron-right text-xs"></em>
        </button>
      </div>
    </div>
  </div>

  <!-- Modal de cancelamento -->
  <div v-if="cancelTarget" class="fixed inset-0 z-[100] flex items-center justify-center">
    <div class="absolute inset-0 bg-slate-900/50" @click="cancelTarget = null" />
    <div class="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-navy-750">
      <h3 class="mb-1 text-base font-semibold text-slate-700 dark:text-navy-100">Cancelar documento</h3>
      <p class="mb-4 text-sm text-slate-400 dark:text-navy-400">
        Informe a justificativa de cancelamento (mínimo 15 caracteres):
      </p>
      <textarea
        v-model="justificativa"
        rows="3"
        class="form-textarea w-full resize-none rounded-lg border border-slate-300 bg-transparent p-2.5 placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:hover:border-navy-400 dark:focus:border-accent"
        placeholder="Justificativa..."
      />
      <div class="mt-4 flex justify-end gap-3">
        <button @click="cancelTarget = null; justificativa = ''" class="btn border border-slate-200 font-medium text-slate-600 dark:border-navy-600 dark:text-navy-200">
          Fechar
        </button>
        <button
          :disabled="justificativa.length < 15 || cancelling"
          @click="confirmCancel"
          class="btn bg-error font-medium text-white hover:bg-error-focus disabled:opacity-50"
        >
          <em v-if="cancelling" class="fa-solid fa-spinner fa-spin mr-1.5"></em>
          {{ cancelling ? 'Cancelando...' : 'Confirmar cancelamento' }}
        </button>
      </div>
    </div>
  </div>
</template>
