<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'

import type {
  EntityMetadata,
  QueryConfig,
  ChartConfig,
  ChartData,
  FieldMetadata,
  SelectField,
  FilterCondition,
  GroupByField,
  ChartType,
  OperationType
} from '@/bin/platform/dashboard/components/dynamicChartWidget/types/analytics'
import {
  OPERATION_LABELS,
  CHART_TYPES,
  FIELD_TYPE_ICONS,
  createEmptyQueryConfig,
  createEmptyChartConfig
} from '@/bin/platform/dashboard/components/dynamicChartWidget/types/analytics'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import type { ChartOptions } from 'chart.js'
import { Line, Bar, Pie, Doughnut, Radar, PolarArea } from 'vue-chartjs'
import { useGlobalWidgetStore } from '@/stores/globalWidgetStore'
import { useAnalyticsApi } from '@/bin/platform/dashboard/components/dynamicChartWidget/composables/useAnalyticsApi'

// Register Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
)

const props = defineProps<{
  initialConfiguration?: Record<string, any>
  isCatalog: boolean
  masterEditing: boolean
  widgetId: string
  pivot: string
}>()

const api = useAnalyticsApi()
const widgetStore = useGlobalWidgetStore()

// State
const mode = ref<'view' | 'configure'>('view')
const entities = ref<EntityMetadata[]>([])
const selectedEntity = ref<EntityMetadata | null>(null)
const queryConfig = ref<QueryConfig>(createEmptyQueryConfig())
const chartConfig = ref<ChartConfig>(createEmptyChartConfig())
const chartData = ref<ChartData | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const executionTime = ref<number>(0)

const emit = defineEmits(['internalConfig'])
// Configuration form state
const newField = ref({ field: '', aggregation: '' as OperationType | '' })
const newFilter = ref({ field: '', operation: '' as OperationType | '', value: '', valueTo: '' })
const newGroupBy = ref({ field: '', temporalGrouping: '' as OperationType | '' })

// Computed
const hasValidConfig = computed(() => {
  return (
    queryConfig.value.entityName &&
    queryConfig.value.selectFields.length > 0 &&
    chartConfig.value.labelField &&
    chartConfig.value.dataFields.length > 0
  )
})

const isConfigured = computed(() => {
  return props.initialConfiguration?.queryConfig && props.initialConfiguration?.chartConfig
})

const selectedEntityFields = computed(() => selectedEntity.value?.fields || [])

const availableSelectFields = computed(() => {
  return queryConfig.value.selectFields.map((sf) => ({
    value: sf.alias || sf.field,
    label: sf.alias || sf.field,
    isAggregation: !!sf.aggregation
  }))
})

const chartComponent = computed(() => {
  switch (chartConfig.value.chartType) {
    case 'LINE':
    case 'AREA':
      return Line
    case 'BAR':
    case 'HORIZONTAL_BAR':
      return Bar
    case 'PIE':
      return Pie
    case 'DOUGHNUT':
      return Doughnut
    case 'RADAR':
      return Radar
    case 'POLAR_AREA':
      return PolarArea
    default:
      return Bar
  }
})

const chartOptions = computed<ChartOptions<any>>(() => {
  const config = chartConfig.value
  const isHorizontal = config.chartType === 'HORIZONTAL_BAR'
  const isPie = ['PIE', 'DOUGHNUT', 'POLAR_AREA'].includes(config.chartType)

  return {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: (isHorizontal ? 'y' : 'x') as 'x' | 'y',
    plugins: {
      title: { display: !!config.title, text: config.title || '' },
      legend: {
        display: config.showLegend ?? true,
        position: (config.legendPosition || 'top') as 'top' | 'left' | 'bottom' | 'right' | 'center' | 'chartArea',
        labels: { boxWidth: 12, font: { size: 11 } }
      }
    },
    scales: isPie
      ? undefined
      : {
          x: { display: true, stacked: config.stacked },
          y: { display: true, beginAtZero: true, stacked: config.stacked }
        }
  } as ChartOptions<any>
})

