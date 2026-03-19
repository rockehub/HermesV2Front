// types/analytics.ts

export interface FieldMetadata {
  name: string
  displayName: string
  type: FieldType
  nullable: boolean
  isRelation: boolean
  relatedEntity?: string
  enumValues?: string[]
  allowedOperations: OperationType[]
}

export type FieldType =
  | 'STRING'
  | 'INTEGER'
  | 'LONG'
  | 'DECIMAL'
  | 'BOOLEAN'
  | 'DATE'
  | 'TIME'
  | 'DATETIME'
  | 'INSTANT'
  | 'UUID'
  | 'ENUM'
  | 'RELATION'

export type OperationType =
  | 'EQUALS'
  | 'NOT_EQUALS'
  | 'GREATER_THAN'
  | 'GREATER_THAN_OR_EQUALS'
  | 'LESS_THAN'
  | 'LESS_THAN_OR_EQUALS'
  | 'BETWEEN'
  | 'IN'
  | 'NOT_IN'
  | 'IS_NULL'
  | 'IS_NOT_NULL'
  | 'LIKE'
  | 'NOT_LIKE'
  | 'STARTS_WITH'
  | 'ENDS_WITH'
  | 'CONTAINS'
  | 'COUNT'
  | 'COUNT_DISTINCT'
  | 'SUM'
  | 'AVG'
  | 'MIN'
  | 'MAX'
  | 'GROUP_BY'
  | 'GROUP_BY_DAY'
  | 'GROUP_BY_WEEK'
  | 'GROUP_BY_MONTH'
  | 'GROUP_BY_YEAR'
  | 'GROUP_BY_HOUR'

export interface EntityMetadata {
  name: string
  displayName: string
  tableName: string
  fields: FieldMetadata[]
  relations: Record<string, any>
}

export interface SelectField {
  field: string
  alias?: string
  aggregation?: OperationType
  joinPath?: string
}

export interface FilterCondition {
  field: string
  operation: OperationType
  value?: any
  valueTo?: any
  values?: any[]
  joinPath?: string
  logicalOperator?: 'AND' | 'OR'
}

export interface GroupByField {
  field: string
  temporalGrouping?: OperationType
  joinPath?: string
  alias?: string
}

export interface OrderByField {
  field: string
  ascending: boolean
  joinPath?: string
}

export interface QueryConfig {
  entityName: string
  selectFields: SelectField[]
  filters: FilterCondition[]
  groupBy: GroupByField[]
  orderBy: OrderByField[]
  joins: any[]
  limit?: number
}

export type ChartType =
  | 'LINE'
  | 'BAR'
  | 'HORIZONTAL_BAR'
  | 'PIE'
  | 'DOUGHNUT'
  | 'AREA'
  | 'SCATTER'
  | 'RADAR'
  | 'POLAR_AREA'

export interface ChartConfig {
  chartType: ChartType
  title?: string
  labelField: string
  dataFields: string[]
  seriesNames?: string[]
  colors?: Record<string, string>
  showLegend?: boolean
  legendPosition?: string
  stacked?: boolean
}

export interface ChartData {
  labels?: string[]
  datasets: {
    label: string
    data: any
    backgroundColor?: any
    borderColor?: any
    borderWidth?: number
    fill?: boolean
    tension?: number
  }[]
}

export interface ChartQueryResponse {
  chartData: ChartData
  executionTimeMs: number
  totalRecords: number
}

// Labels em português
export const OPERATION_LABELS: Record<OperationType, string> = {
  EQUALS: 'Igual a',
  NOT_EQUALS: 'Diferente de',
  GREATER_THAN: 'Maior que',
  GREATER_THAN_OR_EQUALS: 'Maior ou igual',
  LESS_THAN: 'Menor que',
  LESS_THAN_OR_EQUALS: 'Menor ou igual',
  BETWEEN: 'Entre',
  IN: 'Em',
  NOT_IN: 'Não em',
  IS_NULL: 'É nulo',
  IS_NOT_NULL: 'Não é nulo',
  LIKE: 'Contém',
  NOT_LIKE: 'Não contém',
  STARTS_WITH: 'Começa com',
  ENDS_WITH: 'Termina com',
  CONTAINS: 'Contém',
  COUNT: 'Contagem',
  COUNT_DISTINCT: 'Contagem distinta',
  SUM: 'Soma',
  AVG: 'Média',
  MIN: 'Mínimo',
  MAX: 'Máximo',
  GROUP_BY: 'Agrupar',
  GROUP_BY_DAY: 'Por dia',
  GROUP_BY_WEEK: 'Por semana',
  GROUP_BY_MONTH: 'Por mês',
  GROUP_BY_YEAR: 'Por ano',
  GROUP_BY_HOUR: 'Por hora'
}

export const CHART_TYPES: {
  value: ChartType
  label: string
  icon: string
}[] = [
  { value: 'BAR', label: 'Barras', icon: 'fa-solid fa-chart-column' },
  { value: 'LINE', label: 'Linha', icon: 'fa-solid fa-chart-line' },
  { value: 'AREA', label: 'Área', icon: 'fa-solid fa-chart-area' },
  { value: 'PIE', label: 'Pizza', icon: 'fa-solid fa-chart-pie' },
  { value: 'DOUGHNUT', label: 'Rosca', icon: 'fa-solid fa-circle-notch' },
  { value: 'HORIZONTAL_BAR', label: 'Barras H.', icon: 'fa-solid fa-bars-progress' },
  { value: 'RADAR', label: 'Radar', icon: 'fa-solid fa-bullseye' },
  { value: 'SCATTER', label: 'Dispersão', icon: 'fa-solid fa-braille' },
  { value: 'POLAR_AREA', label: 'Polar', icon: 'fa-solid fa-globe' }
]

export const FIELD_TYPE_ICONS: Record<FieldType, string> = {
  STRING: 'fa-solid fa-font',
  INTEGER: 'fa-solid fa-hashtag',
  LONG: 'fa-solid fa-hashtag',
  DECIMAL: 'fa-solid fa-dollar-sign',
  BOOLEAN: 'fa-solid fa-check',
  DATE: 'fa-solid fa-calendar',
  TIME: 'fa-solid fa-clock',
  DATETIME: 'fa-solid fa-calendar-days',
  INSTANT: 'fa-solid fa-stopwatch',
  UUID: 'fa-solid fa-key',
  ENUM: 'fa-solid fa-list',
  RELATION: 'fa-solid fa-link'
}

// Configuração padrão vazia
export function createEmptyQueryConfig(): QueryConfig {
  return {
    entityName: '',
    selectFields: [],
    filters: [],
    groupBy: [],
    orderBy: [],
    joins: [],
    limit: 1000
  }
}

export function createEmptyChartConfig(): ChartConfig {
  return {
    chartType: 'BAR',
    title: '',
    labelField: '',
    dataFields: [],
    showLegend: true,
    legendPosition: 'top'
  }
}
