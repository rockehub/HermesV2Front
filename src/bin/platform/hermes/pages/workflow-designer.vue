<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { $axios } from '@/helpers/integration/integration'
import { newInstance } from '@jsplumb/browser-ui'
import type { BrowserJsPlumbInstance } from '@jsplumb/browser-ui'

import DefaultLayout from '@/bin/platform/hermes/layouts/default.vue'

type WorkflowNodeType = 'START' | 'ACTION' | 'DECISION' | 'WAIT' | 'END' | 'FAILURE'
type WorkflowExecutionState = 'PENDING' | 'RUNNING' | 'WAITING' | 'COMPLETED' | 'FAILED'
type WorkflowStepState = 'RUNNING' | 'WAITING' | 'COMPLETED' | 'FAILED' | 'SKIPPED'

type WorkflowExecutionDto = {
  id: string
  ownerId: string | null
  ownerType: string | null
  state: WorkflowExecutionState
  currentNodeCode: string | null
  parentExecutionId: string | null
  startedAt: string | null
  finishedAt: string | null
  wakeUpAt: string | null
  errorMessage: string | null
}

type WorkflowExecutionStepDto = {
  id: string
  nodeCode: string
  nodeType: WorkflowNodeType
  handler: string | null
  state: WorkflowStepState
  attempt: number
  transitionKey: string | null
  message: string | null
  startedAt: string | null
  finishedAt: string | null
}

type WorkflowOwnerType = 'ORDER' | 'INVOICE' | 'DELIVERY' | 'GENERIC' | 'PAYMENT'

type HandlerEntry = {
  code: string
  label: string
  nodeType: WorkflowNodeType
  ownerTypes: WorkflowOwnerType[]
  configSchema: 'none' | 'delay' | 'subworkflow'
  transitionKeys?: string[]
}

const handlerRegistry = ref<HandlerEntry[]>([])

type NodeConnectionRule = {
  maxOutgoing: number // -1 = unlimited
  maxIncoming: number // -1 = unlimited
  allowedTargetTypes: WorkflowNodeType[] | null // null = all allowed
}

const NODE_CONNECTION_RULES: Record<WorkflowNodeType, NodeConnectionRule> = {
  START: { maxOutgoing: 1, maxIncoming: 0, allowedTargetTypes: null },
  END: { maxOutgoing: 0, maxIncoming: -1, allowedTargetTypes: [] },
  FAILURE: { maxOutgoing: 0, maxIncoming: -1, allowedTargetTypes: [] },
  ACTION: {
    maxOutgoing: 2,
    maxIncoming: -1,
    allowedTargetTypes: ['ACTION', 'DECISION', 'WAIT', 'END', 'FAILURE']
  },
  WAIT: {
    maxOutgoing: 1,
    maxIncoming: -1,
    allowedTargetTypes: ['ACTION', 'DECISION', 'WAIT', 'END', 'FAILURE']
  },
  DECISION: {
    maxOutgoing: 2,
    maxIncoming: -1,
    allowedTargetTypes: ['ACTION', 'DECISION', 'WAIT', 'END', 'FAILURE']
  }
}

type WorkflowDefinitionSummary = {
  id: string
  code: string
  name: string
  ownerType: WorkflowOwnerType
  version: number
  active: boolean
}

type WorkflowGraphNode = {
  id?: string | null
  code: string
  name: string
  type: WorkflowNodeType
  handler: string
  configData: string
  retryLimit: number
  retryDelaySeconds: number
  continueOnFailure: boolean
  sortOrder: number
  posX: number | null
  posY: number | null
}

type WorkflowGraphEdge = {
  id?: string | null
  sourceNodeCode: string
  targetNodeCode: string
  transitionKey: string
  priority: number
  conditionData: string
}

type WorkflowGraphResponse = {
  definitionId: string
  code: string
  name: string
  version: number
  active: boolean
  nodes: WorkflowGraphNode[]
  edges: WorkflowGraphEdge[]
}

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const saving = ref(false)
const connectionError = ref<string | null>(null)
const validationErrors = ref<string[]>([])
let errorTimer: ReturnType<typeof setTimeout> | null = null
const definitions = ref<WorkflowDefinitionSummary[]>([])
const nodes = ref<WorkflowGraphNode[]>([])
const edges = ref<WorkflowGraphEdge[]>([])
const selectedNodeCode = ref<string | null>(null)
const selectedEdgeKey = ref<string | null>(null)
const canvasRef = ref<HTMLElement | null>(null)
const stageRef = ref<HTMLElement | null>(null)
const jsPlumbInstance = ref<BrowserJsPlumbInstance | null>(null)
const suppressJsPlumbEvents = ref(false)
const zoomLevel = ref(1)
const selectedNodeCodes = ref<string[]>([])
const panState = ref<{
  startClientX: number
  startClientY: number
  startScrollLeft: number
  startScrollTop: number
} | null>(null)
const dragState = ref<
  | {
      mode: 'nodes'
      originClientX: number
      originClientY: number
      codes: string[]
      initialPositions: Record<string, { x: number; y: number }>
    }
  | {
      mode: 'marquee'
      startX: number
      startY: number
      currentX: number
      currentY: number
    }
  | null
>(null)
const transientSourceCode = ref('')
const transientTargetCode = ref('')

const sidebarCollapsed = ref(false)
const showCreateModal = ref(false)
const createModalOwnerType = ref<WorkflowOwnerType>('ORDER')
const createModalCode = ref('')
const createModalName = ref('')
const createModalLoading = ref(false)
const editingDefinitionName = ref(false)
const editingNameValue = ref('')

const OWNER_TYPES: WorkflowOwnerType[] = ['ORDER', 'INVOICE', 'DELIVERY', 'PAYMENT', 'GENERIC']

const activeTab = ref<'designer' | 'execucoes'>('designer')
const executions = ref<WorkflowExecutionDto[]>([])
const executionTotal = ref(0)
const executionPage = ref(0)
const executionsLoading = ref(false)
const expandedExecutionId = ref<string | null>(null)
const executionSteps = ref<Record<string, WorkflowExecutionStepDto[]>>({})
const executionStepsLoading = ref<Record<string, boolean>>({})
const executionActionLoading = ref<Record<string, boolean>>({})

const nodeTypes: WorkflowNodeType[] = ['START', 'ACTION', 'DECISION', 'WAIT', 'END', 'FAILURE']

const NODE_TYPE_STYLES: Record<
  WorkflowNodeType,
  { bg: string; border: string; badge: string; dot: string }
> = {
  START: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-400',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-800 dark:text-emerald-200',
    dot: 'bg-emerald-400'
  },
  ACTION: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-400',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-200',
    dot: 'bg-blue-400'
  },
  DECISION: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-400',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-800 dark:text-amber-200',
    dot: 'bg-amber-400'
  },
  WAIT: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-400',
    badge: 'bg-purple-100 text-purple-700 dark:bg-purple-800 dark:text-purple-200',
    dot: 'bg-purple-400'
  },
  END: {
    bg: 'bg-slate-100 dark:bg-slate-800/40',
    border: 'border-slate-400',
    badge: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
    dot: 'bg-slate-400'
  },
  FAILURE: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-400',
    badge: 'bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-200',
    dot: 'bg-red-400'
  }
}

const selectedDefinitionId = computed(() => {
  const id = route.params.id
  return typeof id === 'string' && id.length > 0 ? id : null
})

const selectedDefinition = computed(
  () => definitions.value.find((definition) => definition.id === selectedDefinitionId.value) ?? null
)

const definitionsByOwnerType = computed(() => {
  const groups: Record<WorkflowOwnerType, WorkflowDefinitionSummary[]> = {
    ORDER: [],
    INVOICE: [],
    DELIVERY: [],
    PAYMENT: [],
    GENERIC: []
  }
  for (const def of definitions.value) {
    const type = def.ownerType ?? 'ORDER'
    if (groups[type]) groups[type].push(def)
  }
  return groups
})

const filteredHandlers = computed(() => {
  const ownerType = selectedDefinition.value?.ownerType ?? 'ORDER'
  return handlerRegistry.value.filter((h) => h.ownerTypes.includes(ownerType))
})

const selectedNode = computed(
  () => nodes.value.find((node) => node.code === selectedNodeCode.value) ?? null
)

const selectedEdge = computed(
  () => edges.value.find((edge) => edgeKey(edge) === selectedEdgeKey.value) ?? null
)

const selectedNodeConfigSchema = computed((): 'none' | 'delay' | 'subworkflow' => {
  if (!selectedNode.value?.handler) return 'none'
  return findHandlerEntry(selectedNode.value!.handler)?.configSchema ?? 'none'
})

type ConditionForm = {
  requiresShipping: '' | 'true' | 'false'
  invoiceRequired: '' | 'true' | 'false'
  paymentStateIn: string[]
  deliveryStateIn: string[]
  invoiceStateIn: string[]
  orderSourceIn: string[]
}
const PAYMENT_STATES = ['PENDING', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'CANCELLED']
const DELIVERY_STATES = [
  'PENDING',
  'READY_FOR_FULFILLMENT',
  'IN_FULFILLMENT',
  'SHIPPED',
  'DELIVERED',
  'FAILED'
]
const INVOICE_STATES = ['PENDING', 'AUTHORIZED', 'ISSUED', 'FAILED']
const ORDER_SOURCES = ['ECOMMERCE', 'MARKETPLACE', 'MANUAL']

function emptyConditionForm(): ConditionForm {
  return {
    requiresShipping: '',
    invoiceRequired: '',
    paymentStateIn: [],
    deliveryStateIn: [],
    invoiceStateIn: [],
    orderSourceIn: []
  }
}
const conditionForm = ref<ConditionForm>(emptyConditionForm())

const selectedEdgeTransitionSuggestions = computed((): string[] => {
  if (!selectedEdge.value) return []
  const src = nodes.value.find((n) => n.code === selectedEdge.value!.sourceNodeCode)
  if (!src?.handler) return []
  return findHandlerEntry(src.handler)?.transitionKeys ?? []
})

const DEFAULT_NODE_WIDTH = 220
const DEFAULT_NODE_HEIGHT = 96
const DECISION_NODE_SIZE = 180
const MIN_STAGE_WIDTH = 2600
const MIN_STAGE_HEIGHT = 1600

function nodeDimensions(node: Pick<WorkflowGraphNode, 'type'>): { width: number; height: number } {
  if (node.type === 'DECISION') {
    return { width: DECISION_NODE_SIZE, height: DECISION_NODE_SIZE }
  }
  return { width: DEFAULT_NODE_WIDTH, height: DEFAULT_NODE_HEIGHT }
}

const nodeCenters = computed(() => {
  const result: Record<string, { x: number; y: number }> = {}
  nodes.value.forEach((node) => {
    const { width, height } = nodeDimensions(node)
    result[node.code] = {
      x: (node.posX ?? 80) + width / 2,
      y: (node.posY ?? 80) + height / 2
    }
  })
  return result
})

const stageSize = computed(() => {
  const width = nodes.value.reduce((maxWidth, node) => {
    const { width: nodeWidth } = nodeDimensions(node)
    return Math.max(maxWidth, (node.posX ?? 80) + nodeWidth + 240)
  }, MIN_STAGE_WIDTH)

  const height = nodes.value.reduce((maxHeight, node) => {
    const { height: nodeHeight } = nodeDimensions(node)
    return Math.max(maxHeight, (node.posY ?? 80) + nodeHeight + 240)
  }, MIN_STAGE_HEIGHT)

  return {
    width: Math.max(MIN_STAGE_WIDTH, Math.ceil(width)),
    height: Math.max(MIN_STAGE_HEIGHT, Math.ceil(height))
  }
})

const marqueeSelectionBox = computed(() => {
  if (!dragState.value || dragState.value.mode !== 'marquee') return null
  const left = Math.min(dragState.value.startX, dragState.value.currentX)
  const top = Math.min(dragState.value.startY, dragState.value.currentY)
  return {
    left,
    top,
    width: Math.abs(dragState.value.currentX - dragState.value.startX),
    height: Math.abs(dragState.value.currentY - dragState.value.startY)
  }
})

