<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import vCurrency from '@/directives/currency'

// ========== Types ==========
type RowId = string | number
type SortOrder = 'asc' | 'desc' | null

export interface TableColumn {
  field: string
  title: string
  sortable?: boolean
  isUnique?: boolean
}

export interface TableProps {
  /** Dados da tabela */
  rows: any[]
  /** Colunas customizadas (opcional - inferido dos dados se não fornecido) */
  columns?: TableColumn[]
  /** Prefixo para tradução das colunas */
  translationPrefix?: string
  /** Exibe checkboxes de seleção */
  hasCheckbox?: boolean
  /** Permite ordenação */
  sortable?: boolean
  /** Estado de loading */
  loading?: boolean
  /** Opções de tamanho de página */
  pageSizeOptions?: number[]
  /** Tamanho inicial da página */
  initialPageSize?: number
  /** Exibe coluna de ações */
  showActions?: boolean
  /** Texto para estado vazio */
  emptyText?: string

  columnsLimit?: number
}

// ========== Props & Emits ==========
const props = withDefaults(defineProps<TableProps>(), {
  columns: undefined,
  translationPrefix: 'default',
  hasCheckbox: false,
  sortable: true,
  loading: false,
  pageSizeOptions: () => [10, 30, 50],
  initialPageSize: 10,
  showActions: false,
  emptyText: undefined,
  columnsLimit: undefined
})

const emit = defineEmits<{
  /** Emitido quando a seleção muda */
  selectionChange: [rows: any[]]
  /** Emitido quando uma linha é clicada */
  rowClick: [row: any]
}>()

const { t } = useI18n()

// ========== State ==========
const selectedRowIds = ref<Set<RowId>>(new Set())
const sortField = ref<string | null>(null)
const sortOrder = ref<SortOrder>(null)
const currentPage = ref(1)
const pageSize = ref(props.initialPageSize)
const searchQuery = ref('')
const isSearchActive = ref(false)

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

// ========== Row Utils ==========
const getRowId = (row: any): RowId | undefined => row?.id

// ========== Columns ==========
const cols = computed<TableColumn[]>(() => {
  // 1. Prioridade máxima: colunas passadas via props
  if (props.columns?.length) return props.columns

  const firstRow = props.rows[0]
  if (!firstRow) return []

  // 2. Definir campos prioritários
  const priorityFields = ['id', 'name', 'email', 'description', 'title']

  // 3. Pegar todas as chaves válidas (removendo as que começam com _)
  const allAvailableKeys = Object.keys(firstRow).filter((k) => !k.startsWith('_'))

  // 4. Organizar: Primeiro os prioritários que existem, depois o resto
  const sortedKeys = [
    ...priorityFields.filter((key) => allAvailableKeys.includes(key)),
    ...allAvailableKeys.filter((key) => !priorityFields.includes(key))
  ]

  // 5. Mapear para o formato de coluna
  let baseCols: TableColumn[] = sortedKeys.map((field) => ({
    field,
    title: t(`forms.table.${props.translationPrefix}.${field}`),
    isUnique: true,
    sortable: props.sortable
  }))

  // 6. Adicionar coluna de ação (antes do limit para manter o comportamento original)
  if (props.showActions) {
    baseCols.push({
      field: 'action',
      title: t('forms.commons.action'),
      isUnique: true,
      sortable: false
    })
  }

  // 7. Aplicar o limite se ele existir
  if (props.columnsLimit !== null) {
    return baseCols.slice(0, props.columnsLimit)
  }

  return baseCols
})

// ========== Column Type Detection ==========
const isHtmlCol = (field: string) => field.includes('html')
const isSwitchCol = (field: string) => field.includes('switch')
const isCurrencyCol = (field: string) => field.includes('currency_data')
const isActionCol = (field: string) => field === 'action'

const asCentsToCurrencyNumber = (value: unknown): number => {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n / 100 : 0
}

// ========== Filtered Data ==========
const filteredData = computed(() => {
  if (!searchQuery.value.trim()) return props.rows

  const query = searchQuery.value.toLowerCase()
  return props.rows.filter((row) => {
    return Object.values(row).some((value) => {
      if (value === null || value === undefined) return false
      return String(value).toLowerCase().includes(query)
    })
  })
})

// ========== Sorted Data ==========
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

