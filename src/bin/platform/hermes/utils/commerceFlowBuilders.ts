export type VisualBuilderMode = 'condition' | 'process'

export type ConditionProvider =
  | 'order_value'
  | 'vendor'
  | 'channel'
  | 'shipping_country'
  | 'delivery_date'
  | 'installment_count'
  | 'payment_provider'
  | 'vendors_connected_to_stripe'

export interface ConditionProviderOption {
  id: ConditionProvider
  label: string
  description: string
}

export interface ConditionBuilderState {
  operator: string
  scope: string
  amount: number
  unit: 'major' | 'minor'
  vendorsAvailable: string[]
  channels: string[]
  countryIds: string[]
  operation: string
  method: string
  value: number
  paymentProvider: string
}

export interface ProcessStepDefinition {
  id: string
  code: string
  name: string
  type: string
  provider: string
  nextIds: string[]
}

export interface ProcessBlueprint {
  version: number
  startStepId: string | null
  steps: ProcessStepDefinition[]
}

const CONDITION_FIELDS = new Set(['conditionData'])
const PROCESS_FIELDS = new Set([
  'businessProcessData',
  'deliveryProcessData',
  'paymentProcessData',
  'invoiceProcessData'
])

export const conditionProviderOptions: ConditionProviderOption[] = [
  {
    id: 'order_value',
    label: 'Valor do pedido',
    description: 'Compara o total do pedido, produtos ou base pre-pagamento.'
  },
  {
    id: 'vendor',
    label: 'Vendor',
    description: 'Ativa quando algum vendor do carrinho estiver na lista.'
  },
  {
    id: 'channel',
    label: 'Canal',
    description: 'Restringe a condicao a canais como web, admin ou marketplace.'
  },
  {
    id: 'shipping_country',
    label: 'Pais de entrega',
    description: 'Valida o pais do endereco de entrega.'
  },
  {
    id: 'delivery_date',
    label: 'Data de entrega',
    description: 'Compara a data prevista de entrega com uma referencia relativa.'
  },
  {
    id: 'installment_count',
    label: 'Parcelamento',
    description: 'Valida a quantidade de parcelas selecionada.'
  },
  {
    id: 'payment_provider',
    label: 'Provider de pagamento',
    description: 'Restringe a condicao ao provider de pagamento selecionado.'
  },
  {
    id: 'vendors_connected_to_stripe',
    label: 'Vendors com Stripe',
    description: 'Exige vendors conectados ao Stripe no split.'
  }
]

const PROCESS_TEMPLATES: Record<string, { code: string; name: string; type: string }[]> = {
  businessProcessData: [
    { code: 'validate_order', name: 'Validar pedido', type: 'validation' },
    { code: 'route_payment', name: 'Encaminhar pagamento', type: 'payment' },
    { code: 'route_delivery', name: 'Encaminhar entrega', type: 'delivery' },
    { code: 'close_order', name: 'Encerrar pedido', type: 'finalization' }
  ],
  deliveryProcessData: [
    { code: 'prepare_delivery', name: 'Preparar entrega', type: 'preparation' },
    { code: 'dispatch', name: 'Despachar', type: 'dispatch' },
    { code: 'deliver', name: 'Concluir entrega', type: 'completion' }
  ],
  paymentProcessData: [
    { code: 'authorize_payment', name: 'Autorizar', type: 'authorization' },
    { code: 'capture_payment', name: 'Capturar', type: 'capture' },
    { code: 'settle_payment', name: 'Liquidar', type: 'settlement' }
  ],
  invoiceProcessData: [
    { code: 'generate_invoice', name: 'Gerar nota', type: 'generation' },
    { code: 'approve_invoice', name: 'Aprovar nota', type: 'approval' },
    { code: 'issue_invoice', name: 'Emitir nota', type: 'issuance' }
  ]
}

export function resolveVisualBuilderMode(code: string | undefined): VisualBuilderMode | null {
  if (!code) return null
  if (CONDITION_FIELDS.has(code)) return 'condition'
  if (PROCESS_FIELDS.has(code)) return 'process'
  return null
}

export function supportsVisualConditionProvider(provider: string | undefined): provider is ConditionProvider {
  if (!provider) return false
  return conditionProviderOptions.some((option) => option.id === provider)
}