const svgEdges = computed(
  () =>
    edges.value
      .map((edge) => {
        const source = nodeCenters.value[edge.sourceNodeCode]
        const target = nodeCenters.value[edge.targetNodeCode]
        if (!source || !target) return null
        return {
          key: edgeKey(edge),
          edge,
          curve: buildCurve(source.x, source.y, target.x, target.y),
          midX: (source.x + target.x) / 2,
          midY: (source.y + target.y) / 2
        }
      })
      .filter(Boolean) as Array<{
      key: string
      edge: WorkflowGraphEdge
      curve: string
      midX: number
      midY: number
    }>
)

function edgeKey(edge: WorkflowGraphEdge): string {
  return `${edge.sourceNodeCode}=>${edge.targetNodeCode}:${edge.transitionKey || ''}`
}

function nodeElementId(code: string): string {
  return `workflow-node-${code}`
}

function extractNodeCode(nodeId?: string | null): string {
  if (!nodeId) return ''
  return nodeId.replace(/^workflow-node-/, '')
}

function normalizeDefinition(item: any): WorkflowDefinitionSummary {
  return {
    id: String(item.id),
    code: String(item.code ?? ''),
    name: String(item.name ?? item.code ?? ''),
    ownerType: (item.ownerType ?? 'ORDER') as WorkflowOwnerType,
    version: Number(item.version ?? 1),
    active: Boolean(item.active)
  }
}

function findHandlerEntry(code?: string | null) {
  return handlerRegistry.value.find((entry) => entry.code === code)
}

async function loadHandlerRegistry() {
  const response = await $axios.get<HandlerEntry[]>('/api/v1/admin/workflows/handlers')
  handlerRegistry.value = Array.isArray(response.data) ? response.data : []
}

function buildCurve(x1: number, y1: number, x2: number, y2: number): string {
  const delta = Math.max(80, Math.abs(x2 - x1) / 2)
  return `M ${x1} ${y1} C ${x1 + delta} ${y1}, ${x2 - delta} ${y2}, ${x2} ${y2}`
}

function parseJson(value: string): string {
  if (!value || !value.trim()) return '{}'
  return value
}

function ensureUniqueCode(base: string): string {
  let code = base
  let index = 2
  while (nodes.value.some((node) => node.code === code)) {
    code = `${base}_${index}`
    index += 1
  }
  return code
}

function resolveConnectionPayload(payload: any): { sourceCode: string; targetCode: string } {
  const sourceId = payload?.sourceId ?? payload?.source?.id ?? ''
  const targetId = payload?.targetId ?? payload?.target?.id ?? ''
  return {
    sourceCode: extractNodeCode(sourceId),
    targetCode: extractNodeCode(targetId)
  }
}

function updateNodePositionFromElement(code: string) {
  const element = document.getElementById(nodeElementId(code)) as HTMLElement | null
  const node = nodes.value.find((item) => item.code === code)
  if (!element || !node) return
  node.posX = parseInt(element.style.left || '0', 10)
  node.posY = parseInt(element.style.top || '0', 10)
}

function selectEdgeByConnection(connection: any) {
  // jsPlumb click fires (connection, e) — first arg is the Connection object,
  // which has .sourceId / .targetId directly (not wrapped in a payload object).
  const sourceId = connection?.sourceId ?? connection?.source?.id ?? ''
  const targetId = connection?.targetId ?? connection?.target?.id ?? ''
  const sourceCode = extractNodeCode(sourceId)
  const targetCode = extractNodeCode(targetId)
  if (!sourceCode || !targetCode) return
  const edge = edges.value.find(
    (item) => item.sourceNodeCode === sourceCode && item.targetNodeCode === targetCode
  )
  if (!edge) return
  selectedEdgeKey.value = edgeKey(edge)
  selectedNodeCode.value = null
}

function destroyJsPlumbInstance() {
  if (!jsPlumbInstance.value) return
  try {
    jsPlumbInstance.value.reset?.()
    jsPlumbInstance.value.destroy?.()
  } catch (error) {
    console.warn('workflow jsPlumb destroy failed', error)
  }
  jsPlumbInstance.value = null
}

function isNodeSelected(code: string): boolean {
  return selectedNodeCodes.value.includes(code) || selectedNodeCode.value === code
}

function setSelectedNodes(codes: string[], activeCode?: string | null) {
  const uniqueCodes = Array.from(new Set(codes.filter(Boolean)))
  selectedNodeCodes.value = uniqueCodes
  selectedNodeCode.value =
    activeCode && uniqueCodes.includes(activeCode) ? activeCode : (uniqueCodes[0] ?? null)
  if (uniqueCodes.length > 0) {
    selectedEdgeKey.value = null
  }
}

function clearNodeSelection() {
  selectedNodeCodes.value = []
  selectedNodeCode.value = null
}

function canvasPointFromClient(clientX: number, clientY: number) {
  const canvas = canvasRef.value
  if (!canvas) return { x: 0, y: 0 }
  const rect = canvas.getBoundingClientRect()
  return {
    x: (clientX - rect.left + canvas.scrollLeft) / zoomLevel.value,
    y: (clientY - rect.top + canvas.scrollTop) / zoomLevel.value
  }
}

async function repaintCanvas() {
  await nextTick()
  if (!jsPlumbInstance.value) return
  jsPlumbInstance.value.setZoom?.(zoomLevel.value)
  jsPlumbInstance.value.repaintEverything?.()
}

function setZoom(nextZoom: number) {
  zoomLevel.value = Math.min(2, Math.max(0.5, Math.round(nextZoom * 100) / 100))
}

function beginPan(event: MouseEvent) {
  if (event.button !== 1 || !canvasRef.value) return
  event.preventDefault()
  panState.value = {
    startClientX: event.clientX,
    startClientY: event.clientY,
    startScrollLeft: canvasRef.value.scrollLeft,
    startScrollTop: canvasRef.value.scrollTop
  }
}

async function renderJsPlumbGraph() {
  if (!canvasRef.value || !stageRef.value) return
  await nextTick()
  destroyJsPlumbInstance()

  // jsPlumb.destroy() resets managed element styles (transform/position) without
  // notifying Vue. Re-apply positions directly so the new instance finds nodes
  // at the correct coordinates.
  nodes.value.forEach((node) => {
    const el = document.getElementById(nodeElementId(node.code))
    if (!el) return
    el.style.position = 'absolute'
    el.style.left = `${node.posX ?? 80}px`
    el.style.top = `${node.posY ?? 80}px`
  })

  const container = stageRef.value

  let instance: BrowserJsPlumbInstance
  try {
    instance = newInstance({
      container,
      dragOptions: {
        stop: (params: any) => {
          const code = extractNodeCode(params.el?.id)
          if (!code) return
          const node = nodes.value.find((n) => n.code === code)
          if (!node) return
          const x = params.finalPos?.x ?? params.pos?.x
          const y = params.finalPos?.y ?? params.pos?.y
          if (x !== undefined) node.posX = Math.round(x)
          if (y !== undefined) node.posY = Math.round(y)
        }
      }
    })
  } catch (err) {
    console.error('workflow: falha ao criar instância jsPlumb', err)
    return
  }

  instance.importDefaults({
    connector: { type: 'Bezier', options: { curviness: 50 } } as any,
    paintStyle: {
      stroke: '#6366f1',
      strokeWidth: 2,
      outlineStroke: 'transparent',
      outlineWidth: 12
    } as any,
    hoverPaintStyle: {
      stroke: '#4f46e5',
      strokeWidth: 3,
      outlineStroke: 'transparent',
      outlineWidth: 12
    } as any,
    endpointStyle: { fill: '#6366f1', outlineStroke: '#fff', outlineWidth: 2 } as any,
    endpointHoverStyle: { fill: '#4f46e5' } as any
  })

  jsPlumbInstance.value = instance
  instance.setZoom?.(zoomLevel.value)

  // ── Eventos de conexão ──────────────────────────────────────────────────
  instance.bind('connection', (payload: any) => {
    if (suppressJsPlumbEvents.value) return
    const { sourceCode, targetCode } = resolveConnectionPayload(payload)
    if (!sourceCode || !targetCode) return

    const connError = validateConnection(sourceCode, targetCode)
    if (connError) {
      suppressJsPlumbEvents.value = true
      try {
        instance.deleteConnection(payload.connection)
      } catch {
        /* ignore */
      }
      suppressJsPlumbEvents.value = false
      showConnectionError(connError)
      return
    }

    const portEl = (payload?.sourceEndpoint?.element ??
      payload?.sourceEndpoint?.el) as HTMLElement | null
    let transitionKey = ''
    if (portEl) {
      const srcNode = nodes.value.find((n) => n.code === sourceCode)
      const handler = findHandlerEntry(srcNode?.handler)
      if (portEl.classList.contains('node-port--true')) {
        transitionKey = handler?.transitionKeys?.[0] ?? ''
      } else if (portEl.classList.contains('node-port--false')) {
        transitionKey = handler?.transitionKeys?.[1] ?? ''
      }
    }

    const edge: WorkflowGraphEdge = {
      id: null,
      sourceNodeCode: sourceCode,
      targetNodeCode: targetCode,
      transitionKey,
      priority: edges.value.length,
      conditionData: '{}'
    }
    if (edges.value.some((item) => edgeKey(item) === edgeKey(edge))) return
    edges.value = [...edges.value, edge]
    selectedEdgeKey.value = edgeKey(edge)
    selectedNodeCode.value = null
  })

  // 'connection:detach' fires when an endpoint is dropped on empty space (true detach)
  instance.bind('connection:detach', (payload: any) => {
    if (suppressJsPlumbEvents.value) return
    const { sourceCode, targetCode } = resolveConnectionPayload(payload)
    if (!sourceCode || !targetCode) return

    const portEl = (payload?.sourceEndpoint?.element ??
      payload?.sourceEndpoint?.el) as HTMLElement | null
    let removedKey = ''
    if (portEl) {
      const srcNode = nodes.value.find((n) => n.code === sourceCode)
      const handler = findHandlerEntry(srcNode?.handler)
      if (portEl.classList.contains('node-port--true')) {
        removedKey = handler?.transitionKeys?.[0] ?? ''
      } else if (portEl.classList.contains('node-port--false')) {
        removedKey = handler?.transitionKeys?.[1] ?? ''
      }
    }

    edges.value = edges.value.filter(
      (edge) =>
        !(
          edge.sourceNodeCode === sourceCode &&
          edge.targetNodeCode === targetCode &&
          edge.transitionKey === removedKey
        )
    )
    if (
      selectedEdge.value?.sourceNodeCode === sourceCode &&
      selectedEdge.value?.targetNodeCode === targetCode &&
      selectedEdge.value?.transitionKey === removedKey
    ) {
      selectedEdgeKey.value = null
    }
  })

  // 'connection:move' fires when an endpoint is dragged from one node to another
  instance.bind('connection:move', (payload: any) => {
    if (suppressJsPlumbEvents.value) return
    const origSrcCode = extractNodeCode(payload?.originalSourceId ?? '')
    const origTgtCode = extractNodeCode(payload?.originalTargetId ?? '')
    const newSrcCode = extractNodeCode(payload?.newSourceId ?? '')
    const newTgtCode = extractNodeCode(payload?.newTargetId ?? '')

    // Find the edge being moved (match by original source+target)
    const edge = edges.value.find(
      (e) =>
        e.sourceNodeCode === (origSrcCode || newSrcCode) &&
        e.targetNodeCode === (origTgtCode || newTgtCode)
    )
    if (edge) {
      if (newSrcCode) edge.sourceNodeCode = newSrcCode
      if (newTgtCode) edge.targetNodeCode = newTgtCode
      // Keep selected edge key in sync
      selectedEdgeKey.value = edgeKey(edge)
    }
  })

  // 'connection:click' is the correct event name for clicking a connection line
  instance.bind('connection:click', (connection: any) => {
    selectEdgeByConnection(connection)
  })

  // ── Registrar cada nó para drag ─────────────────────────────────────────
  nodes.value.forEach((node) => {
    const el = document.getElementById(nodeElementId(node.code)) as HTMLElement | null
    if (!el) return
    instance.manage(el)
  })

  // ── Conexões iniciam no handle .node-port (evita conflito com drag do nó) ─
  instance.addSourceSelector('.node-port', {
    anchor: 'Bottom' as any,
    maxConnections: -1,
    endpoint: { type: 'Dot', options: { radius: 5 } } as any,
    paintStyle: { fill: '#6366f1', outlineStroke: '#fff', outlineWidth: 2 } as any,
    hoverPaintStyle: { fill: '#4f46e5' } as any,
    connectionsDetachable: true
  })

  // ── Qualquer ponto do nó aceita conexões como destino ───────────────────
  instance.addTargetSelector('.workflow-node', {
    anchor: 'Top' as any,
    maxConnections: -1,
    endpoint: { type: 'Dot', options: { radius: 5 } } as any,
    paintStyle: { fill: '#818cf8', outlineStroke: '#fff', outlineWidth: 2 } as any,
    hoverPaintStyle: { fill: '#6366f1' } as any
  })

  // ── Desenhar arestas existentes ─────────────────────────────────────────
  suppressJsPlumbEvents.value = true
  edges.value.forEach((edge) => {
    const source = document.getElementById(nodeElementId(edge.sourceNodeCode))
    const target = document.getElementById(nodeElementId(edge.targetNodeCode))
    if (!source || !target) return
    try {
      instance.connect({
        source,
        target,
        detachable: true,
        anchors: ['Bottom', 'Top'] as any,
        overlays: [
          { type: 'Arrow', options: { location: 1, width: 12, length: 10, foldback: 0.8 } },
          ...(edge.transitionKey
            ? [
                {
                  type: 'Label',
                  options: { label: edge.transitionKey, cssClass: 'workflow-edge-label' }
                }
              ]
            : [])
        ] as any[]
      })
    } catch (err) {
      console.warn(
        'workflow: falha ao conectar',
        edge.sourceNodeCode,
        '->',
        edge.targetNodeCode,
        err
      )
    }
  })
  suppressJsPlumbEvents.value = false

  instance.repaintEverything?.()
}

