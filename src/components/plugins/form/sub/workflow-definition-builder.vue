<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import CrudService from '@/bin/platform/hermes/services/crudService'

interface WorkflowGraphNode {
  id?: string | null
  code: string
  name: string
  type: 'START' | 'ACTION' | 'DECISION' | 'WAIT' | 'END' | 'FAILURE'
  handler?: string | null
  configData?: string | null
  retryLimit: number
  retryDelaySeconds: number
  continueOnFailure: boolean
  sortOrder: number
  posX?: number | null
  posY?: number | null
}

interface WorkflowGraphEdge {
  id?: string | null
  sourceNodeCode: string
  targetNodeCode: string
  transitionKey?: string | null
  priority: number
  conditionData?: string | null
}

interface WorkflowGraphResponse {
  definitionId: string
  code: string
  name: string
  version: number
  active: boolean
  nodes: WorkflowGraphNode[]
  edges: WorkflowGraphEdge[]
}

const props = defineProps<{
  initialValues?: any
  schema: any
}>()

const isLoading = ref(false)
const isSaving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const graph = ref<WorkflowGraphResponse | null>(null)

const nodeTypeOptions: WorkflowGraphNode['type'][] = ['START', 'ACTION', 'DECISION', 'WAIT', 'END', 'FAILURE']
const handlerOptions = [
  'order.validate',
  'order.mark-placed',
  'order.requires-shipping',
  'order.delivery',
  'order.payment',
  'order.requires-invoice',
  'order.invoice',
  'order.complete',
  'workflow.delay'
]

const definitionId = computed(() => props.initialValues?.id)
const nodeCodes = computed(() => graph.value?.nodes.map((node) => node.code).filter(Boolean) ?? [])

function createNode(seed = 0): WorkflowGraphNode {
  const order = (graph.value?.nodes.length ?? 0) * 10 + 10 + seed
  return {
    code: `step_${order}`,
    name: `Step ${order}`,
    type: 'ACTION',
    handler: 'order.validate',
    configData: '',
    retryLimit: 0,
    retryDelaySeconds: 0,
    continueOnFailure: false,
    sortOrder: order,
    posX: 200 + order,
    posY: 120 + order
  }
}

function createEdge(seed = 0): WorkflowGraphEdge {
  const first = graph.value?.nodes[0]?.code ?? ''
  const second = graph.value?.nodes[1]?.code ?? first
  return {
    sourceNodeCode: first,
    targetNodeCode: second,
    transitionKey: '',
    priority: (graph.value?.edges.length ?? 0) * 10 + 10 + seed,
    conditionData: ''
  }
}

async function loadGraph() {
  if (!definitionId.value) {
    graph.value = null
    return
  }

  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    graph.value = await CrudService.customRequest<WorkflowGraphResponse>(
      'get',
      `/api/v1/admin/workflows/definitions/${definitionId.value}/graph`
    )
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message ?? 'Falha ao carregar o designer do workflow.'
  } finally {
    isLoading.value = false
  }
}

async function saveGraph() {
  if (!definitionId.value || !graph.value) return

  isSaving.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    graph.value = await CrudService.customRequest<WorkflowGraphResponse>(
      'put',
      `/api/v1/admin/workflows/definitions/${definitionId.value}/graph`,
      { data: { nodes: graph.value.nodes, edges: graph.value.edges } }
    )
    successMessage.value = 'Workflow salvo com sucesso.'
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message ?? 'Falha ao salvar o workflow.'
  } finally {
    isSaving.value = false
  }
}

function addNode() {
  if (!graph.value) return
  graph.value.nodes.push(createNode())
}

function removeNode(index: number) {
  if (!graph.value) return
  const [removed] = graph.value.nodes.splice(index, 1)
  if (!removed?.code) return
  graph.value.edges = graph.value.edges.filter((edge) => edge.sourceNodeCode !== removed.code && edge.targetNodeCode !== removed.code)
}