export function createDefaultConditionState(provider?: string): ConditionBuilderState {
  switch (provider) {
    case 'vendor':
      return {
        operator: 'in',
        scope: 'order_total',
        amount: 0,
        unit: 'major',
        vendorsAvailable: [],
        channels: [],
        countryIds: [],
        operation: 'calendar_days',
        method: 'day',
        value: 1,
        paymentProvider: ''
      }
    case 'channel':
      return {
        operator: 'enable_in',
        scope: 'order_total',
        amount: 0,
        unit: 'major',
        vendorsAvailable: [],
        channels: ['web'],
        countryIds: [],
        operation: 'calendar_days',
        method: 'day',
        value: 1,
        paymentProvider: ''
      }
    case 'shipping_country':
      return {
        operator: 'in',
        scope: 'order_total',
        amount: 0,
        unit: 'major',
        vendorsAvailable: [],
        channels: [],
        countryIds: [],
        operation: 'calendar_days',
        method: 'day',
        value: 1,
        paymentProvider: ''
      }
    case 'delivery_date':
      return {
        operator: 'equal_to',
        scope: 'order_total',
        amount: 0,
        unit: 'major',
        vendorsAvailable: [],
        channels: [],
        countryIds: [],
        operation: 'calendar_days',
        method: 'day',
        value: 1,
        paymentProvider: ''
      }
    case 'installment_count':
      return {
        operator: 'equal_to',
        scope: 'order_total',
        amount: 0,
        unit: 'major',
        vendorsAvailable: [],
        channels: [],
        countryIds: [],
        operation: 'calendar_days',
        method: 'day',
        value: 1,
        paymentProvider: ''
      }
    case 'payment_provider':
      return {
        operator: 'equal_to',
        scope: 'order_total',
        amount: 0,
        unit: 'major',
        vendorsAvailable: [],
        channels: [],
        countryIds: [],
        operation: 'calendar_days',
        method: 'day',
        value: 1,
        paymentProvider: 'card'
      }
    default:
      return {
        operator: 'greater_or_equal',
        scope: 'order_total',
        amount: 0,
        unit: 'major',
        vendorsAvailable: [],
        channels: [],
        countryIds: [],
        operation: 'calendar_days',
        method: 'day',
        value: 1,
        paymentProvider: ''
      }
  }
}

export function parseConditionState(provider: string | undefined, raw: string | null | undefined): ConditionBuilderState {
  const fallback = createDefaultConditionState(provider)
  if (!raw || !raw.trim()) {
    return fallback
  }

  try {
    const parsed = JSON.parse(raw)
    switch (provider) {
      case 'order_value': {
        const rawValue = typeof parsed?.value === 'object' && parsed?.value !== null
          ? Number(parsed.value.amount ?? 0)
          : Number(parsed?.value ?? 0)
        const unit = typeof parsed?.value === 'object' && parsed?.value !== null
          ? parsed.value.unit ?? 'major'
          : 'major'
        return {
          ...fallback,
          operator: parsed?.operator ?? fallback.operator,
          scope: parsed?.scope ?? fallback.scope,
          amount: Number.isFinite(rawValue) ? rawValue : 0,
          unit: unit === 'minor' ? 'minor' : 'major'
        }
      }
      case 'vendor':
        return {
          ...fallback,
          vendorsAvailable: normalizeStringArray(parsed?.vendorsAvailable)
        }
      case 'channel':
        return {
          ...fallback,
          operator: parsed?.operator ?? fallback.operator,
          channels: normalizeStringArray(parsed?.channels)
        }
      case 'shipping_country':
        return {
          ...fallback,
          countryIds: normalizeStringArray(parsed?.countryIds)
        }
      case 'delivery_date':
        return {
          ...fallback,
          operator: parsed?.operator ?? fallback.operator,
          operation: parsed?.operation ?? fallback.operation,
          method: parsed?.method ?? fallback.method,
          value: Number(parsed?.value ?? fallback.value)
        }
      case 'installment_count':
        return {
          ...fallback,
          operator: parsed?.operator ?? fallback.operator,
          value: Number(parsed?.value ?? fallback.value)
        }
      case 'payment_provider':
        return {
          ...fallback,
          paymentProvider: parsed?.provider ?? fallback.paymentProvider
        }
      case 'vendors_connected_to_stripe':
        return fallback
      default:
        return fallback
    }
  } catch {
    return fallback
  }
}