async function loadDefinitions() {
  const response = await $axios.get('/api/v1/admin/workflows/definitions')
  const rawDefinitions = Array.isArray(response.data) ? response.data : []
  definitions.value = rawDefinitions.map(normalizeDefinition)
}

async function openCreateModal(ownerType: WorkflowOwnerType) {
  createModalOwnerType.value = ownerType
  createModalCode.value = ''
  createModalName.value = ''
  showCreateModal.value = true
}

async function confirmCreateDefinition() {
  if (!createModalCode.value || !createModalName.value) return
  createModalLoading.value = true
  try {
    const response = await $axios.post('/api/v1/admin/workflows/definitions', {
      code: createModalCode.value,
      name: createModalName.value,
      ownerType: createModalOwnerType.value
    })
    await Promise.all([loadDefinitions(), loadHandlerRegistry()])
    showCreateModal.value = false
    await router.push({ name: 'workflow-designer', params: { id: response.data.id } })
  } finally {
    createModalLoading.value = false
  }
}

async function saveDefinitionMeta(active?: boolean) {
  if (!selectedDefinitionId.value) return
  const body: Record<string, unknown> = {}
  if (editingNameValue.value) body.name = editingNameValue.value
  if (active !== undefined) body.active = active
  await $axios.patch(`/api/v1/admin/workflows/definitions/${selectedDefinitionId.value}`, body)
  await Promise.all([loadDefinitions(), loadHandlerRegistry()])
  editingDefinitionName.value = false
}

async function loadGraph(definitionId: string) {
  loading.value = true
  try {
    const response = await $axios.get<WorkflowGraphResponse>(
      `/api/v1/admin/workflows/definitions/${definitionId}/graph`
    )
    nodes.value = (response.data.nodes ?? []).map((node, index) => ({
      ...node,
      configData: parseJson(node.configData),
      posX: node.posX ?? 80 + (index % 4) * 260,
      posY: node.posY ?? 80 + Math.floor(index / 4) * 160
    }))
    edges.value = (response.data.edges ?? []).map((edge) => ({
      ...edge,
      conditionData: parseJson(edge.conditionData)
    }))
    setSelectedNodes(nodes.value[0] ? [nodes.value[0].code] : [], nodes.value[0]?.code ?? null)
    selectedEdgeKey.value = null
    transientSourceCode.value = selectedNodeCode.value ?? ''
    transientTargetCode.value = ''
    await renderJsPlumbGraph()
  } finally {
    loading.value = false
  }
}

async function saveGraph() {
  if (!selectedDefinitionId.value) return
  validationErrors.value = validateGraph()
  if (validationErrors.value.length > 0) return
  saving.value = true
  try {
    const response = await $axios.put<WorkflowGraphResponse>(
      `/api/v1/admin/workflows/definitions/${selectedDefinitionId.value}/graph`,
      {
        nodes: nodes.value.map((node, index) => ({
          ...node,
          sortOrder: index,
          configData: parseJson(node.configData)
        })),
        edges: edges.value.map((edge) => ({
          ...edge,
          conditionData: parseJson(edge.conditionData)
        }))
      }
    )
    // Update IDs assigned by the server without re-rendering jsPlumb.
    // Calling loadGraph here would destroy/recreate the jsPlumb instance,
    // causing nodes to lose their visual positions.
    const savedNodes = response.data.nodes ?? []
    const savedEdges = response.data.edges ?? []
    nodes.value.forEach((node) => {
      const saved = savedNodes.find((n) => n.code === node.code)
      if (saved?.id) node.id = saved.id
    })
    edges.value.forEach((edge) => {
      const saved = savedEdges.find(
        (e) =>
          e.sourceNodeCode === edge.sourceNodeCode &&
          e.targetNodeCode === edge.targetNodeCode &&
          e.transitionKey === edge.transitionKey
      )
      if (saved?.id) edge.id = saved.id
    })
  } finally {
    saving.value = false
  }
}

function selectDefinition(id: string) {
  router.push({ name: 'workflow-designer', params: { id } })
}

async function addNode(type: WorkflowNodeType = 'ACTION', posX?: number, posY?: number) {
  const code = ensureUniqueCode(type.toLowerCase())
  nodes.value.push({
    id: null,
    code,
    name: code,
    type,
    handler: '',
    configData: '{}',
    retryLimit: 0,
    retryDelaySeconds: 0,
    continueOnFailure: false,
    sortOrder: nodes.value.length,
    posX: posX ?? 80 + (nodes.value.length % 4) * 260,
    posY: posY ?? 80 + Math.floor(nodes.value.length / 4) * 160
  })
  setSelectedNodes([code], code)
  transientSourceCode.value = code
  await nextTick()
  if (jsPlumbInstance.value) {
    const el = document.getElementById(nodeElementId(code)) as HTMLElement | null
    if (el) jsPlumbInstance.value.manage(el)
    await repaintCanvas()
  } else {
    await renderJsPlumbGraph()
  }
}

async function removeSelectedNode() {
  const codes = selectedNodeCodes.value.length
    ? [...selectedNodeCodes.value]
    : selectedNode.value
      ? [selectedNode.value.code]
      : []
  if (!codes.length) return
  if (jsPlumbInstance.value) {
    suppressJsPlumbEvents.value = true
    for (const code of codes) {
      const el = document.getElementById(nodeElementId(code)) as HTMLElement | null
      if (el) jsPlumbInstance.value.unmanage(el)
    }
    suppressJsPlumbEvents.value = false
  }
  nodes.value = nodes.value.filter((node) => !codes.includes(node.code))
  edges.value = edges.value.filter(
    (edge) => !codes.includes(edge.sourceNodeCode) && !codes.includes(edge.targetNodeCode)
  )
  setSelectedNodes(nodes.value[0] ? [nodes.value[0].code] : [], nodes.value[0]?.code ?? null)
  jsPlumbInstance.value?.repaintEverything?.()
}

async function addEdge() {
  if (!transientSourceCode.value || !transientTargetCode.value) return
  const connError = validateConnection(transientSourceCode.value, transientTargetCode.value)
  if (connError) {
    showConnectionError(connError)
    return
  }
  const edge: WorkflowGraphEdge = {
    id: null,
    sourceNodeCode: transientSourceCode.value,
    targetNodeCode: transientTargetCode.value,
    transitionKey: '',
    priority: edges.value.length,
    conditionData: '{}'
  }
  if (edges.value.some((item) => edgeKey(item) === edgeKey(edge))) return
  edges.value = [...edges.value, edge]
  selectedEdgeKey.value = edgeKey(edge)
  selectedNodeCode.value = null
  if (jsPlumbInstance.value) {
    const source = document.getElementById(nodeElementId(edge.sourceNodeCode))
    const target = document.getElementById(nodeElementId(edge.targetNodeCode))
    if (source && target) {
      suppressJsPlumbEvents.value = true
      try {
        jsPlumbInstance.value.connect({
          source,
          target,
          detachable: true,
          anchors: ['Bottom', 'Top'] as any,
          overlays: [
            { type: 'Arrow', options: { location: 1, width: 12, length: 10, foldback: 0.8 } },
            ...(edge.transitionKey
              ? [
                  {
                    type: 'Label',
                    options: { label: edge.transitionKey, cssClass: 'workflow-edge-label' }
                  }
                ]
              : [])
          ] as any[]
        })
      } catch (err) {
        console.warn('workflow: falha ao conectar', err)
      }
      suppressJsPlumbEvents.value = false
    }
  }
}

function showConnectionError(msg: string) {
  if (errorTimer) clearTimeout(errorTimer)
  connectionError.value = msg
  errorTimer = setTimeout(() => {
    connectionError.value = null
  }, 3500)
}

function validateConnection(sourceCode: string, targetCode: string): string | null {
  if (sourceCode === targetCode) return 'Auto-conexão não permitida'
  const src = nodes.value.find((n) => n.code === sourceCode)
  const tgt = nodes.value.find((n) => n.code === targetCode)
  if (!src || !tgt) return 'Nó não encontrado'
  const srcRule = NODE_CONNECTION_RULES[src.type]
  const tgtRule = NODE_CONNECTION_RULES[tgt.type]
  if (srcRule.maxOutgoing === 0) return `Nó ${src.type} não pode ter conexões de saída`
  if (tgtRule.maxIncoming === 0) return `Nó ${tgt.type} não aceita conexões de entrada`
  if (srcRule.allowedTargetTypes && !srcRule.allowedTargetTypes.includes(tgt.type))
    return `${src.type} não pode conectar a ${tgt.type}`
  if (srcRule.maxOutgoing !== -1) {
    const outgoing = edges.value.filter((e) => e.sourceNodeCode === sourceCode).length
    if (outgoing >= srcRule.maxOutgoing)
      return `"${src.name}" já atingiu o limite de ${srcRule.maxOutgoing} saída(s)`
  }
  if (tgtRule.maxIncoming !== -1) {
    const incoming = edges.value.filter((e) => e.targetNodeCode === targetCode).length
    if (incoming >= tgtRule.maxIncoming)
      return `"${tgt.name}" já atingiu o limite de ${tgtRule.maxIncoming} entrada(s)`
  }
  return null
}

function validateGraph(): string[] {
  const errors: string[] = []
  const startNodes = nodes.value.filter((n) => n.type === 'START')
  if (startNodes.length === 0) errors.push('O workflow precisa de exatamente 1 nó START')
  if (startNodes.length > 1) errors.push('O workflow não pode ter mais de 1 nó START')
  if (!nodes.value.some((n) => n.type === 'END' || n.type === 'FAILURE'))
    errors.push('O workflow precisa de ao menos 1 nó END ou FAILURE')
  for (const node of nodes.value) {
    const rule = NODE_CONNECTION_RULES[node.type]
    const outgoing = edges.value.filter((e) => e.sourceNodeCode === node.code).length
    const incoming = edges.value.filter((e) => e.targetNodeCode === node.code).length
    if (rule.maxOutgoing === 0 && outgoing > 0)
      errors.push(`"${node.name}" (${node.type}) não pode ter saídas`)
    if (rule.maxIncoming === 0 && incoming > 0)
      errors.push(`"${node.name}" (${node.type}) não pode ter entradas`)
    if (rule.maxOutgoing > 0 && outgoing === 0)
      errors.push(`"${node.name}" (${node.type}) não tem conexão de saída`)
    if (node.type === 'DECISION' && outgoing < 2)
      errors.push(`"${node.name}" (DECISION) precisa ter exatamente 2 saídas (T e F)`)
    if (node.type === 'DECISION' && outgoing > 2)
      errors.push(`"${node.name}" (DECISION) tem mais de 2 saídas`)
  }
  return errors
}

