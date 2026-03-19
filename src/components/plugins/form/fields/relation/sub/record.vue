<script lang="ts" setup>
import type { BaseFieldProps, RelationFieldSchema } from '@/classes/form/schemas'
import { DynamicMethodsUtils } from '@/classes/form/DynamicMethodsUtils'
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { RegisteredField } from '@/classes/form/FieldRegistry'

const props = defineProps<BaseFieldProps<RegisteredField<'relation'>>>()
const emit = defineEmits(['update:modelValue'])
const { t } = useI18n()

type RowId = string | number
type TableRow = Record<string, unknown> & { id?: RowId; name?: string; email?: string }
type SortOrder = 'asc' | 'desc' | null

const value = ref('')
const searchResults = ref<TableRow[]>([])
const selectedItem = ref<TableRow | null>(null)
const loading = ref(false)
const saving = ref(false)
const modal = ref()
const searchQuery = ref('')

// Ordenação
const sortField = ref<string | null>(null)
const sortOrder = ref<SortOrder>(null)

// Paginação
const currentPage = ref(1)
const pageSize = ref(10)
const pageSizeOptions = [10, 30, 50]

// UUID Utils
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

// Boolean Utils
const isBoolean = (value: unknown): value is boolean =>
  typeof value === 'boolean' || value === 'true' || value === 'false'

const toBoolean = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value
  if (value === 'true') return true
  if (value === 'false') return false
  return Boolean(value)
}

// Função para carregar a lista de registros para a tabela do modal
const loadRecordsList = () => {
  loading.value = true

  DynamicMethodsUtils.invoke(
    props.schema,
    'Entity',
    'list',
    'Items',
    props.params?.config.code,
    true
  )
    .then((response: any) => {
      searchResults.value = response
    })
    .catch((error) => {
      console.error(error)
      searchResults.value = []
    })
    .finally(() => {
      loading.value = false
    })
}

// Função para carregar o registro atual selecionado
const loadCurrentRecord = () => {
  if (!props.initialValues.id) {
    loading.value = false
    return
  }

  loading.value = true

  DynamicMethodsUtils.invoke(
    props.schema,
    'Entity',
    'find',
    'Record',
    [props.initialValues.id, props.params?.config.code],
    true
  )
    .then((response: any) => {
      if (response) {
        selectItem(response)
      }
    })
    .catch((error) => {
      console.error(error)
    })
    .finally(() => {
      loading.value = false
    })
}

onMounted(() => {
  loadCurrentRecord()
  loadRecordsList()
})

const cols = computed(() => {
  const data = searchResults.value
  if (!data.length) return []

  const firstRow = data[0]

  const configured = props.params?.config?.recordTableField as string[] | undefined

  const configuredKeys = Array.isArray(configured)
    ? configured.filter((k) => k in firstRow && !k.startsWith('_'))
    : []

  let keys: string[]

  if (configuredKeys.length > 0) {
    // Se tem campos configurados, usa eles (limitado a 3)
    keys = configuredKeys.slice(0, 3)
  } else {
    // Campos prioritários na ordem de prioridade
    const priorityFields = ['id', 'name', 'email', 'description']
    const availableFields = Object.keys(firstRow).filter((k) => !k.startsWith('_'))

    // Pega os campos prioritários que existem na ordem de prioridade
    const selectedPriority = priorityFields.filter((field) => availableFields.includes(field))

    // Se ainda não temos 3 campos, completa com outros campos disponíveis
    if (selectedPriority.length < 3) {
      const remainingFields = availableFields.filter((field) => !priorityFields.includes(field))
      keys = [...selectedPriority, ...remainingFields].slice(0, 3)
    } else {
      // Limita aos 3 primeiros campos prioritários encontrados
      keys = selectedPriority.slice(0, 3)
    }
  }

  return keys.map((field) => ({
    field,
    title: t(`forms.field.${props.params?.config?.code ?? 'default'}.${field}`),
    sortable: true
  }))
})

// Dados filtrados por busca
const filteredData = computed(() => {
  const data = Array.isArray(searchResults.value) ? searchResults.value : []

  if (!searchQuery.value.trim()) return data

  const query = searchQuery.value.toLowerCase()

  return data.filter((row) =>
    Object.values(row).some(
      (value) =>
        value !== null && value !== undefined && String(value).toLowerCase().includes(query)
    )
  )
})