// Actions
async function loadEntities() {
  try {
    entities.value = await api.getEntities()
  } catch (e) {
    console.error('Failed to load entities:', e)
  }
}

function selectEntity(entityName: string) {
  const entity = entities.value.find((e) => e.name === entityName)
  if (entity) {
    selectedEntity.value = entity
    queryConfig.value.entityName = entityName
    // Reset when entity changes
    queryConfig.value.selectFields = []
    queryConfig.value.filters = []
    queryConfig.value.groupBy = []
    chartConfig.value.labelField = ''
    chartConfig.value.dataFields = []
  }
}

function addSelectField() {
  if (!newField.value.field) return
  const field = selectedEntityFields.value.find((f) => f.name === newField.value.field)
  if (!field) return

  const alias = newField.value.aggregation
    ? `${newField.value.aggregation.toLowerCase()}_${newField.value.field}`
    : newField.value.field

  queryConfig.value.selectFields.push({
    field: newField.value.field,
    alias,
    aggregation: newField.value.aggregation || undefined
  })

  newField.value = { field: '', aggregation: '' }
}

function removeSelectField(index: number) {
  queryConfig.value.selectFields.splice(index, 1)
}

function addFilter() {
  if (!newFilter.value.field || !newFilter.value.operation) return

  queryConfig.value.filters.push({
    field: newFilter.value.field,
    operation: newFilter.value.operation,
    value: newFilter.value.value || undefined,
    valueTo: newFilter.value.valueTo || undefined,
    logicalOperator: 'AND'
  })

  newFilter.value = { field: '', operation: '', value: '', valueTo: '' }
}

function removeFilter(index: number) {
  queryConfig.value.filters.splice(index, 1)
}

function addGroupBy() {
  if (!newGroupBy.value.field) return

  const alias = newGroupBy.value.temporalGrouping
    ? `${newGroupBy.value.field}_${newGroupBy.value.temporalGrouping.replace('GROUP_BY_', '').toLowerCase()}`
    : newGroupBy.value.field

  queryConfig.value.groupBy.push({
    field: newGroupBy.value.field,
    temporalGrouping: newGroupBy.value.temporalGrouping || undefined,
    alias
  })

  newGroupBy.value = { field: '', temporalGrouping: '' }
}

function removeGroupBy(index: number) {
  queryConfig.value.groupBy.splice(index, 1)
}

function toggleDataField(field: string) {
  const idx = chartConfig.value.dataFields.indexOf(field)
  if (idx === -1) {
    chartConfig.value.dataFields.push(field)
  } else {
    chartConfig.value.dataFields.splice(idx, 1)
  }
}

async function executeQuery() {
  if (!hasValidConfig.value) return

  loading.value = true
  error.value = null

  try {
    const response = await api.executeChartQuery(queryConfig.value, chartConfig.value)
    chartData.value = response.chartData
    executionTime.value = response.executionTimeMs
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Erro ao executar query'
  } finally {
    loading.value = false
  }
}

function applyConfiguration() {
  let configuration = {
    ...props.initialConfiguration,
    queryConfig: JSON.stringify(queryConfig.value),
    chartConfig: JSON.stringify(chartConfig.value)
  }
  console.log(props.pivot, props.widgetId)
  emit('internalConfig', [queryConfig, chartConfig])
  widgetStore.updateWidgetConfiguration(props.pivot, props.widgetId, configuration)
  // Salva a configuração no sistema de widgets existente
  // Isso será feito pelo sistema de widgets quando o usuário salvar
  mode.value = 'view'
  executeQuery()
}

function openConfiguration() {
  mode.value = 'configure'
}

function getAggregationOptions(field: FieldMetadata) {
  const aggOps = ['COUNT', 'COUNT_DISTINCT', 'SUM', 'AVG', 'MIN', 'MAX'] as OperationType[]
  return field.allowedOperations.filter((op) => aggOps.includes(op))
}