// ========== Paginated Data ==========
const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return sortedData.value.slice(start, end)
})

// ========== Pagination Info ==========
const totalRows = computed(() => filteredData.value.length)
const totalPages = computed(() => Math.ceil(totalRows.value / pageSize.value))
const startRow = computed(() =>
  totalRows.value === 0 ? 0 : (currentPage.value - 1) * pageSize.value + 1
)
const endRow = computed(() => Math.min(currentPage.value * pageSize.value, totalRows.value))

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

// ========== Selection ==========
const selectedRows = computed<any[]>(() => {
  return props.rows.filter((row) => {
    const id = getRowId(row)
    return id !== undefined && selectedRowIds.value.has(id)
  })
})

const isAllSelected = computed(() => {
  if (paginatedData.value.length === 0) return false
  return paginatedData.value.every((row) => {
    const id = getRowId(row)
    return id !== undefined && selectedRowIds.value.has(id)
  })
})

const isIndeterminate = computed(() => {
  if (paginatedData.value.length === 0) return false
  const selectedCount = paginatedData.value.filter((row) => {
    const id = getRowId(row)
    return id !== undefined && selectedRowIds.value.has(id)
  }).length
  return selectedCount > 0 && selectedCount < paginatedData.value.length
})

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    paginatedData.value.forEach((row) => {
      const id = getRowId(row)
      if (id !== undefined) selectedRowIds.value.delete(id)
    })
  } else {
    paginatedData.value.forEach((row) => {
      const id = getRowId(row)
      if (id !== undefined) selectedRowIds.value.add(id)
    })
  }
  emit('selectionChange', selectedRows.value)
}

const toggleRowSelection = (row: any) => {
  const id = getRowId(row)
  if (id === undefined) return

  if (selectedRowIds.value.has(id)) {
    selectedRowIds.value.delete(id)
  } else {
    selectedRowIds.value.add(id)
  }
  emit('selectionChange', selectedRows.value)
}

const isRowSelected = (row: any) => {
  const id = getRowId(row)
  return id !== undefined && selectedRowIds.value.has(id)
}

// ========== Sorting ==========
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

// ========== Pagination ==========
const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

const prevPage = () => goToPage(currentPage.value - 1)
const nextPage = () => goToPage(currentPage.value + 1)

// Reset page when search or pageSize changes
watch([searchQuery, pageSize], () => {
  currentPage.value = 1
})

// Reset selection when rows change
watch(
  () => props.rows,
  () => {
    selectedRowIds.value.clear()
    currentPage.value = 1
  }
)

// ========== Expose ==========
defineExpose({
  getSelectedRows: () => selectedRows.value,
  clearSelection: () => {
    selectedRowIds.value.clear()
    emit('selectionChange', [])
  },
  resetPagination: () => {
    currentPage.value = 1
  }
})
</script>