// Dados ordenados
const sortedData = computed(() => {
  if (!sortField.value || !sortOrder.value) return filteredData.value

  return [...filteredData.value].sort((a, b) => {
    const aVal = a[sortField.value!]
    const bVal = b[sortField.value!]

    if (aVal === bVal) return 0
    if (aVal === null || aVal === undefined) return 1
    if (bVal === null || bVal === undefined) return -1

    const comparison = aVal < bVal ? -1 : 1
    return sortOrder.value === 'asc' ? comparison : -comparison
  })
})

// Dados paginados
const paginatedData = computed(() => {
  const data = Array.isArray(sortedData.value) ? sortedData.value : []

  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value

  return data.slice(start, end)
})

// Informações de paginação
const totalRows = computed(() => filteredData.value.length)
const totalPages = computed(() => Math.ceil(totalRows.value / pageSize.value))
const startRow = computed(() =>
  totalRows.value === 0 ? 0 : (currentPage.value - 1) * pageSize.value + 1
)
const endRow = computed(() => Math.min(currentPage.value * pageSize.value, totalRows.value))

// Páginas visíveis na paginação
const visiblePages = computed(() => {
  const pages: number[] = []
  const maxVisible = 5
  let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2))
  let end = Math.min(totalPages.value, start + maxVisible - 1)

  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1)
  }

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
})

// Ordenação
const handleSort = (field: string) => {
  const col = cols.value.find((c) => c.field === field)
  if (!col?.sortable) return

  if (sortField.value === field) {
    if (sortOrder.value === 'asc') {
      sortOrder.value = 'desc'
    } else if (sortOrder.value === 'desc') {
      sortField.value = null
      sortOrder.value = null
    } else {
      sortOrder.value = 'asc'
    }
  } else {
    sortField.value = field
    sortOrder.value = 'asc'
  }
}

const getSortIcon = (field: string) => {
  if (sortField.value !== field) return null
  return sortOrder.value
}

// Paginação
const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

const prevPage = () => goToPage(currentPage.value - 1)
const nextPage = () => goToPage(currentPage.value + 1)

// Reset página quando muda busca ou pageSize
watch([searchQuery, pageSize], () => {
  currentPage.value = 1
})

// Selecionar um item da tabela
const selectItem = (item: TableRow) => {
  selectedItem.value = item
  value.value = item.name ?? String(item.id ?? '')
  emit('update:modelValue', item.id)
}

// Limpar seleção
const clearSelection = async () => {
  // Se estiver editando, remove a associação no backend
  if (props.initialValues.id && selectedItem.value) {
    saving.value = true
    try {
      await DynamicMethodsUtils.invoke(
        props.schema,
        'To',
        'clear',
        'One',
        [props.initialValues.id, props.params?.config.code],
        true
      )
    } catch (error) {
      console.error('Erro ao limpar relação:', error)
    } finally {
      saving.value = false
    }
  }

  selectedItem.value = null
  value.value = ''
  emit('update:modelValue', null)
}

// Confirmar seleção e salvar (To-One apenas)
const selectData = async () => {
  if (!selectedItem.value) {
    return
  }

  // Se for edição (tem ID da entidade), associa a relação automaticamente
  if (props.initialValues.id) {
    saving.value = true

    try {
      await DynamicMethodsUtils.invoke(
        props.schema,
        'To',
        'associate',
        'One',
        [props.initialValues.id, props.params?.config.code, selectedItem.value.id],
        true
      )

      modal.value?.closeModal()
    } catch (error) {
      console.error('Erro ao associar relação:', error)
      // Rollback da seleção em caso de erro
      clearSelection()
      // Recarrega o registro atual
      loadCurrentRecord()
    } finally {
      saving.value = false
    }
  } else {
    // Modo criação: apenas fecha o modal, a relação será salva junto com o entity
    modal.value?.closeModal()
  }
}

const isHtmlCol = (field: string) => field.includes('html')
const isSwitchCol = (field: string) => field.includes('switch')
const isCurrencyCol = (field: string) => field.includes('currency_data')
</script>