function getFilterOperations(field: FieldMetadata) {
  const filterOps = [
    'EQUALS',
    'NOT_EQUALS',
    'GREATER_THAN',
    'GREATER_THAN_OR_EQUALS',
    'LESS_THAN',
    'LESS_THAN_OR_EQUALS',
    'BETWEEN',
    'IN',
    'IS_NULL',
    'IS_NOT_NULL',
    'LIKE',
    'CONTAINS'
  ] as OperationType[]
  return field.allowedOperations.filter((op) => filterOps.includes(op))
}

function getTemporalGroupingOptions(field: FieldMetadata) {
  const temporalOps = [
    'GROUP_BY_DAY',
    'GROUP_BY_WEEK',
    'GROUP_BY_MONTH',
    'GROUP_BY_YEAR'
  ] as OperationType[]
  return field.allowedOperations.filter((op) => temporalOps.includes(op))
}

// Get current field for filter operations
const currentFilterField = computed(() => {
  if (!newFilter.value.field) return null
  return selectedEntityFields.value.find((f) => f.name === newFilter.value.field)
})

// Load saved configuration
function loadSavedConfiguration() {
  if (props.initialConfiguration?.queryConfig) {
    try {
      queryConfig.value = JSON.parse(props.initialConfiguration.queryConfig)

      // Find and set selected entity
      const entity = entities.value.find((e) => e.name === queryConfig.value.entityName)
      if (entity) selectedEntity.value = entity
    } catch (e) {
      console.warn('Failed to parse queryConfig:', e)
    }
  }

  if (props.initialConfiguration?.chartConfig) {
    try {
      chartConfig.value = JSON.parse(props.initialConfiguration.chartConfig)
    } catch (e) {
      console.warn('Failed to parse chartConfig:', e)
    }
  }
}

// Exposed for parent widget wrapper to save configuration
defineExpose({
  getConfiguration: () => ({
    queryConfig: JSON.stringify(queryConfig.value),
    chartConfig: JSON.stringify(chartConfig.value)
  })
})

// Lifecycle
onMounted(async () => {
  await loadEntities()
  loadSavedConfiguration()

  if (isConfigured.value && !props.isCatalog) {
    await executeQuery()
  } else if (!props.isCatalog) {
    mode.value = 'configure'
  }
})

// Watch for configuration changes
watch(
  () => props.initialConfiguration,
  () => {
    loadSavedConfiguration()
    if (isConfigured.value && !props.isCatalog) {
      executeQuery()
    }
  },
  { deep: true }
)
</script>

