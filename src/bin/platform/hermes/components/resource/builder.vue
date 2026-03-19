<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCrud } from '../../composables/useCrud'
import { useFormMetadata } from '../../composables/useFormMetadata'
import type { FormSchema } from '../../types/form.d'
import { useI18n } from 'vue-i18n'
import { $axios } from '@/helpers/integration/integration'

const props = defineProps<{ resource: string }>()

const router = useRouter()

const { items, loading, pagination, fetchAll, remove, search } = useCrud<Record<string, any>>(
  props.resource
)

const {t} = useI18n()

const { fetchSchema, loading: loadingSchema } = useFormMetadata()

const schema = ref<FormSchema | null>(null)
const searchQuery = ref('')
const showDeleteModal = ref(false)
const itemToDelete = ref<Record<string, any> | null>(null)

// ========== ES Index Status (product only) ==========
interface IndexStatus {
  indexed: boolean
  synced: boolean
  dbUpdatedAt: string | null
  indexedAt: string | null
}
const indexStatus = ref<Record<string, IndexStatus>>({})
const loadingStatus = ref(false)
const reindexingAll = ref(false)
const reindexingId = ref<string | null>(null)

const isProductList = computed(() => props.resource === 'product')

const fetchIndexStatus = async () => {
  if (!isProductList.value || !items.value.length) return
  loadingStatus.value = true
  try {
    const ids = items.value.map((i) => i.id).filter(Boolean)
    const params = new URLSearchParams()
    ids.forEach((id) => params.append('ids', id))
    const res = await $axios.get(`/api/v1/admin/search/status?${params.toString()}`)
    indexStatus.value = res.data
  } catch {
    indexStatus.value = {}
  } finally {
    loadingStatus.value = false
  }
}

const reindexOne = async (productId: string) => {
  reindexingId.value = productId
  try {
    await $axios.post(`/api/v1/admin/search/index/${productId}`)
    await fetchIndexStatus()
  } finally {
    reindexingId.value = null
  }
}

const reindexAll = async () => {
  reindexingAll.value = true
  try {
    await $axios.post('/api/v1/admin/search/reindex')
    await fetchIndexStatus()
  } finally {
    reindexingAll.value = false
  }
}

const getStatusBadge = (id: string) => {
  if (loadingStatus.value) return 'loading'
  const s = indexStatus.value[id]
  if (!s) return 'unknown'
  if (!s.indexed) return 'not-indexed'
  if (!s.synced) return 'outdated'
  return 'synced'
}

// ========== UUID Utils ==========
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const isUUID = (value: unknown): value is string =>
  typeof value === 'string' && UUID_REGEX.test(value)

const shortUUID = (uuid: string) => `${uuid.slice(0, 6)}…${uuid.slice(-4)}`

const colorFromUUID = (uuid: string) => {
  let hash = 0
  for (let i = 0; i < uuid.length; i++) {
    hash = uuid.charCodeAt(i) + ((hash << 5) - hash)
  }
  return `hsl(${Math.abs(hash) % 360}, 65%, 45%)`
}

// ========== Boolean Utils ==========
const isBoolean = (value: unknown): value is boolean =>
  typeof value === 'boolean' || value === 'true' || value === 'false'

const toBoolean = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value
  if (value === 'true') return true
  if (value === 'false') return false
  return Boolean(value)
}

// Gera colunas para a tabela de listagem
// Prioridade 1: colunas explícitas do hermes-list.yml (via metadata.columns)
// Prioridade 2: auto-detecção a partir dos campos do schema (fallback)
const columns = computed(() => {
  if (!schema.value) return []

  if (schema.value.columns && schema.value.columns.length > 0) {
    return schema.value.columns.map((col) => ({
      key: col.field,
      label: col.label ?? `forms.${schema.value!.entityName}.${col.field}`,
      type: col.type ?? 'text'
    }))
  }

  // Fallback: auto-detecção
  return schema.value.fields
    .filter((f) => {
      return (
        f.span <= 6 && !['file', 'textarea', 'relation', 'dynamic', 'repeater'].includes(f.type)
      )
    })
    .slice(0, 6)
    .map((f) => ({
      key: f.code,
      label: f.label,
      type: f.type
    }))
})

// Título formatado
const entityTitle = computed(() => {
  return props.resource.charAt(0).toUpperCase() + props.resource.slice(1)
})