<template>
  <!-- Search Bar -->
  <div class="flex items-center justify-end mb-3">
    <div class="flex items-center">
      <label class="block">
        <input
          v-model="searchQuery"
          :class="isSearchActive ? 'w-32 lg:w-48' : 'w-0'"
          class="form-input bg-transparent px-1 text-right transition-all duration-100 placeholder:text-slate-500 dark:placeholder:text-navy-200"
          placeholder="Buscar..."
          type="text"
          @focus="isSearchActive = true"
          @blur="!searchQuery && (isSearchActive = false)"
        />
      </label>
      <button
        @click="isSearchActive = !isSearchActive"
        class="btn h-8 w-8 rounded-full p-0 hover:bg-slate-300/20 focus:bg-slate-300/20 active:bg-slate-300/25 dark:hover:bg-navy-300/20 dark:focus:bg-navy-300/20 dark:active:bg-navy-300/25"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-4.5 w-4.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </button>
    </div>
  </div>

  <!-- Loading State -->
  <div v-if="loading" class="card flex items-center justify-center py-10">
    <div
      class="spinner h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent"
    ></div>
    <span class="ml-3 text-slate-500 dark:text-navy-200">{{ t('forms.commons.loading') }}</span>
  </div>

  <!-- Data Table -->
  <div v-else class="card">
    <div v-if="rows.length > 0" class="is-scrollbar-hidden min-w-full overflow-x-auto">
      <table class="is-hoverable w-full text-left">
        <thead>
          <tr>
            <!-- Checkbox Header -->
            <th
              v-if="hasCheckbox"
              class="whitespace-nowrap rounded-tl-lg bg-slate-200 px-4 py-3 dark:bg-navy-800 lg:px-5"
            >
              <label class="flex items-center">
                <input
                  type="checkbox"
                  :checked="isAllSelected"
                  :indeterminate="isIndeterminate"
                  @change="toggleSelectAll"
                  class="form-checkbox is-basic h-5 w-5 rounded border-slate-400/70 checked:border-primary checked:bg-primary hover:border-primary focus:border-primary dark:border-navy-400 dark:checked:border-accent dark:checked:bg-accent dark:hover:border-accent dark:focus:border-accent"
                />
              </label>
            </th>

            <!-- Column Headers -->
            <th
              v-for="(col, index) in cols"
              :key="col.field"
              :class="[
                'whitespace-nowrap bg-slate-200 px-4 py-3 font-semibold uppercase text-slate-800 dark:bg-navy-800 dark:text-navy-100 lg:px-5',
                index === 0 && !hasCheckbox && 'rounded-tl-lg',
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
            :key="getRowId(row)"
            class="border-y border-transparent border-b-slate-200 dark:border-b-navy-500"
            :class="{ 'bg-primary/5 dark:bg-accent/5': isRowSelected(row) }"
            @click="emit('rowClick', row)"
          >
            <!-- Row Checkbox -->
            <td v-if="hasCheckbox" class="whitespace-nowrap px-4 py-3 sm:px-5">
              <label class="flex items-center" @click.stop>
                <input
                  type="checkbox"
                  :checked="isRowSelected(row)"
                  @change="toggleRowSelection(row)"
                  class="form-checkbox is-basic h-5 w-5 rounded border-slate-400/70 checked:border-primary checked:bg-primary hover:border-primary focus:border-primary dark:border-navy-400 dark:checked:border-accent dark:checked:bg-accent dark:hover:border-accent dark:focus:border-accent"
                />
              </label>
            </td>

            <!-- Row Data -->
            <td v-for="col in cols" :key="col.field" class="whitespace-nowrap px-4 py-3 sm:px-5">
              <!-- Action Column Slot -->
              <template v-if="isActionCol(col.field)">
                <slot name="actions" :row="row" />
              </template>

              <!-- Currency Column -->
              <template v-else-if="isCurrencyCol(col.field)">
                <span
                  class="font-medium text-slate-700 dark:text-navy-100"
                  v-currency="asCentsToCurrencyNumber(row[col.field])"
                ></span>
              </template>

              <!-- HTML Column -->
              <template v-else-if="isHtmlCol(col.field)">
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

              <!-- Custom Cell Slot -->
              <template v-else-if="$slots[`cell-${col.field}`]">
                <slot :name="`cell-${col.field}`" :row="row" :value="row[col.field]" />
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
      v-if="rows.length > 0"
      class="flex flex-col justify-between space-y-4 px-4 py-4 sm:flex-row sm:items-center sm:space-y-0 sm:px-5"
    >
      <!-- Page Size -->
      <div class="flex items-center space-x-2 text-xs+">
        <span>{{ t('forms.commons.show') || 'Exibir' }}</span>
        <label class="block">
          <select
            v-model.number="pageSize"
            class="form-select rounded-full border border-slate-300 bg-white px-2 py-1 pr-6 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:bg-navy-700 dark:hover:border-navy-400 dark:focus:border-accent"
          >
            <option v-for="size in pageSizeOptions" :key="size" :value="size">{{ size }}</option>
          </select>
        </label>
        <span>{{ t('forms.commons.entries') || 'registros' }}</span>
      </div>

      <!-- Pagination Controls -->
      <ol class="pagination">
        <!-- Previous -->
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

        <!-- Page Numbers -->
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

        <!-- Next -->
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

      <!-- Entries Info -->
      <div class="text-xs+">
        {{ startRow }} - {{ endRow }} de {{ totalRows }}
        {{ t('forms.commons.entries') || 'registros' }}
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="rows.length === 0" class="flex flex-col items-center justify-center py-10">
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
        {{ emptyText ?? t('forms.commons.noData') }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.spinner {
  border-top-color: transparent;
}

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