<template>
  <div class="dynamic-chart-widget h-full flex flex-col bg-white dark:bg-navy-700 rounded-lg overflow-hidden">

    <!-- Catalog Mode -->
    <div v-if="isCatalog" class="flex flex-col items-center justify-center h-full gap-2 p-6 text-center">
      <em class="fa-solid fa-chart-column text-4xl text-primary/50"></em>
      <p class="font-semibold text-sm text-slate-700 dark:text-navy-100">Gráfico Dinâmico</p>
      <p class="text-xs text-slate-500 dark:text-navy-300">Crie gráficos a partir de qualquer entidade</p>
    </div>

    <!-- Configuration Mode -->
    <div v-else-if="mode === 'configure'" class="flex-1 flex flex-col min-h-0 overflow-hidden">
      <!-- Config Header -->
      <div class="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 dark:border-navy-600 bg-slate-50 dark:bg-navy-800 shrink-0">
        <div class="flex items-center gap-2">
          <em class="fa-solid fa-gear text-primary text-xs"></em>
          <span class="font-semibold text-sm text-slate-700 dark:text-navy-100">Configurar Gráfico</span>
        </div>
        <button
          v-if="isConfigured"
          class="btn flex items-center gap-1 text-xs text-slate-500 dark:text-navy-300 hover:text-primary px-2 py-1 rounded-md hover:bg-primary/10"
          @click="mode = 'view'"
        >
          <em class="fa-solid fa-arrow-left"></em>
          Voltar
        </button>
      </div>

      <!-- Scrollable config body -->
      <div class="flex-1 overflow-y-auto p-4 space-y-4">

        <!-- Entity Selection -->
        <div>
          <label class="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-navy-400 mb-1.5">
            <em class="fa-solid fa-database text-primary/60"></em>
            Entidade
          </label>
          <select
            :value="queryConfig.entityName"
            @change="selectEntity(($event.target as HTMLSelectElement).value)"
            class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-navy-500 bg-white dark:bg-navy-700 text-slate-700 dark:text-navy-100 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
          >
            <option value="">Selecione uma entidade...</option>
            <option v-for="e in entities" :key="e.name" :value="e.name">
              {{ e.displayName }}
            </option>
          </select>
        </div>

        <!-- Fields Selection -->
        <div v-if="selectedEntity">
          <label class="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-navy-400 mb-1.5">
            <em class="fa-solid fa-table-columns text-primary/60"></em>
            Campos
          </label>
          <div class="flex gap-2 mb-2">
            <select
              v-model="newField.field"
              class="flex-1 px-2 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-navy-500 bg-white dark:bg-navy-700 text-slate-700 dark:text-navy-100"
            >
              <option value="">Selecione o campo...</option>
              <option v-for="f in selectedEntityFields" :key="f.name" :value="f.name">
                {{ f.displayName }}
              </option>
            </select>
            <select
              v-model="newField.aggregation"
              class="w-32 px-2 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-navy-500 bg-white dark:bg-navy-700 text-slate-700 dark:text-navy-100 disabled:opacity-50"
              :disabled="!newField.field"
            >
              <option value="">Sem agregação</option>
              <option
                v-for="op in newField.field ? getAggregationOptions(selectedEntityFields.find((f) => f.name === newField.field)!) : []"
                :key="op"
                :value="op"
              >
                {{ OPERATION_LABELS[op] }}
              </option>
            </select>
            <button
              class="btn size-8 p-0 rounded-lg bg-primary text-white hover:bg-primary-focus disabled:opacity-40 shrink-0"
              :disabled="!newField.field"
              @click="addSelectField"
            >
              <em class="fa-solid fa-plus text-xs"></em>
            </button>
          </div>
          <div class="space-y-1">
            <div
              v-for="(sf, idx) in queryConfig.selectFields"
              :key="idx"
              class="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-600 text-sm"
            >
              <span class="flex items-center gap-1.5 text-slate-700 dark:text-navy-100 min-w-0">
                <em
                  :class="FIELD_TYPE_ICONS[selectedEntityFields.find((f) => f.name === sf.field)?.type || 'STRING']"
                  class="text-slate-400 dark:text-navy-400 text-xs shrink-0"
                ></em>
                <span class="truncate">{{ sf.field }}</span>
                <span v-if="sf.aggregation" class="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary shrink-0">
                  {{ OPERATION_LABELS[sf.aggregation] }}
                </span>
              </span>
              <button class="btn size-6 p-0 text-slate-400 hover:text-error shrink-0 ml-2" @click="removeSelectField(idx)">
                <em class="fa-solid fa-xmark text-xs"></em>
              </button>
            </div>
          </div>
        </div>

        <!-- Filters -->
        <div v-if="selectedEntity && queryConfig.selectFields.length > 0">
          <label class="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-navy-400 mb-1.5">
            <em class="fa-solid fa-filter text-warning/70"></em>
            Filtros
          </label>
          <div class="flex gap-2 mb-2 flex-wrap">
            <select
              v-model="newFilter.field"
              class="flex-1 min-w-[120px] px-2 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-navy-500 bg-white dark:bg-navy-700 text-slate-700 dark:text-navy-100"
            >
              <option value="">Campo...</option>
              <option v-for="f in selectedEntityFields" :key="f.name" :value="f.name">
                {{ f.displayName }}
              </option>
            </select>
            <select
              v-model="newFilter.operation"
              class="w-32 px-2 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-navy-500 bg-white dark:bg-navy-700 text-slate-700 dark:text-navy-100 disabled:opacity-50"
              :disabled="!newFilter.field"
            >
              <option value="">Operação...</option>
              <option
                v-for="op in currentFilterField ? getFilterOperations(currentFilterField) : []"
                :key="op"
                :value="op"
              >
                {{ OPERATION_LABELS[op] }}
              </option>
            </select>
            <input
              v-if="newFilter.operation && !['IS_NULL', 'IS_NOT_NULL'].includes(newFilter.operation)"
              v-model="newFilter.value"
              placeholder="Valor"
              class="w-24 px-2 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-navy-500 bg-white dark:bg-navy-700 text-slate-700 dark:text-navy-100"
            />
            <button
              class="btn size-8 p-0 rounded-lg bg-warning/20 text-warning-focus hover:bg-warning/30 disabled:opacity-40 shrink-0"
              :disabled="!newFilter.field || !newFilter.operation"
              @click="addFilter"
            >
              <em class="fa-solid fa-plus text-xs"></em>
            </button>
          </div>
          <div class="space-y-1">
            <div
              v-for="(f, idx) in queryConfig.filters"
              :key="idx"
              class="flex items-center justify-between px-3 py-1.5 rounded-lg bg-warning/5 border border-warning/20 text-sm"
            >
              <span class="flex items-center gap-1.5 text-slate-700 dark:text-navy-100 min-w-0 flex-wrap">
                <em class="fa-solid fa-filter text-warning text-xs shrink-0"></em>
                <span class="truncate">{{ f.field }}</span>
                <span class="text-xs text-slate-500 dark:text-navy-300">{{ OPERATION_LABELS[f.operation] }}</span>
                <span v-if="f.value" class="text-xs px-1.5 py-0.5 rounded bg-warning/10 text-warning-focus">{{ f.value }}</span>
              </span>
              <button class="btn size-6 p-0 text-slate-400 hover:text-error shrink-0 ml-2" @click="removeFilter(idx)">
                <em class="fa-solid fa-xmark text-xs"></em>
              </button>
            </div>
          </div>
        </div>

        <!-- Group By -->
        <div v-if="selectedEntity && queryConfig.selectFields.length > 0">
          <label class="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-navy-400 mb-1.5">
            <em class="fa-solid fa-layer-group text-info/70"></em>
            Agrupar Por
          </label>
          <div class="flex gap-2 mb-2">
            <select
              v-model="newGroupBy.field"
              class="flex-1 px-2 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-navy-500 bg-white dark:bg-navy-700 text-slate-700 dark:text-navy-100"
            >
              <option value="">Campo...</option>
              <option v-for="f in selectedEntityFields" :key="f.name" :value="f.name">
                {{ f.displayName }}
              </option>
            </select>
            <select
              v-model="newGroupBy.temporalGrouping"
              class="w-32 px-2 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-navy-500 bg-white dark:bg-navy-700 text-slate-700 dark:text-navy-100 disabled:opacity-50"
              :disabled="!newGroupBy.field"
            >
              <option value="">Sem temporal</option>
              <option
                v-for="op in newGroupBy.field ? getTemporalGroupingOptions(selectedEntityFields.find((f) => f.name === newGroupBy.field)!) : []"
                :key="op"
                :value="op"
              >
                {{ OPERATION_LABELS[op] }}
              </option>
            </select>
            <button
              class="btn size-8 p-0 rounded-lg bg-info/10 text-info hover:bg-info/20 disabled:opacity-40 shrink-0"
              :disabled="!newGroupBy.field"
              @click="addGroupBy"
            >
              <em class="fa-solid fa-plus text-xs"></em>
            </button>
          </div>
          <div class="space-y-1">
            <div
              v-for="(gb, idx) in queryConfig.groupBy"
              :key="idx"
              class="flex items-center justify-between px-3 py-1.5 rounded-lg bg-info/5 border border-info/20 text-sm"
            >
              <span class="flex items-center gap-1.5 text-slate-700 dark:text-navy-100 min-w-0">
                <em class="fa-solid fa-layer-group text-info text-xs shrink-0"></em>
                <span class="truncate">{{ gb.field }}</span>
                <span v-if="gb.temporalGrouping" class="text-xs px-1.5 py-0.5 rounded bg-info/10 text-info shrink-0">
                  {{ OPERATION_LABELS[gb.temporalGrouping] }}
                </span>
              </span>
              <button class="btn size-6 p-0 text-slate-400 hover:text-error shrink-0 ml-2" @click="removeGroupBy(idx)">
                <em class="fa-solid fa-xmark text-xs"></em>
              </button>
            </div>
          </div>
        </div>

        <!-- Chart Type -->
        <div v-if="queryConfig.selectFields.length > 0">
          <label class="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-navy-400 mb-1.5">
            <em class="fa-solid fa-chart-pie text-primary/60"></em>
            Tipo de Gráfico
          </label>
          <div class="grid grid-cols-4 gap-1.5">
            <button
              v-for="ct in CHART_TYPES"
              :key="ct.value"
              class="flex flex-col items-center gap-1 py-2 px-1 rounded-lg border text-xs transition"
              :class="[
                chartConfig.chartType === ct.value
                  ? 'border-primary bg-primary/10 text-primary dark:bg-primary/20'
                  : 'border-slate-200 dark:border-navy-600 text-slate-600 dark:text-navy-300 hover:bg-slate-50 dark:hover:bg-navy-800'
              ]"
              @click="chartConfig.chartType = ct.value"
            >
              <em :class="ct.icon" class="text-base"></em>
              <span class="leading-tight text-center">{{ ct.label }}</span>
            </button>
          </div>
        </div>

        <!-- Label Field (X) -->
        <div v-if="availableSelectFields.length > 0">
          <label class="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-navy-400 mb-1.5">
            <em class="fa-solid fa-tag text-primary/60"></em>
            Campo de Rótulos (X)
          </label>
          <select
            v-model="chartConfig.labelField"
            class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-navy-500 bg-white dark:bg-navy-700 text-slate-700 dark:text-navy-100 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
          >
            <option value="">Selecione...</option>
            <option v-for="f in availableSelectFields" :key="f.value" :value="f.value">
              {{ f.label }}
            </option>
          </select>
        </div>

        <!-- Data Fields (Y) -->
        <div v-if="availableSelectFields.length > 0">
          <label class="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-navy-400 mb-1.5">
            <em class="fa-solid fa-chart-bar text-primary/60"></em>
            Campos de Dados (Y)
          </label>
          <div class="space-y-1">
            <label
              v-for="f in availableSelectFields"
              :key="f.value"
              class="flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer transition"
              :class="[
                chartConfig.dataFields.includes(f.value)
                  ? 'border-primary/30 bg-primary/5 dark:bg-primary/10'
                  : 'border-slate-200 dark:border-navy-600 hover:bg-slate-50 dark:hover:bg-navy-800'
              ]"
            >
              <input
                type="checkbox"
                :checked="chartConfig.dataFields.includes(f.value)"
                @change="toggleDataField(f.value)"
                class="rounded accent-primary"
              />
              <span class="text-sm text-slate-700 dark:text-navy-100">{{ f.label }}</span>
            </label>
          </div>
        </div>

        <!-- Chart Title -->
        <div>
          <label class="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-navy-400 mb-1.5">
            <em class="fa-solid fa-heading text-primary/60"></em>
            Título
          </label>
          <input
            v-model="chartConfig.title"
            class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-navy-500 bg-white dark:bg-navy-700 text-slate-700 dark:text-navy-100 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
            placeholder="Título do gráfico..."
          />
        </div>

        <!-- Actions -->
        <div class="flex gap-2 pb-2">
          <button
            class="btn flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-navy-500 text-slate-600 dark:text-navy-200 hover:bg-slate-50 dark:hover:bg-navy-800 disabled:opacity-40 text-sm transition"
            :disabled="!hasValidConfig || loading"
            @click="executeQuery"
          >
            <em :class="loading ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-eye'"></em>
            {{ loading ? 'Carregando...' : 'Visualizar' }}
          </button>
          <button
            class="btn flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-focus disabled:opacity-40 text-sm transition"
            :disabled="!hasValidConfig"
            @click="applyConfiguration"
          >
            <em class="fa-solid fa-check"></em>
            Aplicar
          </button>
        </div>
      </div>
    </div>

    <!-- View Mode -->
    <div v-else class="flex-1 flex flex-col min-h-0">
      <!-- Header -->
      <div class="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 dark:border-navy-600 shrink-0">
        <span class="font-semibold text-sm text-slate-700 dark:text-navy-100">
          {{ chartConfig.title || 'Gráfico Dinâmico' }}
        </span>
      </div>

      <!-- Chart Area -->
      <div class="flex-1 p-4 min-h-0">
        <!-- Loading -->
        <div v-if="loading" class="h-full flex items-center justify-center">
          <div class="flex flex-col items-center gap-2">
            <em class="fa-solid fa-spinner fa-spin text-2xl text-primary"></em>
            <p class="text-sm text-slate-500 dark:text-navy-300">Carregando...</p>
          </div>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="h-full flex items-center justify-center">
          <div class="flex flex-col items-center gap-2 text-center">
            <em class="fa-solid fa-circle-exclamation text-2xl text-error"></em>
            <p class="text-sm text-error">{{ error }}</p>
            <button class="text-xs text-primary hover:underline" @click="executeQuery">
              Tentar novamente
            </button>
          </div>
        </div>

        <!-- No Data -->
        <div v-else-if="!chartData" class="h-full flex items-center justify-center">
          <div class="flex flex-col items-center gap-2 text-center">
            <em class="fa-solid fa-chart-column text-2xl text-slate-300 dark:text-navy-500"></em>
            <p class="text-sm text-slate-500 dark:text-navy-300">Sem dados</p>
            <button class="text-xs text-primary hover:underline" @click="openConfiguration">
              Configurar
            </button>
          </div>
        </div>

        <!-- Chart -->
        <div v-else class="h-full">
          <component
            :is="chartComponent"
            :data="{
              labels: chartData.labels || [],
              datasets: chartData.datasets
            }"
            :options="chartOptions"
          />
        </div>
      </div>

      <!-- Footer -->
      <div
        v-if="executionTime > 0 && !loading"
        class="flex items-center justify-between px-4 py-1.5 border-t border-slate-200 dark:border-navy-600 bg-slate-50 dark:bg-navy-800 shrink-0"
      >
        <span class="text-xs text-slate-400 dark:text-navy-400 flex items-center gap-1">
          <em class="fa-solid fa-clock"></em>
          {{ executionTime }}ms
        </span>
        <div class="flex items-center gap-1">
          <button
            class="btn size-7 p-0 text-slate-400 hover:text-primary rounded-md"
            :disabled="loading"
            title="Atualizar"
            @click="executeQuery"
          >
            <em :class="['fa-solid fa-arrows-rotate text-xs', { 'fa-spin': loading }]"></em>
          </button>
          <button
            v-if="masterEditing"
            class="btn size-7 p-0 text-slate-400 hover:text-slate-600 dark:hover:text-navy-200 rounded-md"
            title="Configurar"
            @click="openConfiguration"
          >
            <em class="fa-solid fa-gear text-xs"></em>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dynamic-chart-widget {
  min-height: 220px;
}
</style>