onMounted(async () => {
  try {
    schema.value = (await fetchSchema(props.resource)) as FormSchema
    await fetchAll()
    await fetchIndexStatus()
  } catch (e) {
    console.error('Erro ao carregar lista:', e)
  }
})

const handleCreate = () => {
  router.push({
    name: 'cockpit-form',
    params: { cockpit: props.resource }
  })
}

const handleEdit = (item: Record<string, any>) => {
  router.push({
    name: 'cockpit-form',
    params: {
      cockpit: props.resource,
      id: item.id
    }
  })
}

const confirmDelete = (item: Record<string, any>) => {
  itemToDelete.value = item
  showDeleteModal.value = true
}

const handleDelete = async () => {
  if (!itemToDelete.value) return

  try {
    await remove(itemToDelete.value.id)
    showDeleteModal.value = false
    itemToDelete.value = null
  } catch (e) {
    console.error('Erro ao excluir:', e)
  }
}

const cancelDelete = () => {
  showDeleteModal.value = false
  itemToDelete.value = null
}

const handleSearch = async () => {
  if (!searchQuery.value.trim()) {
    await fetchAll()
    return
  }

  // Busca em todos os campos de texto
  const searchParams: Record<string, string> = {}
  columns.value.forEach((col) => {
    if (col.type === 'text') {
      searchParams[col.key] = searchQuery.value
    }
  })

  await search(searchParams)
}

const changePage = async (newPage: number) => {
  pagination.value.page = newPage
  await fetchAll()
  await fetchIndexStatus()
}

const formatValue = (value: any, type: string) => {
  if (value === null || value === undefined) return '-'

  switch (type) {
    case 'number':
      return new Intl.NumberFormat('pt-BR').format(value)
    case 'options':
      return value
    default:
      return String(value)
  }
}

// Primeira letra do nome para avatar
const getInitials = (item: Record<string, any>) => {
  const firstCol = columns.value[0]
  if (!firstCol) return '?'

  const value = item[firstCol.key]
  if (!value) return '?'

  return String(value).charAt(0).toUpperCase()
}
</script>