function removeSelectedEdge() {
  if (!selectedEdge.value) return
  const edge = selectedEdge.value
  selectedEdgeKey.value = null
  edges.value = edges.value.filter((e) => edgeKey(e) !== edgeKey(edge))
  if (jsPlumbInstance.value) {
    const conns = (jsPlumbInstance.value as any).getConnections({
      source: document.getElementById(nodeElementId(edge.sourceNodeCode)),
      target: document.getElementById(nodeElementId(edge.targetNodeCode))
    })
    if (Array.isArray(conns)) {
      suppressJsPlumbEvents.value = true
      conns.forEach((c: any) => jsPlumbInstance.value?.deleteConnection(c))
      suppressJsPlumbEvents.value = false
    }
  }
}

function beginDrag(event: MouseEvent, code: string) {
  if (event.button !== 0) return

  if (event.ctrlKey || event.metaKey) {
    if (isNodeSelected(code)) {
      const nextSelection = selectedNodeCodes.value.filter((item) => item !== code)
      setSelectedNodes(nextSelection, nextSelection[0] ?? null)
    } else {
      setSelectedNodes([...selectedNodeCodes.value, code], code)
    }
    return
  }

  const dragCodes =
    isNodeSelected(code) && selectedNodeCodes.value.length > 1
      ? [...selectedNodeCodes.value]
      : jsPlumbInstance.value
        ? []
        : [code]

  if (!isNodeSelected(code)) {
    setSelectedNodes([code], code)
  } else {
    selectedNodeCode.value = code
    selectedEdgeKey.value = null
  }

  if (!dragCodes.length) return

  event.preventDefault()
  event.stopPropagation()

  const initialPositions: Record<string, { x: number; y: number }> = {}
  dragCodes.forEach((itemCode) => {
    const node = nodes.value.find((item) => item.code === itemCode)
    if (!node) return
    initialPositions[itemCode] = {
      x: node.posX ?? 80,
      y: node.posY ?? 80
    }
  })

  dragState.value = {
    mode: 'nodes',
    originClientX: event.clientX,
    originClientY: event.clientY,
    codes: dragCodes,
    initialPositions
  }
}

function beginMarqueeSelection(event: MouseEvent) {
  if (event.button !== 0) return
  event.preventDefault()
  const point = canvasPointFromClient(event.clientX, event.clientY)
  dragState.value = {
    mode: 'marquee',
    startX: point.x,
    startY: point.y,
    currentX: point.x,
    currentY: point.y
  }
  selectedEdgeKey.value = null
}

function onMouseMove(event: MouseEvent) {
  if (panState.value && canvasRef.value) {
    canvasRef.value.scrollLeft =
      panState.value.startScrollLeft - (event.clientX - panState.value.startClientX)
    canvasRef.value.scrollTop =
      panState.value.startScrollTop - (event.clientY - panState.value.startClientY)
    return
  }

  if (!dragState.value) return

  if (dragState.value.mode === 'marquee') {
    const point = canvasPointFromClient(event.clientX, event.clientY)
    dragState.value.currentX = point.x
    dragState.value.currentY = point.y
    return
  }

  const deltaX = (event.clientX - dragState.value.originClientX) / zoomLevel.value
  const deltaY = (event.clientY - dragState.value.originClientY) / zoomLevel.value
  dragState.value.codes.forEach((code) => {
    const node = nodes.value.find((item) => item.code === code)
    const initial =
      dragState.value?.mode === 'nodes' ? dragState.value.initialPositions[code] : null
    if (!node || !initial) return
    node.posX = Math.max(20, Math.round(initial.x + deltaX))
    node.posY = Math.max(20, Math.round(initial.y + deltaY))
  })
  jsPlumbInstance.value?.repaintEverything?.()
}

function endDrag() {
  if (panState.value) {
    panState.value = null
  }

  if (dragState.value?.mode === 'marquee') {
    const left = Math.min(dragState.value.startX, dragState.value.currentX)
    const right = Math.max(dragState.value.startX, dragState.value.currentX)
    const top = Math.min(dragState.value.startY, dragState.value.currentY)
    const bottom = Math.max(dragState.value.startY, dragState.value.currentY)

    const selectedCodes = nodes.value
      .filter((node) => {
        const { width, height } = nodeDimensions(node)
        const nodeLeft = node.posX ?? 80
        const nodeTop = node.posY ?? 80
        return (
          nodeLeft < right && nodeLeft + width > left && nodeTop < bottom && nodeTop + height > top
        )
      })
      .map((node) => node.code)

    if (selectedCodes.length) {
      setSelectedNodes(selectedCodes, selectedCodes[0])
    } else {
      clearNodeSelection()
    }
  }
  dragState.value = null
}

async function addNodeFromHandler(entry: HandlerEntry, posX?: number, posY?: number) {
  const base = entry.code.replace(/\./g, '_')
  const code = ensureUniqueCode(base)
  const configData = entry.configSchema === 'delay' ? '{"delaySeconds": 60}' : '{}'
  nodes.value.push({
    id: null,
    code,
    name: entry.label,
    type: entry.nodeType,
    handler: entry.code,
    configData,
    retryLimit: 0,
    retryDelaySeconds: 0,
    continueOnFailure: false,
    sortOrder: nodes.value.length,
    posX: posX ?? 80 + (nodes.value.length % 4) * 260,
    posY: posY ?? 80 + Math.floor(nodes.value.length / 4) * 160
  })
  setSelectedNodes([code], code)
  transientSourceCode.value = code
  await nextTick()
  if (jsPlumbInstance.value) {
    const el = document.getElementById(nodeElementId(code)) as HTMLElement | null
    if (el) jsPlumbInstance.value.manage(el)
    await repaintCanvas()
  } else {
    await renderJsPlumbGraph()
  }
}

async function dropOnCanvas(event: DragEvent) {
  const raw = event.dataTransfer?.getData('application/x-workflow-item')
  if (!raw) return
  const canvas = canvasRef.value
  if (!canvas) return
  const point = canvasPointFromClient(event.clientX, event.clientY)
  const posX = Math.max(20, Math.round(point.x))
  const posY = Math.max(20, Math.round(point.y))
  try {
    const item = JSON.parse(raw) as
      | { kind: 'handler'; code: string }
      | { kind: 'structural'; nodeType: WorkflowNodeType }
    if (item.kind === 'handler') {
      const entry = findHandlerEntry(item.code)
      if (entry) await addNodeFromHandler(entry, posX, posY)
    } else {
      await addNode(item.nodeType, posX, posY)
    }
  } catch {
    /* ignore malformed payload */
  }
}

function getDelaySeconds(): number {
  try {
    return JSON.parse(selectedNode.value?.configData || '{}').delaySeconds ?? 60
  } catch {
    return 60
  }
}

function setDelaySeconds(val: number) {
  if (!selectedNode.value) return
  selectedNode.value.configData = JSON.stringify({ delaySeconds: val })
}

function getSubworkflowCode(): string {
  try {
    return JSON.parse(selectedNode.value?.configData || '{}').workflowCode ?? ''
  } catch {
    return ''
  }
}

function setSubworkflowCode(val: string) {
  if (!selectedNode.value) return
  selectedNode.value.configData = JSON.stringify({ workflowCode: val })
}

function nodeHandlerBadge(node: WorkflowGraphNode): string {
  if (node.handler === 'workflow.call-workflow')
    return 'bg-purple-100 text-purple-700 dark:bg-purple-800 dark:text-purple-200'
  return NODE_TYPE_STYLES[node.type]?.badge ?? ''
}

function nodeHandlerDot(node: WorkflowGraphNode): string {
  if (node.handler === 'workflow.call-workflow') return 'bg-purple-400'
  return NODE_TYPE_STYLES[node.type]?.dot ?? ''
}

function executionStateClass(state: WorkflowExecutionState): string {
  const map: Record<string, string> = {
    COMPLETED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-800 dark:text-emerald-200',
    RUNNING: 'bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-200',
    WAITING: 'bg-amber-100 text-amber-700 dark:bg-amber-800 dark:text-amber-200',
    FAILED: 'bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-200',
    PENDING: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
  }
  return map[state] ?? 'bg-slate-100 text-slate-600'
}

function stepStateClass(state: string): string {
  const map: Record<string, string> = {
    COMPLETED: 'text-emerald-600',
    RUNNING: 'text-blue-600',
    WAITING: 'text-amber-600',
    FAILED: 'text-red-600',
    SKIPPED: 'text-slate-400'
  }
  return map[state] ?? 'text-slate-500'
}

async function loadExecutions() {
  if (!selectedDefinitionId.value) return
  executionsLoading.value = true
  try {
    const response = await $axios.get(
      `/api/v1/admin/workflows/definitions/${selectedDefinitionId.value}/executions`,
      { params: { page: executionPage.value, size: 20 } }
    )
    executions.value = response.data.content ?? []
    executionTotal.value = response.data.totalElements ?? 0
  } finally {
    executionsLoading.value = false
  }
}

async function retryExecution(executionId: string) {
  executionActionLoading.value = { ...executionActionLoading.value, [executionId]: true }
  try {
    const response = await $axios.post(`/api/v1/admin/workflows/executions/${executionId}/retry`)
    const idx = executions.value.findIndex((e) => e.id === executionId)
    if (idx >= 0) executions.value[idx] = response.data
    // Clear cached steps so they reload fresh on expand
    delete executionSteps.value[executionId]
  } finally {
    executionActionLoading.value = { ...executionActionLoading.value, [executionId]: false }
  }
}

async function cancelExecution(executionId: string) {
  executionActionLoading.value = { ...executionActionLoading.value, [executionId]: true }
  try {
    const response = await $axios.post(`/api/v1/admin/workflows/executions/${executionId}/cancel`)
    const idx = executions.value.findIndex((e) => e.id === executionId)
    if (idx >= 0) executions.value[idx] = response.data
  } finally {
    executionActionLoading.value = { ...executionActionLoading.value, [executionId]: false }
  }
}

async function toggleExecutionSteps(executionId: string) {
  if (expandedExecutionId.value === executionId) {
    expandedExecutionId.value = null
    return
  }
  expandedExecutionId.value = executionId
  if (executionSteps.value[executionId]) return
  executionStepsLoading.value = { ...executionStepsLoading.value, [executionId]: true }
  try {
    const response = await $axios.get(`/api/v1/admin/workflows/executions/${executionId}/steps`)
    executionSteps.value = { ...executionSteps.value, [executionId]: response.data ?? [] }
  } finally {
    executionStepsLoading.value = { ...executionStepsLoading.value, [executionId]: false }
  }
}

watch(selectedEdgeKey, (key) => {
  const inst = jsPlumbInstance.value
  if (!inst) return
  // Repaint all connections — highlight the selected one
  inst.getConnections({} as any).forEach((conn: any) => {
    const srcCode = extractNodeCode(conn.sourceId ?? conn.source?.id ?? '')
    const tgtCode = extractNodeCode(conn.targetId ?? conn.target?.id ?? '')
    const edge = edges.value.find(
      (e) => e.sourceNodeCode === srcCode && e.targetNodeCode === tgtCode
    )
    const isSelected = edge ? edgeKey(edge) === key : false
    conn.setPaintStyle(
      isSelected
        ? { stroke: '#4f46e5', strokeWidth: 3, outlineStroke: 'transparent', outlineWidth: 12 }
        : { stroke: '#6366f1', strokeWidth: 2, outlineStroke: 'transparent', outlineWidth: 12 }
    )
  })
})