export function serializeConditionState(provider: string | undefined, state: ConditionBuilderState): string {
  if (!provider) {
    return '{}'
  }

  let payload: Record<string, unknown>
  switch (provider) {
    case 'order_value':
      payload = {
        operator: state.operator,
        scope: state.scope,
        value: {
          amount: Number.isFinite(state.amount) ? state.amount : 0,
          unit: state.unit
        }
      }
      break
    case 'vendor':
      payload = {
        vendorsAvailable: normalizeStringArray(state.vendorsAvailable)
      }
      break
    case 'channel':
      payload = {
        operator: state.operator,
        channels: normalizeStringArray(state.channels)
      }
      break
    case 'shipping_country':
      payload = {
        countryIds: normalizeStringArray(state.countryIds)
      }
      break
    case 'delivery_date':
      payload = {
        operator: state.operator,
        operation: state.operation,
        method: state.method,
        value: Number.isFinite(state.value) ? state.value : 0
      }
      break
    case 'installment_count':
      payload = {
        operator: state.operator,
        value: Number.isFinite(state.value) ? state.value : 1
      }
      break
    case 'payment_provider':
      payload = {
        provider: state.paymentProvider
      }
      break
    case 'vendors_connected_to_stripe':
      payload = {}
      break
    default:
      payload = {}
  }

  return JSON.stringify(payload, null, 2)
}

export function createDefaultProcessBlueprint(code: string): ProcessBlueprint {
  const templates = PROCESS_TEMPLATES[code] ?? [
    { code: 'start', name: 'Inicio', type: 'start' },
    { code: 'finish', name: 'Fim', type: 'finish' }
  ]
  const steps = templates.map((template, index) => ({
    id: createNodeId(index + 1),
    code: template.code,
    name: template.name,
    type: template.type,
    provider: '',
    nextIds: [] as string[]
  }))

  steps.forEach((step, index) => {
    if (index < steps.length - 1) {
      step.nextIds = [steps[index + 1].id]
    }
  })

  return {
    version: 1,
    startStepId: steps[0]?.id ?? null,
    steps
  }
}

export function parseProcessBlueprint(code: string, raw: string | null | undefined): ProcessBlueprint {
  const fallback = createDefaultProcessBlueprint(code)
  if (!raw || !raw.trim()) {
    return fallback
  }

  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed?.steps)) {
      return fallback
    }
    const steps = parsed.steps
      .filter((step: any) => step && typeof step === 'object')
      .map((step: any, index: number) => ({
        id: typeof step.id === 'string' && step.id ? step.id : createNodeId(index + 1),
        code: typeof step.code === 'string' && step.code ? step.code : `step_${index + 1}`,
        name: typeof step.name === 'string' && step.name ? step.name : `Etapa ${index + 1}`,
        type: typeof step.type === 'string' && step.type ? step.type : 'custom',
        provider: typeof step.provider === 'string' ? step.provider : '',
        nextIds: normalizeStringArray(step.nextIds)
      }))

    if (steps.length === 0) {
      return fallback
    }

    return {
      version: Number(parsed?.version ?? 1),
      startStepId:
        typeof parsed?.startStepId === 'string' && steps.some((step) => step.id === parsed.startStepId)
          ? parsed.startStepId
          : steps[0].id,
      steps
    }
  } catch {
    return fallback
  }
}

export function serializeProcessBlueprint(blueprint: ProcessBlueprint): string {
  return JSON.stringify(
    {
      version: blueprint.version,
      startStepId: blueprint.startStepId,
      steps: blueprint.steps.map((step) => ({
        id: step.id,
        code: step.code,
        name: step.name,
        type: step.type,
        provider: step.provider,
        nextIds: normalizeStringArray(step.nextIds)
      }))
    },
    null,
    2
  )
}

export function processStepTypeOptions(code: string): string[] {
  const templates = PROCESS_TEMPLATES[code] ?? []
  return Array.from(new Set(['custom', ...templates.map((item) => item.type)]))
}

export function createEmptyProcessStep(code: string, index: number): ProcessStepDefinition {
  return {
    id: createNodeId(index + 1),
    code: `step_${index + 1}`,
    name: `Etapa ${index + 1}`,
    type: processStepTypeOptions(code)[0] ?? 'custom',
    provider: '',
    nextIds: []
  }
}

function createNodeId(seed: number): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `node_${seed}_${Math.random().toString(36).slice(2, 10)}`
}

function normalizeStringArray(input: unknown): string[] {
  if (!Array.isArray(input)) {
    return []
  }
  return input
    .map((item) => String(item ?? '').trim())
    .filter((item, index, array) => item.length > 0 && array.indexOf(item) === index)
}