<template>
  <div class="w-full">
    <!-- Header -->
    <div class="flex items-center justify-between py-5 lg:py-6">
      <div class="flex items-center space-x-1">
        <h2 class="text-xl font-medium text-slate-700 line-clamp-1 dark:text-navy-50">
          {{ entityTitle }}
        </h2>
        <div class="hidden h-full py-1 sm:flex">
          <div class="h-full w-px bg-slate-300 dark:bg-navy-600"></div>
        </div>
        <p class="hidden text-xs+ text-slate-400 dark:text-navy-300 sm:block">
          Gerencie seus registros de {{ resource }}
        </p>
      </div>

      <div class="flex items-center gap-2">
        <!-- Reindex all button (product only) -->
        <button
          v-if="isProductList"
          :disabled="reindexingAll"
          @click="reindexAll"
          class="btn h-9 space-x-1.5 rounded-lg border border-slate-300 px-3 text-xs font-medium text-slate-600 hover:border-primary hover:text-primary disabled:pointer-events-none disabled:opacity-50 dark:border-navy-450 dark:text-navy-200 dark:hover:border-accent dark:hover:text-accent"
          title="Re-indexar todos no Elasticsearch"
        >
          <svg
            :class="['h-4 w-4', reindexingAll && 'animate-spin']"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
          >
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>{{ reindexingAll ? 'Indexando...' : 'Reindexar tudo' }}</span>
        </button>

        <button
          @click="handleCreate"
          class="btn space-x-2 bg-primary font-medium text-white shadow-lg shadow-primary/50 hover:bg-primary-focus focus:bg-primary-focus active:bg-primary-focus/90 dark:bg-accent dark:shadow-accent/50 dark:hover:bg-accent-focus dark:focus:bg-accent-focus dark:active:bg-accent/90"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>Novo</span>
        </button>
      </div>
    </div>

    <!-- Search Bar -->
    <div class="flex items-center justify-between mb-5">
      <div class="flex flex-1 gap-2">
        <label class="relative flex-1 max-w-md">
          <input
            v-model="searchQuery"
            @keyup.enter="handleSearch"
            class="form-input peer h-9 w-full rounded-full bg-slate-150 px-4 pl-9 text-xs+ ring-primary/50 placeholder:text-slate-400 hover:bg-slate-200 focus:ring dark:bg-navy-900/90 dark:ring-accent/50 dark:placeholder:text-navy-300 dark:hover:bg-navy-900 dark:focus:bg-navy-900"
            placeholder="Buscar..."
            type="text"
          />
          <span
            class="top-0 pointer-events-none absolute flex h-full w-10 items-center justify-center text-slate-400 peer-focus:text-primary dark:text-navy-300 dark:peer-focus:text-accent"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4 transition-colors duration-200"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M3.316 13.781l.73-.171-.73.171zm0-5.457l.73.171-.73-.171zm15.473 0l.73-.171-.73.171zm0 5.457l.73.171-.73-.171zm-5.008 5.008l-.171-.73.171.73zm-5.457 0l-.171.73.171-.73zm0-15.473l-.171-.73.171.73zm5.457 0l.171-.73-.171.73zM20.47 21.53a.75.75 0 101.06-1.06l-1.06 1.06zM4.046 13.61a11.198 11.198 0 010-5.115l-1.46-.342a12.698 12.698 0 000 5.8l1.46-.343zm14.013-5.115a11.196 11.196 0 010 5.115l1.46.342a12.698 12.698 0 000-5.8l-1.46.343zm-4.45 9.564a11.196 11.196 0 01-5.114 0l-.342 1.46c1.907.448 3.892.448 5.8 0l-.343-1.46zM8.496 4.046a11.198 11.198 0 015.115 0l.342-1.46a12.698 12.698 0 00-5.8 0l.343 1.46zm0 14.013a5.97 5.97 0 01-4.45-4.45l-1.46.343a7.47 7.47 0 005.568 5.568l.342-1.46zm5.457 1.46a7.47 7.47 0 005.568-5.567l-1.46-.342a5.97 5.97 0 01-4.45 4.45l.342 1.46zM13.61 4.046a5.97 5.97 0 014.45 4.45l1.46-.343a7.47 7.47 0 00-5.568-5.567l-.342 1.46zm-5.457-1.46a7.47 7.47 0 00-5.567 5.567l1.46.342a5.97 5.97 0 014.45-4.45l-.343-1.46zm8.652 15.28l3.665 3.664 1.06-1.06-3.665-3.665-1.06 1.06z"
              />
            </svg>
          </span>
        </label>
        <button
          @click="handleSearch"
          class="btn h-9 rounded-full bg-primary font-medium text-white hover:bg-primary-focus focus:bg-primary-focus active:bg-primary-focus/90 dark:bg-accent dark:hover:bg-accent-focus dark:focus:bg-accent-focus dark:active:bg-accent/90"
        >
          Buscar
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading || loadingSchema" class="card p-8">
      <div class="flex flex-col items-center justify-center space-y-4">
        <div
          class="spinner h-10 w-10 animate-spin rounded-full border-[3px] border-primary border-r-transparent dark:border-accent dark:border-r-transparent"
        ></div>
        <p class="text-slate-500 dark:text-navy-300">Carregando...</p>
      </div>
    </div>

    <!-- Table Card -->
    <div v-else class="card">
      <!-- Empty State -->
      <div v-if="items.length === 0" class="text-center py-16">
        <div class="avatar h-16 w-16 mx-auto">
          <div
            class="is-initial rounded-full bg-slate-200 text-slate-500 dark:bg-navy-600 dark:text-navy-200"
          >
            <svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
          </div>
        </div>
        <h3 class="mt-4 text-lg font-medium text-slate-700 dark:text-navy-100">
          Nenhum registro encontrado
        </h3>
        <p class="mt-1 text-slate-400 dark:text-navy-300">Comece criando um novo registro.</p>
        <div class="mt-6">
          <button
            @click="handleCreate"
            class="btn space-x-2 bg-primary font-medium text-white hover:bg-primary-focus focus:bg-primary-focus active:bg-primary-focus/90 dark:bg-accent dark:hover:bg-accent-focus dark:focus:bg-accent-focus dark:active:bg-accent/90"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span>Novo {{ entityTitle }}</span>
          </button>
        </div>
      </div>

      <!-- Table Content -->
      <div v-else>
        <div class="is-scrollbar-hidden min-w-full overflow-x-auto">
          <table class="is-hoverable w-full text-left">
            <thead>
              <tr>
                <th
                  v-for="col in columns"
                  :key="col.key"
                  class="whitespace-nowrap bg-slate-200 px-4 py-3 font-semibold uppercase text-slate-800 dark:bg-navy-800 dark:text-navy-100 lg:px-5"
                >
                  {{ t(col.label) }}
                </th>
                <!-- ES status column (product only) -->
                <th
                  v-if="isProductList"
                  class="whitespace-nowrap bg-slate-200 px-4 py-3 font-semibold uppercase text-slate-800 dark:bg-navy-800 dark:text-navy-100 lg:px-5 text-center"
                >
                  Elasticsearch
                </th>
                <th
                  class="whitespace-nowrap bg-slate-200 px-4 py-3 font-semibold uppercase text-slate-800 dark:bg-navy-800 dark:text-navy-100 lg:px-5 text-right"
                >
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in items"
                :key="item.id"
                class="border-y border-transparent border-b-slate-200 dark:border-b-navy-500"
              >
                <td
                  v-for="(col, index) in columns"
                  :key="col.key"
                  class="whitespace-nowrap px-4 py-3 sm:px-5"
                >
                  <!-- Primeira coluna com avatar -->
                  <div v-if="index === 0" class="flex items-center space-x-4">
                    <div class="avatar h-9 w-9">
                      <div
                        class="is-initial rounded-full bg-primary/10 text-primary dark:bg-accent-light/10 dark:text-accent-light"
                      >
                        <span class="text-xs+ font-medium">
                          {{ getInitials(item) }}
                        </span>
                      </div>
                    </div>

                    <!-- UUID -->
                    <span
                      v-if="isUUID(item[col.key])"
                      class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-white shadow-sm cursor-default transition-all hover:scale-105"
                      :style="{ backgroundColor: colorFromUUID(item[col.key]) }"
                      :title="item[col.key]"
                    >
                      <svg
                        class="h-3 w-3 opacity-70"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
                        />
                      </svg>
                      {{ shortUUID(item[col.key]) }}
                    </span>

                    <!-- Boolean -->
                    <template v-else-if="isBoolean(item[col.key])">
                      <span
                        v-if="toBoolean(item[col.key])"
                        class="badge rounded-full bg-success/10 text-success dark:bg-success/15"
                      >
                        <span class="flex items-center gap-1">
                          <svg
                            class="h-3.5 w-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2.5"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Sim
                        </span>
                      </span>
                      <span
                        v-else
                        class="badge rounded-full bg-slate-100 text-slate-500 dark:bg-navy-500 dark:text-navy-200"
                      >
                        <span class="flex items-center gap-1">
                          <svg
                            class="h-3.5 w-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2.5"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                          Não
                        </span>
                      </span>
                    </template>

                    <!-- Default value -->
                    <span v-else class="text-slate-600 dark:text-navy-100">
                      {{ formatValue(item[col.key], col.type) }}
                    </span>
                  </div>

                  <!-- Outras colunas -->
                  <template v-else>
                    <!-- UUID -->
                    <span
                      v-if="isUUID(item[col.key])"
                      class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-white shadow-sm cursor-default transition-all hover:scale-105"
                      :style="{ backgroundColor: colorFromUUID(item[col.key]) }"
                      :title="item[col.key]"
                    >
                      <svg
                        class="h-3 w-3 opacity-70"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
                        />
                      </svg>
                      {{ shortUUID(item[col.key]) }}
                    </span>

                    <!-- Boolean -->
                    <template v-else-if="isBoolean(item[col.key])">
                      <span
                        v-if="toBoolean(item[col.key])"
                        class="badge rounded-full bg-success/10 text-success dark:bg-success/15"
                      >
                        <span class="flex items-center gap-1">
                          <svg
                            class="h-3.5 w-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2.5"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Sim
                        </span>
                      </span>
                      <span
                        v-else
                        class="badge rounded-full bg-slate-100 text-slate-500 dark:bg-navy-500 dark:text-navy-200"
                      >
                        <span class="flex items-center gap-1">
                          <svg
                            class="h-3.5 w-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2.5"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                          Não
                        </span>
                      </span>
                    </template>

                    <!-- Default value -->
                    <span v-else class="text-slate-600 dark:text-navy-100">
                      {{ formatValue(item[col.key], col.type) }}
                    </span>
                  </template>
                </td>
                <!-- ES Status cell (product only) -->
                <td v-if="isProductList" class="whitespace-nowrap px-4 py-3 sm:px-5 text-center">
                  <!-- Loading spinner -->
                  <div v-if="loadingStatus" class="flex justify-center">
                    <svg class="h-4 w-4 animate-spin text-slate-400 dark:text-navy-300"
                      fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10"
                        stroke="currentColor" stroke-width="4"/>
                      <path class="opacity-75" fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                  </div>

                  <template v-else>
                    <!-- Synced -->
                    <span
                      v-if="getStatusBadge(item.id) === 'synced'"
                      class="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success dark:bg-success/15"
                      :title="`Indexado em: ${indexStatus[item.id]?.indexedAt ?? ''}`"
                    >
                      <svg class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                      </svg>
                      Indexado
                    </span>

                    <!-- Outdated -->
                    <span
                      v-else-if="getStatusBadge(item.id) === 'outdated'"
                      class="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning dark:bg-warning/15"
                      :title="`DB: ${indexStatus[item.id]?.dbUpdatedAt} | ES: ${indexStatus[item.id]?.indexedAt}`"
                    >
                      <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                      </svg>
                      Desatualizado
                    </span>

                    <!-- Not indexed -->
                    <span
                      v-else-if="getStatusBadge(item.id) === 'not-indexed'"
                      class="inline-flex items-center gap-1 rounded-full bg-error/10 px-2 py-0.5 text-xs font-medium text-error dark:bg-error/15"
                    >
                      <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                      Não indexado
                    </span>

                    <!-- Unknown / ES off -->
                    <span
                      v-else
                      class="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-400 dark:bg-navy-600 dark:text-navy-300"
                    >
                      —
                    </span>
                  </template>
                </td>

                <td class="whitespace-nowrap px-4 py-3 sm:px-5 text-right">
                  <div class="flex items-center justify-end space-x-2">
                    <!-- Reindex single product -->
                    <button
                      v-if="isProductList && getStatusBadge(item.id) !== 'synced'"
                      :disabled="reindexingId === item.id"
                      @click="reindexOne(item.id)"
                      class="btn h-8 w-8 rounded-full p-0 text-slate-400 hover:bg-primary/10 hover:text-primary disabled:pointer-events-none disabled:opacity-40 dark:hover:bg-accent/10 dark:hover:text-accent"
                      :title="getStatusBadge(item.id) === 'not-indexed' ? 'Indexar no Elasticsearch' : 'Re-sincronizar com Elasticsearch'"
                    >
                      <svg
                        :class="['h-4 w-4', reindexingId === item.id && 'animate-spin']"
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
                      >
                        <path stroke-linecap="round" stroke-linejoin="round"
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>

                    <router-link
                      v-if="resource === 'product'"
                      :to="{ name: 'product-media', params: { productId: item.id } }"
                      class="btn h-8 w-8 rounded-full p-0 hover:bg-slate-300/20 focus:bg-slate-300/20 active:bg-slate-300/25 dark:hover:bg-navy-300/20 dark:focus:bg-navy-300/20 dark:active:bg-navy-300/25"
                      title="Mídias"
                    >
                      <svg class="h-5 w-5 text-slate-500 dark:text-navy-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                      </svg>
                    </router-link>
                    <button
                      @click="handleEdit(item)"
                      class="btn h-8 w-8 rounded-full p-0 hover:bg-slate-300/20 focus:bg-slate-300/20 active:bg-slate-300/25 dark:hover:bg-navy-300/20 dark:focus:bg-navy-300/20 dark:active:bg-navy-300/25"
                      title="Editar"
                    >
                      <svg
                        class="h-5 w-5 text-slate-500 dark:text-navy-200"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="1.5"
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      @click="confirmDelete(item)"
                      class="btn h-8 w-8 rounded-full p-0 hover:bg-slate-300/20 focus:bg-slate-300/20 active:bg-slate-300/25 dark:hover:bg-navy-300/20 dark:focus:bg-navy-300/20 dark:active:bg-navy-300/25"
                      title="Excluir"
                    >
                      <svg
                        class="h-5 w-5 text-error"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="1.5"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div
          class="flex flex-col justify-between space-y-4 px-4 py-4 sm:flex-row sm:items-center sm:space-y-0 sm:px-5"
        >
          <div class="text-xs+">
            <span class="text-slate-400 dark:text-navy-300">Mostrando</span>
            <span class="font-medium text-slate-700 dark:text-navy-100">
              {{ pagination.page * pagination.size + 1 }}</span
            >
            <span class="text-slate-400 dark:text-navy-300"> até </span>
            <span class="font-medium text-slate-700 dark:text-navy-100">{{
              Math.min((pagination.page + 1) * pagination.size, pagination.totalElements)
            }}</span>
            <span class="text-slate-400 dark:text-navy-300"> de </span>
            <span class="font-medium text-slate-700 dark:text-navy-100">{{
              pagination.totalElements
            }}</span>
            <span class="text-slate-400 dark:text-navy-300"> resultados</span>
          </div>

          <ol class="pagination">
            <li class="rounded-l-lg bg-slate-150 dark:bg-navy-500">
              <button
                @click="changePage(pagination.page - 1)"
                :disabled="pagination.page === 0"
                class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-300 focus:bg-slate-300 active:bg-slate-300/80 disabled:pointer-events-none disabled:opacity-50 dark:text-navy-200 dark:hover:bg-navy-450 dark:focus:bg-navy-450 dark:active:bg-navy-450/90"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            </li>

            <template v-for="page in pagination.totalPages" :key="page">
              <li
                v-if="page - 1 === pagination.page || Math.abs(page - 1 - pagination.page) <= 2"
                :class="
                  page - 1 === pagination.page
                    ? 'bg-primary dark:bg-accent'
                    : 'bg-slate-150 dark:bg-navy-500'
                "
              >
                <button
                  @click="changePage(page - 1)"
                  :class="[
                    'flex h-8 min-w-[2rem] items-center justify-center rounded-lg px-3 leading-tight transition-colors',
                    page - 1 === pagination.page
                      ? 'font-medium text-white'
                      : 'text-slate-500 hover:bg-slate-300 focus:bg-slate-300 active:bg-slate-300/80 dark:text-navy-200 dark:hover:bg-navy-450 dark:focus:bg-navy-450 dark:active:bg-navy-450/90'
                  ]"
                >
                  {{ page }}
                </button>
              </li>
            </template>

            <li class="rounded-r-lg bg-slate-150 dark:bg-navy-500">
              <button
                @click="changePage(pagination.page + 1)"
                :disabled="pagination.page >= pagination.totalPages - 1"
                class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-300 focus:bg-slate-300 active:bg-slate-300/80 disabled:pointer-events-none disabled:opacity-50 dark:text-navy-200 dark:hover:bg-navy-450 dark:focus:bg-navy-450 dark:active:bg-navy-450/90"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </li>
          </ol>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <teleport to="body">
      <div
        v-if="showDeleteModal"
        class="fixed inset-0 z-[100] flex flex-wrap items-center justify-center overflow-auto p-4 sm:p-5"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-slate-900/60 backdrop-blur transition-opacity duration-300"
          @click="cancelDelete"
        ></div>

        <!-- Modal -->
        <div
          class="relative w-full max-w-lg rounded-lg bg-white p-4 text-center dark:bg-navy-700 sm:p-5"
        >
          <div
            class="mt-4 flex h-14 w-14 items-center justify-center rounded-full bg-error/10 mx-auto"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-7 w-7 text-error"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <div class="mt-4">
            <h2 class="text-lg text-slate-700 dark:text-navy-100">Confirmar exclusão</h2>
            <p class="mt-2 text-slate-400 dark:text-navy-300">
              Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.
            </p>
          </div>

          <div class="mt-6 space-x-2">
            <button
              @click="cancelDelete"
              class="btn min-w-[7rem] rounded-full border border-slate-300 font-medium text-slate-800 hover:bg-slate-150 focus:bg-slate-150 active:bg-slate-150/80 dark:border-navy-450 dark:text-navy-50 dark:hover:bg-navy-500 dark:focus:bg-navy-500 dark:active:bg-navy-500/90"
            >
              Cancelar
            </button>
            <button
              @click="handleDelete"
              class="btn min-w-[7rem] rounded-full bg-error font-medium text-white hover:bg-error-focus focus:bg-error-focus active:bg-error-focus/90"
            >
              Excluir
            </button>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<style scoped>
.badge {
  @apply inline-flex items-center px-2.5 py-0.5 text-xs font-medium;
}

.pagination {
  display: flex;
}

.pagination li:not(:first-child):not(:last-child) {
  margin: 0;
}
</style>