// ── conditionForm ↔ selectedEdge.conditionData sync ────────────────────────
let _syncingConditionForm = false

watch(
  selectedEdge,
  (edge) => {
    _syncingConditionForm = true
    if (!edge) {
      conditionForm.value = emptyConditionForm()
    } else {
      try {
        const c = JSON.parse(
          typeof edge.conditionData === 'string' && edge.conditionData ? edge.conditionData : '{}'
        )
        const toArr = (v: any) => (Array.isArray(v) ? v : v != null ? [String(v)] : [])
        conditionForm.value = {
          requiresShipping:
            c.requiresShipping === true ? 'true' : c.requiresShipping === false ? 'false' : '',
          invoiceRequired:
            c.invoiceRequired === true ? 'true' : c.invoiceRequired === false ? 'false' : '',
          paymentStateIn: toArr(c.paymentStateIn),
          deliveryStateIn: toArr(c.deliveryStateIn),
          invoiceStateIn: toArr(c.invoiceStateIn),
          orderSourceIn: toArr(c.orderSourceIn)
        }
      } catch {
        conditionForm.value = emptyConditionForm()
      }
    }
    nextTick(() => {
      _syncingConditionForm = false
    })
  },
  { immediate: true }
)

watch(
  conditionForm,
  (form) => {
    if (_syncingConditionForm || !selectedEdge.value) return
    const c: Record<string, any> = {}
    if (form.requiresShipping === 'true') c.requiresShipping = true
    else if (form.requiresShipping === 'false') c.requiresShipping = false
    if (form.invoiceRequired === 'true') c.invoiceRequired = true
    else if (form.invoiceRequired === 'false') c.invoiceRequired = false
    if (form.paymentStateIn.length) c.paymentStateIn = form.paymentStateIn
    if (form.deliveryStateIn.length) c.deliveryStateIn = form.deliveryStateIn
    if (form.invoiceStateIn.length) c.invoiceStateIn = form.invoiceStateIn
    if (form.orderSourceIn.length) c.orderSourceIn = form.orderSourceIn
    selectedEdge.value.conditionData = Object.keys(c).length === 0 ? '{}' : JSON.stringify(c)
  },
  { deep: true }
)

watch(activeTab, (tab) => {
  if (tab === 'execucoes' && selectedDefinitionId.value) {
    executions.value = []
    expandedExecutionId.value = null
    loadExecutions()
    return
  }
  if (tab === 'designer') repaintCanvas()
})

watch(zoomLevel, () => {
  repaintCanvas()
})

watch(
  selectedDefinitionId,
  async (definitionId) => {
    if (!definitionId) {
      nodes.value = []
      edges.value = []
      clearNodeSelection()
      selectedEdgeKey.value = null
      destroyJsPlumbInstance()
      return
    }
    await loadGraph(definitionId)
  },
  { immediate: true }
)

function onKeydown(event: KeyboardEvent) {
  if (event.key !== 'Delete' && event.key !== 'Backspace') return
  const tag = (event.target as HTMLElement)?.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
  if (selectedEdgeKey.value) {
    event.preventDefault()
    removeSelectedEdge()
  } else if (selectedNodeCode.value) {
    event.preventDefault()
    removeSelectedNode()
  }
}