function addEdge() {
  if (!graph.value) return
  graph.value.edges.push(createEdge())
}

function removeEdge(index: number) {
  if (!graph.value) return
  graph.value.edges.splice(index, 1)
}

function formatConditionExample() {
  return '{"requiresShipping":true,"paymentStateIn":["AUTHORIZED"]}'
}

watch(definitionId, loadGraph, { immediate: true })
onMounted(loadGraph)
</script>

<template>
  <div class="col-span-12 space-y-4">
    <div v-if="!definitionId" class="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
      Salve o workflow primeiro para habilitar o designer visual.
    </div>

    <div v-else class="space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/90 p-4 dark:border-navy-600 dark:bg-navy-800/40">
        <div>
          <p class="text-sm font-semibold text-slate-700 dark:text-navy-100">Designer do Workflow</p>
          <p class="mt-1 text-xs text-slate-500 dark:text-navy-300">
            Edite nodes e transições do fluxo comercial. As relações internas são salvas por um endpoint dedicado.
          </p>
        </div>
        <div class="flex gap-2">
          <button type="button" class="btn rounded-lg border px-3 py-2 text-xs font-medium" :disabled="isLoading" @click="loadGraph">Recarregar</button>
          <button type="button" class="btn rounded-lg border border-primary px-3 py-2 text-xs font-medium text-primary hover:bg-primary hover:text-white" :disabled="isSaving || isLoading || !graph" @click="saveGraph">
            {{ isSaving ? 'Salvando...' : 'Salvar Designer' }}
          </button>
        </div>
      </div>

      <div v-if="errorMessage" class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200">
        {{ errorMessage }}
      </div>
      <div v-if="successMessage" class="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200">
        {{ successMessage }}
      </div>

      <div v-if="isLoading" class="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-navy-600 dark:bg-navy-700/40 dark:text-navy-200">
        Carregando workflow...
      </div>

      <template v-else-if="graph">
        <div class="rounded-2xl border border-slate-200 bg-white p-4 dark:border-navy-600 dark:bg-navy-700/40">
          <div class="mb-3 flex items-center justify-between">
            <div>
              <p class="text-sm font-semibold text-slate-700 dark:text-navy-100">Nodes</p>
              <p class="text-xs text-slate-500 dark:text-navy-300">Cada node representa uma etapa do workflow.</p>
            </div>
            <button type="button" class="btn rounded-lg border px-3 py-2 text-xs font-medium" @click="addNode">Adicionar node</button>
          </div>

          <div class="grid gap-4 xl:grid-cols-2">
            <div v-for="(node, index) in graph.nodes" :key="node.id ?? `${node.code}-${index}`" class="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-navy-500 dark:bg-navy-800/40">
              <div class="mb-3 flex items-center justify-between gap-3">
                <p class="text-sm font-semibold text-slate-700 dark:text-navy-100">{{ node.name || node.code || `Node ${index + 1}` }}</p>
                <button type="button" class="text-xs text-rose-600" @click="removeNode(index)">Remover</button>
              </div>
              <div class="grid gap-3 md:grid-cols-2">
                <label class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-navy-300">
                  Codigo
                  <input v-model="node.code" type="text" class="form-input mt-2 w-full rounded-xl" />
                </label>
                <label class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-navy-300">
                  Nome
                  <input v-model="node.name" type="text" class="form-input mt-2 w-full rounded-xl" />
                </label>
                <label class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-navy-300">
                  Tipo
                  <select v-model="node.type" class="form-select mt-2 w-full rounded-xl">
                    <option v-for="type in nodeTypeOptions" :key="type" :value="type">{{ type }}</option>
                  </select>
                </label>
                <label class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-navy-300">
                  Handler
                  <select v-model="node.handler" class="form-select mt-2 w-full rounded-xl">
                    <option :value="''">Sem handler</option>
                    <option v-for="handler in handlerOptions" :key="handler" :value="handler">{{ handler }}</option>
                  </select>
                </label>
                <label class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-navy-300">
                  Retry limit
                  <input v-model.number="node.retryLimit" type="number" min="0" class="form-input mt-2 w-full rounded-xl" />
                </label>
                <label class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-navy-300">
                  Retry delay (s)
                  <input v-model.number="node.retryDelaySeconds" type="number" min="0" class="form-input mt-2 w-full rounded-xl" />
                </label>
                <label class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-navy-300">
                  Ordem
                  <input v-model.number="node.sortOrder" type="number" min="0" class="form-input mt-2 w-full rounded-xl" />
                </label>
                <label class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-navy-300">
                  Continuar na falha
                  <select v-model="node.continueOnFailure" class="form-select mt-2 w-full rounded-xl">
                    <option :value="false">Nao</option>
                    <option :value="true">Sim</option>
                  </select>
                </label>
                <label class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-navy-300">
                  X
                  <input v-model.number="node.posX" type="number" class="form-input mt-2 w-full rounded-xl" />
                </label>
                <label class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-navy-300">
                  Y
                  <input v-model.number="node.posY" type="number" class="form-input mt-2 w-full rounded-xl" />
                </label>
              </div>
              <label class="mt-3 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-navy-300">
                Config JSON
                <textarea v-model="node.configData" rows="4" class="form-textarea mt-2 w-full rounded-xl font-mono text-xs"></textarea>
              </label>
            </div>
          </div>
        </div>

        <div class="rounded-2xl border border-slate-200 bg-white p-4 dark:border-navy-600 dark:bg-navy-700/40">
          <div class="mb-3 flex items-center justify-between">
            <div>
              <p class="text-sm font-semibold text-slate-700 dark:text-navy-100">Transicoes</p>
              <p class="text-xs text-slate-500 dark:text-navy-300">Use transitionKey para decisões e conditionData para filtros declarativos.</p>
            </div>
            <button type="button" class="btn rounded-lg border px-3 py-2 text-xs font-medium" @click="addEdge">Adicionar transicao</button>
          </div>

          <div class="space-y-4">
            <div v-for="(edge, index) in graph.edges" :key="edge.id ?? `${edge.sourceNodeCode}-${edge.targetNodeCode}-${index}`" class="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-navy-500 dark:bg-navy-800/40">
              <div class="mb-3 flex items-center justify-between gap-3">
                <p class="text-sm font-semibold text-slate-700 dark:text-navy-100">{{ edge.sourceNodeCode || 'origem' }} → {{ edge.targetNodeCode || 'destino' }}</p>
                <button type="button" class="text-xs text-rose-600" @click="removeEdge(index)">Remover</button>
              </div>
              <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <label class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-navy-300">
                  Origem
                  <select v-model="edge.sourceNodeCode" class="form-select mt-2 w-full rounded-xl">
                    <option value="">Selecione</option>
                    <option v-for="code in nodeCodes" :key="`src-${code}`" :value="code">{{ code }}</option>
                  </select>
                </label>
                <label class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-navy-300">
                  Destino
                  <select v-model="edge.targetNodeCode" class="form-select mt-2 w-full rounded-xl">
                    <option value="">Selecione</option>
                    <option v-for="code in nodeCodes" :key="`dst-${code}`" :value="code">{{ code }}</option>
                  </select>
                </label>
                <label class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-navy-300">
                  transitionKey
                  <input v-model="edge.transitionKey" type="text" class="form-input mt-2 w-full rounded-xl" placeholder="requires-invoice" />
                </label>
                <label class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-navy-300">
                  Prioridade
                  <input v-model.number="edge.priority" type="number" min="0" class="form-input mt-2 w-full rounded-xl" />
                </label>
              </div>
              <label class="mt-3 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-navy-300">
                conditionData JSON
                <textarea v-model="edge.conditionData" rows="4" class="form-textarea mt-2 w-full rounded-xl font-mono text-xs" :placeholder="formatConditionExample()"></textarea>
              </label>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>