<template>
  <div class="relative w-full">
    <!-- Campo de Entrada -->
    <div v-if="!loading" class="flex items-center">
      <input
        v-model="value"
        :placeholder="t('form.commons.search')"
        :readonly="true"
        :disabled="saving"
        class="form-input w-full cursor-pointer rounded-lg border border-slate-300 bg-transparent px-3 py-2 placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:hover:border-navy-400 dark:focus:border-accent disabled:cursor-not-allowed disabled:opacity-60"
        type="text"
        @click="!saving && modal.openModal()"
      />

      <!-- Loading indicator durante salvamento -->
      <div v-if="saving" class="ml-2">
        <svg
          class="h-5 w-5 animate-spin text-primary dark:text-accent"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          ></circle>
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      </div>

      <button
        v-else-if="selectedItem"
        class="btn ml-2 h-8 w-8 shrink-0 rounded-full p-0 text-slate-400 hover:bg-error/10 hover:text-error focus:bg-error/10 dark:text-navy-300 dark:hover:bg-error/20 dark:hover:text-error"
        @click="clearSelection"
      >
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
    <div v-else>
      <div class="w-full h-10 animate-pulse rounded-lg bg-slate-150 dark:bg-navy-500"></div>
    </div>

    <!-- Modal com Tabela -->
    <modal-modal-base ref="modal" :confirm-callback="selectData" :size="'2xl'" :no-button="true">
      <template #content>
        <!-- Search Bar -->
        <div class="mb-4 flex items-center">
          <input
            v-model="searchQuery"
            class="form-input w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:hover:border-navy-400 dark:focus:border-accent"
            :placeholder="t('form.commons.search')"
            type="text"
          />
        </div>

        <!-- Data Table -->
        <div class="is-scrollbar-hidden min-w-full overflow-x-auto">
          <table class="is-hoverable w-full text-left">
            <thead>
              <tr>
                <th
                  v-for="(col, index) in cols"
                  :key="col.field"
                  :class="[
                    'whitespace-nowrap bg-slate-200 px-4 py-3 font-semibold uppercase text-slate-800 dark:bg-navy-800 dark:text-navy-100 lg:px-5',
                    index === 0 && 'rounded-tl-lg',
                    index === cols.length - 1 && 'rounded-tr-lg',
                    col.sortable &&
                      'cursor-pointer select-none hover:bg-slate-300 dark:hover:bg-navy-700'
                  ]"
                  @click="handleSort(col.field)"
                >
                  <div class="flex items-center space-x-1">
                    <span>{{ col.title }}</span>
                    <template v-if="col.sortable">
                      <svg
                        v-if="getSortIcon(col.field) === 'asc'"
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M5 15l7-7 7 7"
                        />
                      </svg>
                      <svg
                        v-else-if="getSortIcon(col.field) === 'desc'"
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                      <svg
                        v-else
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-4 w-4 opacity-30"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                        />
                      </svg>
                    </template>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in paginatedData"
                :key="row.id"
                class="border-y border-transparent border-b-slate-200 dark:border-b-navy-500 cursor-pointer hover:bg-slate-100 dark:hover:bg-navy-600"
                :class="{ 'bg-primary/10 dark:bg-accent/10': selectedItem?.id === row.id }"
                @click="selectItem(row)"
              >
                <td
                  v-for="col in cols"
                  :key="col.field"
                  class="whitespace-nowrap px-4 py-3 sm:px-5"
                >
                  <!-- HTML Column -->
                  <template v-if="isHtmlCol(col.field)">
                    <span
                      class="text-slate-600 dark:text-navy-200"
                      v-html="String(row[col.field] ?? '')"
                    ></span>
                  </template>

                  <!-- Switch/Boolean Column (explicit) -->
                  <template v-else-if="isSwitchCol(col.field)">
                    <div class="flex justify-center">
                      <div
                        v-if="toBoolean(row[col.field])"
                        class="flex h-7 w-7 items-center justify-center rounded-full bg-success/15 text-success"
                      >
                        <icon-circle-check class="h-5 w-5" />
                      </div>
                      <div
                        v-else
                        class="flex h-7 w-7 items-center justify-center rounded-full bg-error/15 text-error"
                      >
                        <icon-x-circle class="h-5 w-5" />
                      </div>
                    </div>
                  </template>

                  <!-- UUID Column (auto-detected) -->
                  <template v-else-if="isUUID(row[col.field])">
                    <span
                      class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-white shadow-sm cursor-default transition-all hover:scale-105"
                      :style="{ backgroundColor: colorFromUUID(row[col.field] as string) }"
                      :title="row[col.field] as string"
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
                      {{ shortUUID(row[col.field] as string) }}
                    </span>
                  </template>

                  <!-- Boolean Column (auto-detected) -->
                  <template v-else-if="isBoolean(row[col.field])">
                    <div class="flex justify-center">
                      <span
                        v-if="toBoolean(row[col.field])"
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
                    </div>
                  </template>

                  <!-- Default Column -->
                  <template v-else>
                    <span class="text-slate-600 dark:text-navy-200">{{ row[col.field] }}</span>
                  </template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination Footer -->
        <div
          v-if="searchResults.length > 0"
          class="flex flex-col justify-between space-y-4 px-4 py-4 sm:flex-row sm:items-center sm:space-y-0 sm:px-5"
        >
          <div class="flex items-center space-x-2 text-xs+">
            <span>{{ t('forms.commons.show') || 'Exibir' }}</span>
            <label class="block">
              <select
                v-model.number="pageSize"
                class="form-select rounded-full border border-slate-300 bg-white px-2 py-1 pr-6 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:bg-navy-700 dark:hover:border-navy-400 dark:focus:border-accent"
              >
                <option v-for="size in pageSizeOptions" :key="size" :value="size">
                  {{ size }}
                </option>
              </select>
            </label>
            <span>{{ t('forms.commons.entries') || 'registros' }}</span>
          </div>

          <ol class="pagination">
            <li class="rounded-l-lg bg-slate-150 dark:bg-navy-500">
              <button
                @click="prevPage"
                :disabled="currentPage === 1"
                class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-300 focus:bg-slate-300 active:bg-slate-300/80 disabled:opacity-50 disabled:cursor-not-allowed dark:text-navy-200 dark:hover:bg-navy-450 dark:focus:bg-navy-450 dark:active:bg-navy-450/90"
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

            <li v-for="page in visiblePages" :key="page" class="bg-slate-150 dark:bg-navy-500">
              <button
                @click="goToPage(page)"
                :class="[
                  'flex h-8 min-w-[2rem] items-center justify-center rounded-lg px-3 leading-tight transition-colors',
                  page === currentPage
                    ? 'bg-primary text-white hover:bg-primary-focus focus:bg-primary-focus active:bg-primary-focus/90 dark:bg-accent dark:hover:bg-accent-focus dark:focus:bg-accent-focus dark:active:bg-accent/90'
                    : 'hover:bg-slate-300 focus:bg-slate-300 active:bg-slate-300/80 dark:hover:bg-navy-450 dark:focus:bg-navy-450 dark:active:bg-navy-450/90'
                ]"
              >
                {{ page }}
              </button>
            </li>

            <li class="rounded-r-lg bg-slate-150 dark:bg-navy-500">
              <button
                @click="nextPage"
                :disabled="currentPage === totalPages"
                class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-300 focus:bg-slate-300 active:bg-slate-300/80 disabled:opacity-50 disabled:cursor-not-allowed dark:text-navy-200 dark:hover:bg-navy-450 dark:focus:bg-navy-450 dark:active:bg-navy-450/90"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </li>
          </ol>

          <div class="text-xs+">
            {{ startRow }} - {{ endRow }} de {{ totalRows }}
            {{ t('forms.commons.entries') || 'registros' }}
          </div>
        </div>

        <!-- Empty State -->
        <div
          v-if="searchResults.length === 0"
          class="flex flex-col items-center justify-center py-10"
        >
          <div
            class="h-16 w-16 rounded-full bg-slate-100 dark:bg-navy-600 flex items-center justify-center"
          >
            <svg
              class="h-8 w-8 text-slate-400 dark:text-navy-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
          </div>
          <p class="mt-4 text-slate-500 dark:text-navy-200">
            {{ t('forms.commons.noData') }}
          </p>
        </div>
      </template>
    </modal-modal-base>
  </div>
</template>

<style scoped>
.pagination {
  display: flex;
}

.pagination li:not(:first-child):not(:last-child) {
  margin: 0;
}

.badge {
  @apply inline-flex items-center px-2.5 py-0.5 text-xs font-medium;
}
</style>