onMounted(async () => {
  document.body.classList.remove('has-min-sidebar', 'is-header-blur')
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', endDrag)
  window.addEventListener('keydown', onKeydown)
  await Promise.all([loadDefinitions(), loadHandlerRegistry()])
  if (!selectedDefinitionId.value && definitions.value[0]) {
    await router.replace({ name: 'workflow-designer', params: { id: definitions.value[0].id } })
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', endDrag)
  window.removeEventListener('keydown', onKeydown)
  if (errorTimer) clearTimeout(errorTimer)
  destroyJsPlumbInstance()
})
</script>

<template>
  <DefaultLayout
    :icon="{ type: 'fa', icon: 'fa-light fa-diagram-project text-[1.2rem]' }"
    :menu-items="[]"
  >
    <div class="flex h-full flex-col gap-4 p-1">
      <!-- Header -->
      <div
        class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm dark:border-navy-600 dark:bg-navy-700"
      >
        <div class="flex items-center gap-3">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/40"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 text-indigo-600 dark:text-indigo-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <div>
            <h1 class="text-lg font-semibold text-slate-800 dark:text-navy-50">
              Workflow Designer
            </h1>
            <p class="text-xs text-slate-500 dark:text-navy-300">
              Designer visual de fluxos com jsPlumb
              <span
                v-if="selectedDefinition"
                class="ml-1 font-medium text-indigo-600 dark:text-indigo-400"
              >
                — {{ selectedDefinition.name }}
              </span>
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <span
            class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
            :class="
              jsPlumbInstance
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
            "
          >
            <span
              class="h-1.5 w-1.5 rounded-full"
              :class="jsPlumbInstance ? 'bg-emerald-500' : 'bg-amber-500'"
            ></span>
            {{ jsPlumbInstance ? 'jsPlumb ativo' : 'fallback SVG' }}
          </span>
          <button
            class="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-400 dark:border-navy-500 dark:bg-navy-600 dark:text-navy-100"
            type="button"
            @click="selectedDefinitionId && loadGraph(selectedDefinitionId)"
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
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Recarregar
          </button>
          <button
            class="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
            type="button"
            :disabled="saving || !selectedDefinitionId"
            @click="saveGraph"
          >
            <svg
              v-if="!saving"
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
                d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
              />
            </svg>
            <svg
              v-else
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {{ saving ? 'Salvando...' : 'Salvar fluxo' }}
          </button>
        </div>
      </div>

      <!-- Validation errors -->
      <transition name="fade">
        <div
          v-if="validationErrors.length"
          class="mx-4 mb-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-700 dark:bg-red-900/30"
        >
          <div class="flex items-start justify-between gap-2">
            <ul class="space-y-0.5">
              <li
                v-for="err in validationErrors"
                :key="err"
                class="flex items-center gap-1.5 text-xs text-red-700 dark:text-red-300"
              >
                <span class="mt-px h-1.5 w-1.5 shrink-0 rounded-full bg-red-400"></span>
                {{ err }}
              </li>
            </ul>
            <button
              class="shrink-0 text-red-400 hover:text-red-600"
              type="button"
              @click="validationErrors = []"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </transition>

      <!-- Tabs -->
      <div class="flex gap-1 border-b border-slate-200 dark:border-navy-600">
        <button
          class="px-4 py-2 text-sm font-medium transition border-b-2 -mb-px"
          :class="
            activeTab === 'designer'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-navy-300 dark:hover:text-navy-100'
          "
          type="button"
          @click="activeTab = 'designer'"
        >
          Designer
        </button>
        <button
          class="px-4 py-2 text-sm font-medium transition border-b-2 -mb-px"
          :class="
            activeTab === 'execucoes'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-navy-300 dark:hover:text-navy-100'
          "
          type="button"
          :disabled="!selectedDefinitionId"
          @click="activeTab = 'execucoes'"
        >
          Execuções
        </button>
      </div>

      <!-- Main content -->
      <div v-show="activeTab === 'designer'" class="grid min-h-0 flex-1 grid-cols-12 gap-4">
        <!-- Sidebar esquerdo -->
        <div class="col-span-12 space-y-4 lg:col-span-3">
          <!-- Definições (sidebar agrupada) -->
          <div
            class="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-navy-600 dark:bg-navy-700"
          >
            <div
              class="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-navy-600"
            >
              <h2
                class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-navy-300"
              >
                Workflows
              </h2>
              <button
                class="rounded p-0.5 text-slate-400 hover:text-indigo-600 transition"
                type="button"
                title="Nova definição"
                @click="openCreateModal('ORDER')"
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </button>
            </div>
            <div class="max-h-[320px] overflow-auto p-2">
              <template v-for="ownerType in OWNER_TYPES" :key="ownerType">
                <div class="mb-1">
                  <div class="flex items-center justify-between px-1 py-1">
                    <span
                      class="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-navy-400"
                      >{{ ownerType }}</span
                    >
                    <button
                      class="rounded p-0.5 text-slate-300 hover:text-indigo-500 transition"
                      type="button"
                      :title="`Nova definição ${ownerType}`"
                      @click="openCreateModal(ownerType as WorkflowOwnerType)"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-3 w-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    </button>
                  </div>
                  <div
                    v-if="!definitionsByOwnerType[ownerType as WorkflowOwnerType]?.length"
                    class="px-2 pb-1 text-[11px] italic text-slate-300 dark:text-navy-500"
                  >
                    (vazio)
                  </div>
                  <button
                    v-for="definition in definitionsByOwnerType[ownerType as WorkflowOwnerType]"
                    :key="definition.id"
                    class="group mb-0.5 w-full rounded-lg px-2 py-1.5 text-left transition"
                    :class="
                      definition.id === selectedDefinitionId
                        ? 'bg-indigo-50 ring-1 ring-indigo-300 dark:bg-indigo-900/30 dark:ring-indigo-600'
                        : 'hover:bg-slate-50 dark:hover:bg-navy-600'
                    "
                    type="button"
                    @click="selectDefinition(definition.id)"
                  >
                    <div class="flex items-center justify-between gap-1">
                      <span
                        class="truncate text-xs font-medium text-slate-700 dark:text-navy-100"
                        >{{ definition.name }}</span
                      >
                      <span
                        class="h-1.5 w-1.5 shrink-0 rounded-full"
                        :class="definition.active ? 'bg-emerald-400' : 'bg-slate-300'"
                        :title="definition.active ? 'ativo' : 'inativo'"
                      ></span>
                    </div>
                  </button>
                </div>
              </template>
            </div>
          </div>

          <!-- Paleta de nós -->
          <div
            class="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-navy-600 dark:bg-navy-700"
          >
            <div class="border-b border-slate-100 px-4 py-3 dark:border-navy-600">
              <h2
                class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-navy-300"
              >
                Paleta de handlers
              </h2>
            </div>
            <div class="space-y-1 p-2">
              <!-- Estruturais -->
              <div
                class="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-navy-400"
              >
                Estrutura
              </div>
              <div class="grid grid-cols-3 gap-1 mb-2">
                <button
                  v-for="type in ['START', 'END', 'FAILURE'] as WorkflowNodeType[]"
                  :key="type"
                  class="flex flex-col items-center gap-1 rounded-lg border px-2 py-2 text-[10px] font-medium transition hover:scale-[1.02] cursor-grab active:cursor-grabbing"
                  :class="
                    NODE_TYPE_STYLES[type].border +
                    ' ' +
                    NODE_TYPE_STYLES[type].bg +
                    ' ' +
                    NODE_TYPE_STYLES[type].badge
                  "
                  type="button"
                  draggable="true"
                  @dragstart="
                    $event.dataTransfer?.setData(
                      'application/x-workflow-item',
                      JSON.stringify({ kind: 'structural', nodeType: type })
                    )
                  "
                  @click="addNode(type)"
                >
                  <span class="h-2 w-2 rounded-full" :class="NODE_TYPE_STYLES[type].dot"></span>
                  {{ type }}
                </button>
              </div>
              <!-- Handlers -->
              <div
                class="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-navy-400"
              >
                Handlers
              </div>
              <button
                v-for="entry in filteredHandlers"
                :key="entry.code"
                class="flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition hover:scale-[1.01] cursor-grab active:cursor-grabbing"
                :class="
                  entry.code === 'workflow.call-workflow'
                    ? 'border-purple-300 bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-600'
                    : NODE_TYPE_STYLES[entry.nodeType].border +
                      ' ' +
                      NODE_TYPE_STYLES[entry.nodeType].bg +
                      ' ' +
                      NODE_TYPE_STYLES[entry.nodeType].badge
                "
                type="button"
                draggable="true"
                @dragstart="
                  $event.dataTransfer?.setData(
                    'application/x-workflow-item',
                    JSON.stringify({ kind: 'handler', code: entry.code })
                  )
                "
                @click="addNodeFromHandler(entry)"
              >
                <span
                  class="h-2 w-2 shrink-0 rounded-full"
                  :class="
                    entry.code === 'workflow.call-workflow'
                      ? 'bg-purple-400'
                      : NODE_TYPE_STYLES[entry.nodeType].dot
                  "
                ></span>
                <span class="truncate">{{ entry.label }}</span>
              </button>
            </div>
          </div>

          <!-- Conectar nós -->
          <div
            class="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-navy-600 dark:bg-navy-700"
          >
            <div class="border-b border-slate-100 px-4 py-3 dark:border-navy-600">
              <h2
                class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-navy-300"
              >
                Conectar nós
              </h2>
            </div>
            <div class="space-y-2 p-3">
              <select
                v-model="transientSourceCode"
                class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm dark:border-navy-500 dark:bg-navy-600 dark:text-navy-100"
              >
                <option value="">Origem</option>
                <option v-for="node in nodes" :key="node.code" :value="node.code">
                  {{ node.name }}
                </option>
              </select>
              <div class="flex justify-center text-slate-300">
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
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
              </div>
              <select
                v-model="transientTargetCode"
                class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm dark:border-navy-500 dark:bg-navy-600 dark:text-navy-100"
              >
                <option value="">Destino</option>
                <option v-for="node in nodes" :key="node.code" :value="node.code">
                  {{ node.name }}
                </option>
              </select>
              <button
                class="w-full rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-40"
                type="button"
                :disabled="!transientSourceCode || !transientTargetCode"
                @click="addEdge"
              >
                Criar transição
              </button>
            </div>
          </div>
        </div>

        <!-- Canvas central -->
        <div class="col-span-12 lg:col-span-6">
          <div
            class="flex h-full flex-col rounded-xl border border-slate-200 bg-white shadow-sm dark:border-navy-600 dark:bg-navy-700"
          >
            <!-- Canvas header -->
            <div
              class="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-navy-600"
            >
              <div class="flex-1 min-w-0">
                <template v-if="selectedDefinition && editingDefinitionName">
                  <div class="flex items-center gap-2">
                    <input
                      v-model="editingNameValue"
                      class="rounded border border-indigo-300 px-2 py-1 text-sm font-medium text-slate-800 dark:border-indigo-600 dark:bg-navy-600 dark:text-navy-50"
                      @keydown.enter="saveDefinitionMeta()"
                      @keydown.escape="editingDefinitionName = false"
                    />
                    <button
                      class="text-xs text-indigo-600 hover:underline"
                      type="button"
                      @click="saveDefinitionMeta()"
                    >
                      Salvar
                    </button>
                    <button
                      class="text-xs text-slate-400 hover:underline"
                      type="button"
                      @click="editingDefinitionName = false"
                    >
                      Cancelar
                    </button>
                  </div>
                </template>
                <template v-else>
                  <div class="flex items-center gap-2 flex-wrap">
                    <h2
                      class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-navy-300"
                    >
                      Canvas do fluxo
                    </h2>
                    <template v-if="selectedDefinition">
                      <button
                        class="truncate text-sm font-medium text-slate-700 dark:text-navy-100 hover:text-indigo-600 transition"
                        type="button"
                        title="Clique para editar nome"
                        @click="
                          ((editingNameValue = selectedDefinition!.name),
                          (editingDefinitionName = true))
                        "
                      >
                        {{ selectedDefinition.name }}
                      </button>
                      <span class="text-slate-300 dark:text-navy-500">·</span>
                      <button
                        class="rounded-full px-2 py-0.5 text-[10px] font-medium transition"
                        :class="
                          selectedDefinition.active
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-navy-600 dark:text-navy-300'
                        "
                        type="button"
                        @click="saveDefinitionMeta(!selectedDefinition.active)"
                      >
                        {{ selectedDefinition.active ? 'ativo' : 'inativo' }}
                      </button>
                    </template>
                  </div>
                  <p class="text-[11px] text-slate-400 dark:text-navy-300">
                    Arraste os nós para reposicionar. Conecte arrastando entre nós no modo jsPlumb.
                  </p>
                </template>
              </div>
              <div class="flex items-center gap-2 text-xs text-slate-400 ml-2 shrink-0">
                <div
                  class="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-1 py-1 dark:border-navy-500 dark:bg-navy-800/50"
                >
                  <button
                    class="rounded px-2 py-1 text-slate-600 transition hover:bg-white hover:text-indigo-600 dark:text-navy-200 dark:hover:bg-navy-600"
                    type="button"
                    title="Zoom out"
                    @click="setZoom(zoomLevel - 0.1)"
                  >
                    -
                  </button>
                  <button
                    class="min-w-[56px] rounded px-2 py-1 text-center text-slate-600 transition hover:bg-white hover:text-indigo-600 dark:text-navy-200 dark:hover:bg-navy-600"
                    type="button"
                    title="Reset zoom"
                    @click="setZoom(1)"
                  >
                    {{ Math.round(zoomLevel * 100) }}%
                  </button>
                  <button
                    class="rounded px-2 py-1 text-slate-600 transition hover:bg-white hover:text-indigo-600 dark:text-navy-200 dark:hover:bg-navy-600"
                    type="button"
                    title="Zoom in"
                    @click="setZoom(zoomLevel + 0.1)"
                  >
                    +
                  </button>
                </div>
                <span>{{ nodes.length }} nós</span>
                <span class="text-slate-200">·</span>
                <span>{{ edges.length }} arestas</span>
              </div>
            </div>

            <!-- Canvas -->
            <div
              ref="canvasRef"
              class="workflow-canvas relative flex-1 overflow-auto rounded-b-xl"
              style="min-height: 720px"
              @mousedown="beginPan"
              @dragover.prevent
              @drop.prevent="dropOnCanvas"
            >
              <!-- SVG fallback (quando jsPlumb não está ativo) -->
              <div
                ref="stageRef"
                class="workflow-stage relative origin-top-left"
                :style="{
                  width: `${stageSize.width}px`,
                  height: `${stageSize.height}px`,
                  zoom: zoomLevel
                }"
                @mousedown.self="beginMarqueeSelection"
              >
                <svg
                  v-if="!jsPlumbInstance"
                  class="absolute inset-0 pointer-events-none"
                  :width="stageSize.width"
                  :height="stageSize.height"
                  style="z-index: 1"
                >
                  <defs>
                    <marker
                      id="workflow-arrow"
                      markerWidth="10"
                      markerHeight="10"
                      refX="8"
                      refY="3"
                      orient="auto"
                      markerUnits="strokeWidth"
                    >
                      <path d="M0,0 L0,6 L9,3 z" fill="#6366f1"></path>
                    </marker>
                  </defs>
                  <g v-for="item in svgEdges" :key="item.key">
                    <path
                      :d="item.curve"
                      fill="none"
                      marker-end="url(#workflow-arrow)"
                      :stroke="selectedEdgeKey === item.key ? '#4f46e5' : '#6366f1'"
                      :stroke-width="selectedEdgeKey === item.key ? 3 : 2"
                      stroke-opacity="0.7"
                      class="pointer-events-auto cursor-pointer transition-all"
                      @click.stop="((selectedEdgeKey = item.key), clearNodeSelection())"
                    />
                    <text
                      v-if="item.edge.transitionKey"
                      :x="item.midX"
                      :y="item.midY - 6"
                      text-anchor="middle"
                      class="text-[10px] pointer-events-none"
                      fill="#6366f1"
                      font-size="10"
                      font-family="sans-serif"
                    >
                      {{ item.edge.transitionKey }}
                    </text>
                  </g>
                </svg>

                <!-- Nós -->
                <div
                  v-for="node in nodes"
                  :id="nodeElementId(node.code)"
                  :key="node.code"
                  class="workflow-node absolute shadow-md transition-shadow"
                  :class="[
                    node.type === 'DECISION' ? 'decision-node' : 'rounded-xl border-2',
                    node.type !== 'DECISION' ? NODE_TYPE_STYLES[node.type].bg : '',
                    node.type !== 'DECISION'
                      ? isNodeSelected(node.code)
                        ? 'border-indigo-500 shadow-indigo-200 ring-2 ring-indigo-300/50 dark:shadow-indigo-900'
                        : NODE_TYPE_STYLES[node.type].border + ' hover:shadow-lg'
                      : ''
                  ]"
                  :style="{
                    width: `${nodeDimensions(node).width}px`,
                    height: `${nodeDimensions(node).height}px`,
                    left: `${node.posX ?? 80}px`,
                    top: `${node.posY ?? 80}px`,
                    zIndex: isNodeSelected(node.code) ? 10 : 2
                  }"
                  @mousedown="beginDrag($event, node.code)"
                  @click.stop="setSelectedNodes([node.code], node.code)"
                >
                  <!-- DECISION: losango -->
                  <template v-if="node.type === 'DECISION'">
                    <div
                      class="decision-diamond"
                      :class="isNodeSelected(node.code) ? 'decision-diamond--selected' : ''"
                    >
                      <div class="decision-content">
                        <span
                          class="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300"
                          >{{ node.name }}</span
                        >
                        <span
                          class="text-[9px] text-amber-600/70 dark:text-amber-400/70 truncate max-w-[100px]"
                          >{{ node.handler || 'sem handler' }}</span
                        >
                      </div>
                    </div>
                    <!-- porta false (esquerda-baixo) -->
                    <div class="node-port node-port--false" title="false — arraste para conectar">
                      <span class="node-port-label">F</span>
                    </div>
                    <!-- porta true (direita-baixo) -->
                    <div class="node-port node-port--true" title="true — arraste para conectar">
                      <span class="node-port-label">T</span>
                    </div>
                  </template>

                  <!-- Nó padrão -->
                  <template v-else>
                    <!-- Header do nó -->
                    <div
                      class="flex items-center gap-2 rounded-t-[10px] border-b px-3 py-2"
                      :class="
                        NODE_TYPE_STYLES[node.type].badge.includes('emerald')
                          ? 'border-emerald-200 dark:border-emerald-700'
                          : NODE_TYPE_STYLES[node.type].badge.includes('blue')
                            ? 'border-blue-200 dark:border-blue-700'
                            : NODE_TYPE_STYLES[node.type].badge.includes('amber')
                              ? 'border-amber-200 dark:border-amber-700'
                              : NODE_TYPE_STYLES[node.type].badge.includes('purple')
                                ? 'border-purple-200 dark:border-purple-700'
                                : NODE_TYPE_STYLES[node.type].badge.includes('red')
                                  ? 'border-red-200 dark:border-red-700'
                                  : 'border-slate-200 dark:border-slate-600'
                      "
                    >
                      <span
                        class="h-2 w-2 rounded-full"
                        :class="NODE_TYPE_STYLES[node.type].dot"
                      ></span>
                      <span
                        class="text-[10px] font-bold uppercase tracking-wider"
                        :class="NODE_TYPE_STYLES[node.type].badge.split(' ').slice(1).join(' ')"
                        >{{ node.type }}</span
                      >
                      <span class="ml-auto text-[10px] text-slate-400 dark:text-navy-300">{{
                        node.code
                      }}</span>
                    </div>
                    <!-- Body do nó -->
                    <div class="px-3 py-2">
                      <div class="text-sm font-semibold text-slate-800 dark:text-navy-50 truncate">
                        {{ node.name }}
                      </div>
                      <div
                        v-if="node.handler"
                        class="mt-0.5 truncate text-[11px] text-slate-500 dark:text-navy-300"
                      >
                        {{ node.handler }}
                      </div>
                      <div
                        v-else
                        class="mt-0.5 text-[11px] italic text-slate-400 dark:text-navy-400"
                      >
                        Sem handler
                      </div>
                    </div>
                    <!-- Handle de saída -->
                    <div class="node-port" title="Arraste para conectar"></div>
                  </template>
                </div>

                <div
                  v-if="marqueeSelectionBox"
                  class="selection-box absolute z-30"
                  :style="{
                    left: `${marqueeSelectionBox.left}px`,
                    top: `${marqueeSelectionBox.top}px`,
                    width: `${marqueeSelectionBox.width}px`,
                    height: `${marqueeSelectionBox.height}px`
                  }"
                ></div>
              </div>

              <!-- Connection error toast -->
              <transition name="fade">
                <div
                  v-if="connectionError"
                  class="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 shadow-lg dark:border-red-700 dark:bg-red-900/40 dark:text-red-300"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {{ connectionError }}
                </div>
              </transition>

              <!-- Loading overlay -->
              <div
                v-if="loading"
                class="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-b-xl bg-white/80 backdrop-blur-sm dark:bg-navy-900/80"
                style="z-index: 20"
              >
                <svg
                  class="h-8 w-8 animate-spin text-indigo-500"
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
                <span class="text-sm font-medium text-slate-600 dark:text-navy-200"
                  >Carregando fluxo...</span
                >
              </div>

              <!-- Empty state -->
              <div
                v-else-if="!nodes.length && selectedDefinitionId"
                class="absolute inset-0 flex flex-col items-center justify-center gap-3"
                style="z-index: 1"
              >
                <div
                  class="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-navy-600"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-8 w-8 text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="1.5"
                      d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7"
                    />
                  </svg>
                </div>
                <p class="text-sm text-slate-500 dark:text-navy-300">
                  Nenhum nó no fluxo. Adicione um nó no painel esquerdo.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Inspector direito -->
        <div class="col-span-12 space-y-4 lg:col-span-3">
          <!-- Nó selecionado -->
          <div
            v-if="selectedNode"
            class="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-navy-600 dark:bg-navy-700"
          >
            <div
              class="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-navy-600"
            >
              <div class="flex items-center gap-2">
                <span
                  class="h-2 w-2 rounded-full"
                  :class="NODE_TYPE_STYLES[selectedNode.type].dot"
                ></span>
                <h2
                  class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-navy-300"
                >
                  Nó selecionado
                </h2>
              </div>
              <button
                class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
                type="button"
                @click="removeSelectedNode"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Remover
              </button>
            </div>
            <div class="space-y-3 p-4">
              <div>
                <label
                  class="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-400"
                  >Nome</label
                >
                <input
                  v-model="selectedNode.name"
                  class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm dark:border-navy-500 dark:bg-navy-600 dark:text-navy-100"
                  placeholder="Nome do nó"
                />
              </div>
              <div>
                <label
                  class="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-400"
                  >Código</label
                >
                <input
                  v-model="selectedNode.code"
                  class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono text-slate-700 shadow-sm dark:border-navy-500 dark:bg-navy-600 dark:text-navy-100"
                  placeholder="code"
                />
              </div>
              <div>
                <label
                  class="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-400"
                  >Tipo</label
                >
                <select
                  v-model="selectedNode.type"
                  class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm dark:border-navy-500 dark:bg-navy-600 dark:text-navy-100"
                >
                  <option v-for="type in nodeTypes" :key="type" :value="type">{{ type }}</option>
                </select>
              </div>
              <div>
                <label
                  class="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-400"
                  >Handler</label
                >
                <select
                  v-model="selectedNode.handler"
                  class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm dark:border-navy-500 dark:bg-navy-600 dark:text-navy-100"
                >
                  <option value="">Sem handler</option>
                  <option v-for="entry in handlerRegistry" :key="entry.code" :value="entry.code">
                    {{ entry.label }} ({{ entry.code }})
                  </option>
                </select>
              </div>
              <!-- Config dinâmica baseada no configSchema -->
              <div v-if="selectedNodeConfigSchema === 'delay'">
                <label
                  class="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-400"
                  >Delay (segundos)</label
                >
                <input
                  type="number"
                  :value="getDelaySeconds()"
                  class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm dark:border-navy-500 dark:bg-navy-600 dark:text-navy-100"
                  @input="setDelaySeconds(Number(($event.target as HTMLInputElement).value))"
                />
              </div>
              <div v-else-if="selectedNodeConfigSchema === 'subworkflow'">
                <label
                  class="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-400"
                  >Sub-workflow</label
                >
                <select
                  :value="getSubworkflowCode()"
                  class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm dark:border-navy-500 dark:bg-navy-600 dark:text-navy-100"
                  @change="setSubworkflowCode(($event.target as HTMLSelectElement).value)"
                >
                  <option value="">Selecione um workflow...</option>
                  <option v-for="def in definitions" :key="def.id" :value="def.code">
                    {{ def.name }} ({{ def.code }})
                  </option>
                </select>
              </div>
              <div v-else-if="selectedNodeConfigSchema === 'none' && selectedNode.handler">
                <span class="text-[11px] text-slate-400 italic">Sem configuração adicional.</span>
              </div>
              <div v-else>
                <label
                  class="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-400"
                  >Config JSON</label
                >
                <textarea
                  v-model="selectedNode.configData"
                  class="min-h-[80px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-mono text-slate-700 shadow-sm dark:border-navy-500 dark:bg-navy-600 dark:text-navy-100"
                  placeholder="{}"
                ></textarea>
              </div>
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label
                    class="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-400"
                    >Retries</label
                  >
                  <input
                    v-model.number="selectedNode.retryLimit"
                    type="number"
                    class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm dark:border-navy-500 dark:bg-navy-600 dark:text-navy-100"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label
                    class="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-400"
                    >Delay (s)</label
                  >
                  <input
                    v-model.number="selectedNode.retryDelaySeconds"
                    type="number"
                    class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm dark:border-navy-500 dark:bg-navy-600 dark:text-navy-100"
                    placeholder="0"
                  />
                </div>
              </div>
              <label
                class="flex cursor-pointer items-center gap-2.5 text-sm text-slate-600 dark:text-navy-100"
              >
                <input
                  v-model="selectedNode.continueOnFailure"
                  type="checkbox"
                  class="h-4 w-4 rounded border-slate-300 text-indigo-600"
                />
                Continuar em caso de falha
              </label>
            </div>
          </div>

          <!-- Transição selecionada -->
          <div
            v-else-if="selectedEdge"
            class="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-navy-600 dark:bg-navy-700"
          >
            <div
              class="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-navy-600"
            >
              <h2
                class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-navy-300"
              >
                Transição selecionada
              </h2>
              <button
                class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
                type="button"
                @click="removeSelectedEdge"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Remover
              </button>
            </div>
            <div class="space-y-3 p-4">
              <div
                class="flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-2 text-sm dark:bg-indigo-900/30"
              >
                <span class="font-mono font-medium text-indigo-700 dark:text-indigo-300">{{
                  selectedEdge.sourceNodeCode
                }}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4 shrink-0 text-indigo-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
                <span class="font-mono font-medium text-indigo-700 dark:text-indigo-300">{{
                  selectedEdge.targetNodeCode
                }}</span>
              </div>
              <div>
                <label
                  class="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-400"
                  >Transition key</label
                >
                <input
                  v-model="selectedEdge.transitionKey"
                  class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono text-slate-700 shadow-sm dark:border-navy-500 dark:bg-navy-600 dark:text-navy-100"
                  placeholder="ex: success, failure"
                />
                <div
                  v-if="selectedEdgeTransitionSuggestions.length"
                  class="mt-1.5 flex flex-wrap gap-1"
                >
                  <button
                    v-for="suggestion in selectedEdgeTransitionSuggestions"
                    :key="suggestion"
                    class="rounded px-2 py-0.5 text-[10px] font-medium transition"
                    :class="
                      selectedEdge.transitionKey === suggestion
                        ? 'bg-indigo-500 text-white'
                        : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300'
                    "
                    type="button"
                    @click="selectedEdge.transitionKey = suggestion"
                  >
                    {{ suggestion }}
                  </button>
                </div>
              </div>
              <div>
                <label
                  class="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-400"
                  >Prioridade</label
                >
                <input
                  v-model.number="selectedEdge.priority"
                  type="number"
                  class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm dark:border-navy-500 dark:bg-navy-600 dark:text-navy-100"
                  placeholder="0"
                />
              </div>
              <!-- conditionData visual editor -->
              <div
                class="space-y-2.5 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-navy-600 dark:bg-navy-800/40"
              >
                <p class="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Condições da aresta
                </p>

                <!-- Boolean: requiresShipping -->
                <div class="flex items-center justify-between gap-2">
                  <span class="text-[11px] text-slate-600 dark:text-navy-200">Requer frete</span>
                  <select
                    v-model="conditionForm.requiresShipping"
                    class="rounded border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700 dark:border-navy-500 dark:bg-navy-600 dark:text-navy-100"
                  >
                    <option value="">—</option>
                    <option value="true">Sim</option>
                    <option value="false">Não</option>
                  </select>
                </div>

                <!-- Boolean: invoiceRequired -->
                <div class="flex items-center justify-between gap-2">
                  <span class="text-[11px] text-slate-600 dark:text-navy-200">NF obrigatória</span>
                  <select
                    v-model="conditionForm.invoiceRequired"
                    class="rounded border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700 dark:border-navy-500 dark:bg-navy-600 dark:text-navy-100"
                  >
                    <option value="">—</option>
                    <option value="true">Sim</option>
                    <option value="false">Não</option>
                  </select>
                </div>

                <!-- Array: paymentStateIn -->
                <div>
                  <p class="mb-1 text-[10px] font-medium text-slate-400">Estado de pagamento</p>
                  <div class="flex flex-wrap gap-1.5">
                    <label
                      v-for="s in PAYMENT_STATES"
                      :key="s"
                      class="flex cursor-pointer items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium transition"
                      :class="
                        conditionForm.paymentStateIn.includes(s)
                          ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                          : 'bg-slate-100 text-slate-500 dark:bg-navy-600 dark:text-navy-300'
                      "
                    >
                      <input
                        type="checkbox"
                        class="h-3 w-3"
                        :value="s"
                        v-model="conditionForm.paymentStateIn"
                      />
                      {{ s }}
                    </label>
                  </div>
                </div>

                <!-- Array: deliveryStateIn -->
                <div>
                  <p class="mb-1 text-[10px] font-medium text-slate-400">Estado de entrega</p>
                  <div class="flex flex-wrap gap-1.5">
                    <label
                      v-for="s in DELIVERY_STATES"
                      :key="s"
                      class="flex cursor-pointer items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium transition"
                      :class="
                        conditionForm.deliveryStateIn.includes(s)
                          ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                          : 'bg-slate-100 text-slate-500 dark:bg-navy-600 dark:text-navy-300'
                      "
                    >
                      <input
                        type="checkbox"
                        class="h-3 w-3"
                        :value="s"
                        v-model="conditionForm.deliveryStateIn"
                      />
                      {{ s }}
                    </label>
                  </div>
                </div>

                <!-- Array: invoiceStateIn -->
                <div>
                  <p class="mb-1 text-[10px] font-medium text-slate-400">Estado de nota fiscal</p>
                  <div class="flex flex-wrap gap-1.5">
                    <label
                      v-for="s in INVOICE_STATES"
                      :key="s"
                      class="flex cursor-pointer items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium transition"
                      :class="
                        conditionForm.invoiceStateIn.includes(s)
                          ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                          : 'bg-slate-100 text-slate-500 dark:bg-navy-600 dark:text-navy-300'
                      "
                    >
                      <input
                        type="checkbox"
                        class="h-3 w-3"
                        :value="s"
                        v-model="conditionForm.invoiceStateIn"
                      />
                      {{ s }}
                    </label>
                  </div>
                </div>

                <!-- Array: orderSourceIn -->
                <div>
                  <p class="mb-1 text-[10px] font-medium text-slate-400">Origem do pedido</p>
                  <div class="flex flex-wrap gap-1.5">
                    <label
                      v-for="s in ORDER_SOURCES"
                      :key="s"
                      class="flex cursor-pointer items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium transition"
                      :class="
                        conditionForm.orderSourceIn.includes(s)
                          ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                          : 'bg-slate-100 text-slate-500 dark:bg-navy-600 dark:text-navy-300'
                      "
                    >
                      <input
                        type="checkbox"
                        class="h-3 w-3"
                        :value="s"
                        v-model="conditionForm.orderSourceIn"
                      />
                      {{ s }}
                    </label>
                  </div>
                </div>

                <!-- Active conditions summary -->
                <p
                  v-if="selectedEdge.conditionData && selectedEdge.conditionData !== '{}'"
                  class="mt-1 break-all font-mono text-[9px] text-slate-400"
                >
                  {{ selectedEdge.conditionData }}
                </p>
              </div>
            </div>
          </div>

          <!-- Placeholder inspector -->
          <div
            v-else
            class="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 dark:border-navy-600 dark:bg-navy-800/30"
          >
            <div class="flex flex-col items-center gap-3 text-center">
              <div
                class="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-navy-600"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-6 w-6 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.5"
                    d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                  />
                </svg>
              </div>
              <div>
                <p class="text-sm font-medium text-slate-600 dark:text-navy-200">Inspector</p>
                <p class="mt-1 text-xs text-slate-400 dark:text-navy-400">
                  Selecione um nó ou uma transição no canvas para editar suas propriedades.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Execuções tab -->
      <div v-show="activeTab === 'execucoes'" class="flex flex-col gap-3 flex-1">
        <div class="flex items-center justify-between">
          <span class="text-sm text-slate-500 dark:text-navy-300">
            {{ executionTotal }} execuç{{ executionTotal === 1 ? 'ão' : 'ões' }} encontradas
          </span>
          <button
            class="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:border-slate-400 dark:border-navy-500 dark:bg-navy-600 dark:text-navy-100"
            type="button"
            :disabled="executionsLoading"
            @click="loadExecutions"
          >
            Atualizar
          </button>
        </div>

        <div v-if="executionsLoading" class="flex items-center justify-center py-12">
          <svg class="h-6 w-6 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24">
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            />
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>

        <div
          v-else-if="!executions.length"
          class="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center dark:border-navy-600 dark:bg-navy-800/30"
        >
          <p class="text-sm text-slate-400 dark:text-navy-400">
            Nenhuma execução encontrada para este workflow.
          </p>
        </div>

        <div v-else class="space-y-2">
          <div
            v-for="exec in executions"
            :key="exec.id"
            class="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-navy-600 dark:bg-navy-700"
          >
            <!-- Header row -->
            <div class="flex items-center gap-2 px-4 py-3">
              <button
                class="flex min-w-0 flex-1 items-center gap-3 text-left"
                type="button"
                @click="toggleExecutionSteps(exec.id)"
              >
                <span
                  class="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                  :class="executionStateClass(exec.state)"
                  >{{ exec.state }}</span
                >
                <span class="min-w-0 flex-1">
                  <span
                    class="block truncate text-sm font-mono text-slate-700 dark:text-navy-100"
                    >{{ exec.ownerId ?? '—' }}</span
                  >
                  <span class="text-[11px] text-slate-400 dark:text-navy-300">
                    Node: {{ exec.currentNodeCode ?? '—' }}
                    <template v-if="exec.parentExecutionId"> · Sub-exec</template>
                  </span>
                </span>
                <span class="shrink-0 text-[11px] text-slate-400 dark:text-navy-300">
                  {{ exec.startedAt ? exec.startedAt.replace('T', ' ').substring(0, 16) : '—' }}
                </span>
                <svg
                  class="h-4 w-4 shrink-0 text-slate-400 transition-transform"
                  :class="expandedExecutionId === exec.id ? 'rotate-180' : ''"
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
              </button>

              <!-- Action buttons -->
              <div class="flex shrink-0 items-center gap-1">
                <button
                  v-if="exec.state === 'FAILED'"
                  class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-emerald-600 transition hover:bg-emerald-50 disabled:opacity-40 dark:text-emerald-400 dark:hover:bg-emerald-900/30"
                  type="button"
                  title="Repetir execução do início"
                  :disabled="executionActionLoading[exec.id]"
                  @click.stop="retryExecution(exec.id)"
                >
                  <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Retry
                </button>
                <button
                  v-if="exec.state === 'WAITING' || exec.state === 'RUNNING'"
                  class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-40 dark:text-red-400 dark:hover:bg-red-900/30"
                  type="button"
                  title="Cancelar execução"
                  :disabled="executionActionLoading[exec.id]"
                  @click.stop="cancelExecution(exec.id)"
                >
                  <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  Cancelar
                </button>
              </div>
            </div>

            <!-- Steps + error -->
            <div
              v-if="expandedExecutionId === exec.id"
              class="border-t border-slate-100 dark:border-navy-600 px-4 py-3 space-y-2"
            >
              <!-- Error message for FAILED -->
              <div
                v-if="exec.state === 'FAILED' && exec.errorMessage"
                class="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300"
              >
                <span class="font-semibold">Erro: </span>{{ exec.errorMessage }}
              </div>
              <div
                v-if="executionStepsLoading[exec.id]"
                class="py-4 text-center text-sm text-slate-400"
              >
                Carregando steps...
              </div>
              <div
                v-else-if="!executionSteps[exec.id]?.length"
                class="py-4 text-center text-sm text-slate-400"
              >
                Nenhum step registrado.
              </div>
              <table v-else class="w-full text-xs">
                <thead>
                  <tr class="text-left text-[10px] uppercase tracking-wider text-slate-400">
                    <th class="pb-2 pr-3">Node</th>
                    <th class="pb-2 pr-3">Handler</th>
                    <th class="pb-2 pr-3">Estado</th>
                    <th class="pb-2 pr-3">Tent.</th>
                    <th class="pb-2">Mensagem</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-navy-600">
                  <tr v-for="step in executionSteps[exec.id]" :key="step.id">
                    <td class="py-1.5 pr-3 font-mono text-slate-700 dark:text-navy-100">
                      {{ step.nodeCode }}
                    </td>
                    <td class="py-1.5 pr-3 font-mono text-slate-500 dark:text-navy-300">
                      {{ step.handler ?? '—' }}
                    </td>
                    <td class="py-1.5 pr-3 font-semibold" :class="stepStateClass(step.state)">
                      {{ step.state }}
                    </td>
                    <td class="py-1.5 pr-3 text-slate-500">{{ step.attempt }}</td>
                    <td class="py-1.5 text-slate-500 truncate max-w-[200px]">
                      {{ step.message ?? '—' }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="executionTotal > 20" class="flex items-center justify-between pt-2 text-sm">
          <button
            class="rounded-lg border border-slate-300 px-3 py-1.5 text-xs disabled:opacity-40"
            :disabled="executionPage === 0 || executionsLoading"
            @click="
              () => {
                executionPage--
                loadExecutions()
              }
            "
          >
            Anterior
          </button>
          <span class="text-xs text-slate-500">Pág. {{ executionPage + 1 }}</span>
          <button
            class="rounded-lg border border-slate-300 px-3 py-1.5 text-xs disabled:opacity-40"
            :disabled="(executionPage + 1) * 20 >= executionTotal || executionsLoading"
            @click="
              () => {
                executionPage++
                loadExecutions()
              }
            "
          >
            Próxima
          </button>
        </div>
      </div>
    </div>
    <!-- Modal: criar definição -->
    <div
      v-if="showCreateModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      @click.self="showCreateModal = false"
    >
      <div
        class="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-navy-600 dark:bg-navy-700"
      >
        <h3 class="mb-4 text-base font-semibold text-slate-800 dark:text-navy-50">
          Nova definição de workflow
        </h3>
        <div class="space-y-3">
          <div>
            <label class="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-400"
              >Tipo</label
            >
            <select
              v-model="createModalOwnerType"
              class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm dark:border-navy-500 dark:bg-navy-600 dark:text-navy-100"
            >
              <option v-for="ot in OWNER_TYPES" :key="ot" :value="ot">{{ ot }}</option>
            </select>
          </div>
          <div>
            <label class="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-400"
              >Code</label
            >
            <input
              v-model="createModalCode"
              class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono text-slate-700 shadow-sm dark:border-navy-500 dark:bg-navy-600 dark:text-navy-100"
              placeholder="ex: invoice_default"
            />
          </div>
          <div>
            <label class="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-400"
              >Nome</label
            >
            <input
              v-model="createModalName"
              class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm dark:border-navy-500 dark:bg-navy-600 dark:text-navy-100"
              placeholder="ex: Invoice Default"
            />
          </div>
        </div>
        <div class="mt-5 flex justify-end gap-2">
          <button
            class="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 transition hover:border-slate-400 dark:border-navy-500 dark:text-navy-200"
            type="button"
            @click="showCreateModal = false"
          >
            Cancelar
          </button>
          <button
            class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
            type="button"
            :disabled="createModalLoading || !createModalCode || !createModalName"
            @click="confirmCreateDefinition"
          >
            {{ createModalLoading ? 'Criando...' : 'Criar' }}
          </button>
        </div>
      </div>
    </div>
  </DefaultLayout>
</template>

<style scoped>
@import '@jsplumb/browser-ui/css/jsplumb.css';
.workflow-canvas {
  background-color: #f8fafc;
  background-image: radial-gradient(circle, #cbd5e1 1px, transparent 1px);
  background-size: 28px 28px;
}

.workflow-stage {
  transform-origin: top left;
}

:global(.dark) .workflow-canvas {
  background-color: #0f172a;
  background-image: radial-gradient(circle, #1e293b 1px, transparent 1px);
}

.workflow-node {
  user-select: none;
  cursor: grab;
  transition:
    box-shadow 0.15s ease,
    border-color 0.15s ease;
}

/* ── jsPlumb: regras mínimas necessárias (injetadas globalmente) ── */
:global(._jsPlumb_drag_select *) {
  user-select: none;
}
:global(._jsPlumb_connector) {
  z-index: 18;
  overflow: visible;
}
:global(._jsPlumb_endpoint) {
  z-index: 19;
  cursor: crosshair;
}
:global(._jsPlumb_overlay) {
  z-index: 20;
}

:global(.jtk-connector) {
  overflow: visible;
  cursor: pointer;
}
:global(.jtk-connector) path {
  pointer-events: stroke;
  cursor: pointer;
}
:global(.jtk-endpoint) {
  cursor: crosshair;
}

:global(.workflow-edge-label) {
  background: #ede9fe;
  border-radius: 4px;
  color: #6366f1;
  font-size: 10px;
  font-weight: 600;
  padding: 1px 5px;
  pointer-events: none;
}

.workflow-node:active {
  cursor: grabbing;
}

/* Handle para iniciar conexões — bolinha no rodapé do nó */
.node-port {
  position: absolute;
  bottom: -7px;
  left: 50%;
  transform: translateX(-50%);
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #6366f1;
  border: 2px solid #fff;
  cursor: crosshair;
  z-index: 5;
  transition:
    transform 0.15s ease,
    background 0.15s ease;
  box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4);
}

.node-port:hover {
  background: #4f46e5;
  transform: translateX(-50%) scale(1.3);
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.2);
}

:global(.dark) .node-port {
  border-color: #1e293b;
}

/* ── DECISION diamond ── */
.decision-node {
  background: transparent;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.selection-box {
  border: 1px solid rgba(99, 102, 241, 0.9);
  background: rgba(99, 102, 241, 0.14);
  pointer-events: none;
}

.decision-diamond {
  width: 112px;
  height: 112px;
  background: #fffbeb;
  border: 2px solid #f59e0b;
  transform: rotate(45deg);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}

.decision-diamond--selected {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.25);
}

:global(.dark) .decision-diamond {
  background: rgba(245, 158, 11, 0.1);
  border-color: #d97706;
}

.decision-content {
  transform: rotate(-45deg);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 2px;
  max-width: 100px;
}

/* porta false (esquerda-baixo) */
.node-port--false {
  position: absolute;
  bottom: 20px;
  left: 18px;
  transform: none;
  width: 16px;
  height: 16px;
  background: #f97316;
  border-color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* porta true (direita-baixo) */
.node-port--true {
  position: absolute;
  bottom: 20px;
  right: 18px;
  left: auto;
  transform: none;
  width: 16px;
  height: 16px;
  background: #22c55e;
  border-color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.node-port--false:hover {
  background: #ea580c;
  transform: scale(1.25);
  box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.2);
}

.node-port--true:hover {
  background: #16a34a;
  transform: scale(1.25);
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.2);
}

.node-port-label {
  font-size: 8px;
  font-weight: 700;
  color: #fff;
  pointer-events: none;
  line-height: 1;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
