<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { $axios } from '@/helpers/integration/integration'
import loader from '@monaco-editor/loader'
import type * as Monaco from 'monaco-editor'

type WorkflowOwnerType = 'ORDER' | 'INVOICE' | 'DELIVERY' | 'PAYMENT' | 'GENERIC'

type ContextSchemaVar = {
  key: string
  type: string
  description: string
  source: string
}

type OutputDeclaration = {
  key: string
  type: string
  description: string
}

const props = defineProps<{
  modelValue: boolean
  ownerType: WorkflowOwnerType
  configData: string
  contextSchema?: ContextSchemaVar[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', configData: string): void
}>()

// ── Editor state ─────────────────────────────────────────────────────────────
const language = ref<'groovy' | 'python'>('groovy')
const scriptContent = ref('')
const timeoutSeconds = ref(10)

const editorContainerRef = ref<HTMLElement | null>(null)
let monacoRef: typeof Monaco | null = null
let editorInstance: Monaco.editor.IStandaloneCodeEditor | null = null

// ── Package signatures (loaded from backend on open) ─────────────────────────
type MemberDto = { name: string; kind: string; signature: string; doc: string }
type PackageSignatureDto = { packageName: string; moduleName: string; members: MemberDto[] }
const packageSignatures = ref<PackageSignatureDto[]>([])

async function fetchPackageSignatures() {
  try {
    const { data } = await $axios.get<PackageSignatureDto[]>(
      '/api/v1/admin/workflows/dependencies/signatures'
    )
    packageSignatures.value = data
  } catch {
    packageSignatures.value = []
  }
}

// ── Validation ───────────────────────────────────────────────────────────────
const validating = ref(false)
const validationResult = ref<{ valid: boolean; error?: string; line?: number; column?: number } | null>(null)

// ── Test panel ───────────────────────────────────────────────────────────────
const mockContextJson = ref('')
const testRunning = ref(false)
const testResult = ref<{
  success: boolean
  logs: string[]
  status: string
  transitionKey: string | null
  message: string | null
  executionTimeMs: number
  error: string | null
} | null>(null)

// ── Context docs ─────────────────────────────────────────────────────────────
// Fields exposed by ScriptOrder wrapper (same in test and production)
const ORDER_FIELDS = [
  { name: 'id',              type: 'String',  desc: 'UUID do pedido' },
  { name: 'number',          type: 'int',     desc: 'Número sequencial do pedido' },
  { name: 'status',          type: 'String',  desc: 'Código do estado do pedido (ex: PENDING, CONFIRMED)' },
  { name: 'paymentState',    type: 'String',  desc: 'Estado do pagamento (ex: PENDING, PAID, FAILED)' },
  { name: 'deliveryState',   type: 'String',  desc: 'Estado de entrega (ex: PENDING, SHIPPED, DELIVERED)' },
  { name: 'invoiceState',    type: 'String',  desc: 'Estado da nota fiscal (ex: PENDING, ISSUED)' },
  { name: 'customerId',      type: 'String',  desc: 'UUID do cliente' },
  { name: 'customerEmail',   type: 'String',  desc: 'E-mail do cliente' },
  { name: 'customerName',    type: 'String',  desc: 'Nome do cliente' },
  { name: 'paymentMethodId', type: 'String',  desc: 'UUID do método de pagamento' },
  { name: 'channel',         type: 'String',  desc: 'Canal de venda (ex: web, app, pdv)' },
  { name: 'reference',       type: 'String',  desc: 'Referência externa do pedido' },
  { name: 'createdAt',       type: 'String',  desc: 'Data/hora de criação' },
]

// Fields exposed by ScriptDelivery wrapper
const DELIVERY_FIELDS = [
  { name: 'id',              type: 'String',  desc: 'UUID da entrega' },
  { name: 'trackingNumber',  type: 'String',  desc: 'Código de rastreio' },
  { name: 'trackingUrl',     type: 'String',  desc: 'URL de rastreio' },
  { name: 'nfeRef',          type: 'String',  desc: 'Chave/referência da NF-e' },
  { name: 'nfeState',        type: 'String',  desc: 'Estado da NF-e (ex: AUTHORIZED, CANCELLED)' },
  { name: 'provider',        type: 'String',  desc: 'Transportadora (ex: CORREIOS, MELHOR_ENVIO)' },
  { name: 'providerStatus',  type: 'String',  desc: 'Status retornado pela transportadora' },
  { name: 'confirmed',       type: 'boolean', desc: 'Entrega confirmada pelo destinatário' },
  { name: 'createdAt',       type: 'String',  desc: 'Data/hora de criação' },
]

const CONTEXT_DOCS: Record<WorkflowOwnerType, { variable: string; type: string; description: string }[]> = {
  ORDER: [
    { variable: 'order',           type: 'ScriptOrder',    description: 'Pedido — order.id, order.status, order.customerEmail…' },
    { variable: 'requiresShipping', type: 'boolean',       description: 'Pedido requer envio' },
    { variable: 'invoiceRequired',  type: 'boolean',       description: 'Emissão de NF requerida' },
  ],
  PAYMENT: [
    { variable: 'order',           type: 'ScriptOrder',    description: 'Pedido — order.id, order.status, order.paymentMethodId…' },
    { variable: 'orderId',         type: 'String',         description: 'ID do pedido (atalho)' },
    { variable: 'paymentMethodId', type: 'String',         description: 'ID do método de pagamento (atalho)' },
    { variable: 'requiresShipping', type: 'boolean',       description: 'Requer envio' },
    { variable: 'invoiceRequired',  type: 'boolean',       description: 'Emissão de NF requerida' },
  ],
  DELIVERY: [
    { variable: 'order',           type: 'ScriptOrder',    description: 'Pedido — order.id, order.status…' },
    { variable: 'delivery',        type: 'ScriptDelivery', description: 'Entrega — delivery.id, delivery.trackingNumber, delivery.nfeRef…' },
    { variable: 'orderId',         type: 'String',         description: 'ID do pedido (atalho)' },
    { variable: 'deliveryId',      type: 'String',         description: 'ID da entrega (atalho)' },
    { variable: 'nfeRef',          type: 'String',         description: 'Referência da NF-e (atalho)' },
    { variable: 'requiresShipping', type: 'boolean',       description: 'Requer envio' },
    { variable: 'invoiceRequired',  type: 'boolean',       description: 'Emissão de NF requerida' },
  ],
  INVOICE: [
    { variable: 'order',           type: 'ScriptOrder',    description: 'Pedido — order.id, order.status…' },
    { variable: 'delivery',        type: 'ScriptDelivery', description: 'Entrega — delivery.id, delivery.nfeRef, delivery.nfeState…' },
    { variable: 'orderId',         type: 'String',         description: 'ID do pedido (atalho)' },
    { variable: 'deliveryId',      type: 'String',         description: 'ID da entrega (atalho)' },
    { variable: 'nfeRef',          type: 'String',         description: 'Referência da NF-e (atalho)' },
    { variable: 'requiresShipping', type: 'boolean',       description: 'Requer envio' },
    { variable: 'invoiceRequired',  type: 'boolean',       description: 'Emissão de NF requerida' },
  ],
  GENERIC: [],
}

const contextDocs = computed(() => CONTEXT_DOCS[props.ownerType] ?? [])

const MOCK_ORDER = {
  id: 'order-001', number: 1042, status: 'CONFIRMED',
  paymentState: 'PAID', deliveryState: 'PENDING', invoiceState: 'PENDING',
  customerId: 'cust-001', customerEmail: 'cliente@exemplo.com', customerName: 'João Silva',
  paymentMethodId: 'pm-001', channel: 'web', reference: null, createdAt: '2025-01-15T10:30:00'
}
const MOCK_DELIVERY = {
  id: 'del-001', trackingNumber: null, trackingUrl: null,
  nfeRef: null, nfeState: null, provider: 'CORREIOS',
  providerStatus: null, confirmed: false, createdAt: '2025-01-15T11:00:00'
}

const MOCK_PRESETS: Record<WorkflowOwnerType, Record<string, unknown>> = {
  ORDER: {
    order: MOCK_ORDER,
    requiresShipping: true,
    invoiceRequired: true
  },
  PAYMENT: {
    order: MOCK_ORDER,
    orderId: MOCK_ORDER.id,
    paymentMethodId: MOCK_ORDER.paymentMethodId,
    requiresShipping: true,
    invoiceRequired: false
  },
  DELIVERY: {
    order: MOCK_ORDER,
    delivery: MOCK_DELIVERY,
    orderId: MOCK_ORDER.id,
    deliveryId: MOCK_DELIVERY.id,
    nfeRef: '',
    requiresShipping: true,
    invoiceRequired: true
  },
  INVOICE: {
    order: MOCK_ORDER,
    delivery: { ...MOCK_DELIVERY, trackingNumber: 'BR123456789BR', nfeRef: 'NFe35250115478651000144550010000001231234567890', nfeState: 'AUTHORIZED', confirmed: true },
    orderId: MOCK_ORDER.id,
    deliveryId: MOCK_DELIVERY.id,
    nfeRef: 'NFe35250115478651000144550010000001231234567890',
    requiresShipping: true,
    invoiceRequired: true
  },
  GENERIC: {}
}

const TEMPLATES: Record<'groovy' | 'python', string> = {
  groovy: `// Variáveis disponíveis: order, delivery (DELIVERY/INVOICE), log, executionId
// Acesso Groovy: order.id, order.status, order.customerEmail
//                delivery.trackingNumber, delivery.nfeRef
log.info("Executando para pedido " + order.id)

// Sua lógica aqui

return [status: 'SUCCESS', message: 'OK']`,
  python: `# Variáveis disponíveis: order, delivery (DELIVERY/INVOICE), log, executionId
# Acesso Python: order.getId(), order.getStatus(), order.getCustomerEmail()
#                delivery.getTrackingNumber(), delivery.getNfeRef()
log.info("Executando para pedido " + order.getId())

# Sua lógica aqui

{"status": "SUCCESS", "message": "OK"}`
}

// ── Output declarations — what this script writes to context ─────────────────
const outputDeclarations = ref<OutputDeclaration[]>([])
const newOutputKey = ref('')
const newOutputType = ref('string')
const newOutputDesc = ref('')

function addOutputDeclaration() {
  if (!newOutputKey.value.trim()) return
  outputDeclarations.value.push({
    key: newOutputKey.value.trim(),
    type: newOutputType.value,
    description: newOutputDesc.value.trim(),
  })
  newOutputKey.value = ''
  newOutputDesc.value = ''
}

function removeOutputDeclaration(index: number) {
  outputDeclarations.value.splice(index, 1)
}

// ── Parse configData on open ──────────────────────────────────────────────────
function parseConfigData() {
  try {
    const cfg = JSON.parse(props.configData || '{}')
    language.value = cfg.language === 'python' ? 'python' : 'groovy'
    scriptContent.value = cfg.script ?? TEMPLATES[language.value]
    timeoutSeconds.value = cfg.timeoutSeconds ?? 10
    outputDeclarations.value = Array.isArray(cfg.outputDeclarations) ? cfg.outputDeclarations : []
  } catch {
    language.value = 'groovy'
    scriptContent.value = TEMPLATES.groovy
    timeoutSeconds.value = 10
    outputDeclarations.value = []
  }
  // Seed mock context for GENERIC: use upstream schema keys as hints
  if (props.ownerType === 'GENERIC' && props.contextSchema?.length) {
    const seed: Record<string, unknown> = {}
    for (const v of props.contextSchema) {
      if (v.key === '...') continue
      seed[v.key] = v.type === 'number' ? 0 : v.type === 'boolean' ? false : `sample_${v.key}`
    }
    mockContextJson.value = JSON.stringify(seed, null, 2)
  } else {
    mockContextJson.value = JSON.stringify(MOCK_PRESETS[props.ownerType] ?? {}, null, 2)
  }
  testResult.value = null
  validationResult.value = null
}

// ── Monaco initialization ─────────────────────────────────────────────────────
async function initEditor() {
  await nextTick()
  // Give the browser one frame to paint the container before Monaco measures it
  await new Promise<void>((resolve) => setTimeout(resolve, 50))
  if (!editorContainerRef.value) return
  if (editorInstance) {
    editorInstance.setValue(scriptContent.value)
    return
  }

  const monaco = await loader.init()
  monacoRef = monaco

  if (!monaco.languages.getLanguages().some((l:any) => l.id === 'groovy')) {
    monaco.languages.register({ id: 'groovy', extensions: ['.groovy'], aliases: ['Groovy'] })
    monaco.languages.setMonarchTokensProvider('groovy', {
      keywords: ['def', 'class', 'return', 'if', 'else', 'for', 'while', 'try', 'catch',
        'finally', 'new', 'null', 'true', 'false', 'import', 'package', 'void',
        'int', 'String', 'boolean', 'Map', 'List'],
      tokenizer: {
        root: [
          [/\/\/.*$/, 'comment'],
          [/\/\*/, 'comment', '@comment'],
          [/"([^"\\]|\\.)*"/, 'string'],
          [/'([^'\\]|\\.)*'/, 'string'],
          [/\b(def|class|return|if|else|for|while|try|catch|finally|new|null|true|false|import)\b/, 'keyword'],
          [/\b\d+(\.\d+)?\b/, 'number'],
          [/[a-zA-Z_$][\w$]*/, 'identifier'],
        ],
        comment: [
          [/[^/*]+/, 'comment'],
          [/\*\//, 'comment', '@pop'],
          [/[/*]/, 'comment'],
        ]
      }
    } as Monaco.languages.IMonarchLanguage)
  }

  if (!editorContainerRef.value) return
  editorInstance = monaco.editor.create(editorContainerRef.value, {
    value: scriptContent.value,
    language: language.value === 'groovy' ? 'groovy' : 'python',
    theme: 'vs-dark',
    automaticLayout: true,
    minimap: { enabled: false },
    fontSize: 13,
    lineNumbers: 'on',
    scrollBeyondLastLine: false,
    tabSize: 2,
    wordWrap: 'on',
    folding: true,
    renderLineHighlight: 'line',
    padding: { top: 12 }
  })

  editorInstance?.onDidChangeModelContent(() => {
    scriptContent.value = editorInstance!.getValue()
    validationResult.value = null
  })

  registerAutocomplete(monaco)

  // Load installed package signatures and re-register providers with them
  fetchPackageSignatures().then(() => {
    if (monacoRef) registerAutocomplete(monacoRef)
  })
}

function disposeEditor() {
  editorInstance?.dispose()
  editorInstance = null
  monacoRef = null
}

// ── Autocomplete ──────────────────────────────────────────────────────────────
let completionDisposables: Monaco.IDisposable[] = []

function registerAutocomplete(monaco: typeof Monaco) {
  // Dispose previous registrations to avoid duplicates when modal reopens
  completionDisposables.forEach(d => d.dispose())
  completionDisposables = []

  const isGroovy = () => language.value === 'groovy'

  // Build completion items for a list of fields on a given object variable
  function fieldItems(
    range: Monaco.IRange,
    objectName: string,
    fields: { name: string; type: string; desc: string }[],
  ): Monaco.languages.CompletionItem[] {
    return fields.map(f => {
      // Groovy: order.id  →  property access (no parens)
      // Python: order.getId()  →  method call
      const insertText = isGroovy() ? f.name : `get${f.name.charAt(0).toUpperCase()}${f.name.slice(1)}()`
      return {
        label: isGroovy() ? f.name : `get${f.name.charAt(0).toUpperCase()}${f.name.slice(1)}()`,
        kind: monaco.languages.CompletionItemKind.Field,
        detail: `${objectName}.${f.name} : ${f.type}`,
        documentation: f.desc,
        insertText,
        range,
      }
    })
  }

  // Helper: special case for isConfirmed / isX boolean fields in Python
  function deliveryBoolItems(
    range: Monaco.IRange,
  ): Monaco.languages.CompletionItem[] {
    if (isGroovy()) return [] // already covered by fieldItems via getConfirmed, but groovy uses .confirmed
    return [{
      label: 'isConfirmed()',
      kind: monaco.languages.CompletionItemKind.Method,
      detail: 'delivery.confirmed : boolean',
      documentation: 'Entrega confirmada pelo destinatário',
      insertText: 'isConfirmed()',
      range,
    }]
  }

  for (const lang of ['groovy', 'python'] as const) {
    const d = monaco.languages.registerCompletionItemProvider(lang, {
      triggerCharacters: ['.'],
      provideCompletionItems(model, position) {
        const lineText = model.getLineContent(position.lineNumber)
        const wordInfo = model.getWordUntilPosition(position)
        const range: Monaco.IRange = {
          startLineNumber: position.lineNumber,
          endLineNumber:   position.lineNumber,
          startColumn:     wordInfo.startColumn,
          endColumn:       wordInfo.endColumn,
        }

        // Detect which object is before the dot
        const beforeDot = lineText.slice(0, position.column - 1)

        if (/\border\b\s*\.$/.test(beforeDot)) {
          return { suggestions: fieldItems(range, 'order', ORDER_FIELDS) }
        }
        if (/\bdelivery\b\s*\.$/.test(beforeDot)) {
          return { suggestions: [...fieldItems(range, 'delivery', DELIVERY_FIELDS), ...deliveryBoolItems(range)] }
        }
        if (/\blog\b\s*\.$/.test(beforeDot)) {
          return {
            suggestions: ['info', 'warn', 'error'].map(m => ({
              label: `${m}(msg)`,
              kind: monaco.languages.CompletionItemKind.Method,
              detail: `log.${m}(String msg)`,
              documentation: `Emite uma linha de log com nível ${m.toUpperCase()}`,
              insertText: `${m}(\${1:msg})`,
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              range,
            })),
          }
        }
        if (/\bhttp\b\s*\.$/.test(beforeDot)) {
          const httpMethods = [
            { name: 'get',    sig: 'get(url)',           snippet: 'get(\${1:url})',                    doc: 'GET request — retorna {statusCode, ok, body, headers}' },
            { name: 'post',   sig: 'post(url, body)',    snippet: 'post(\${1:url}, \${2:body})',        doc: 'POST request com body (Map/String) — retorna {statusCode, ok, body, headers}' },
            { name: 'put',    sig: 'put(url, body)',     snippet: 'put(\${1:url}, \${2:body})',         doc: 'PUT request com body (Map/String) — retorna {statusCode, ok, body, headers}' },
            { name: 'delete', sig: 'delete(url)',        snippet: 'delete(\${1:url})',                  doc: 'DELETE request — retorna {statusCode, ok, body, headers}' },
          ]
          return {
            suggestions: httpMethods.map(m => ({
              label: m.sig,
              kind: monaco.languages.CompletionItemKind.Method,
              detail: `http.${m.sig} : Map`,
              documentation: m.doc,
              insertText: m.snippet,
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              range,
            })),
          }
        }

        // Top-level variable suggestions (no dot)
        const hasOwnerDelivery = ['DELIVERY', 'INVOICE'].includes(props.ownerType)
        const upstreamSuggestions = (props.contextSchema ?? [])
          .filter(v => v.key !== '...')
          .map(v => ({
            label: v.key,
            kind: monaco.languages.CompletionItemKind.Variable,
            detail: v.type,
            insertText: v.key,
            range,
            documentation: `[${v.source}] ${v.description}`,
          }))
        return {
          suggestions: [
            { label: 'order',        kind: monaco.languages.CompletionItemKind.Variable, detail: 'ScriptOrder',    insertText: 'order',        range, documentation: 'Objeto do pedido' },
            ...(hasOwnerDelivery ? [{ label: 'delivery', kind: monaco.languages.CompletionItemKind.Variable, detail: 'ScriptDelivery', insertText: 'delivery', range, documentation: 'Objeto da entrega' }] : []),
            { label: 'log',          kind: monaco.languages.CompletionItemKind.Variable, detail: 'ScriptLogger',     insertText: 'log',          range, documentation: 'log.info/warn/error(msg)' },
            { label: 'http',         kind: monaco.languages.CompletionItemKind.Variable, detail: 'ScriptHttpClient', insertText: 'http',         range, documentation: 'http.get(url) / post(url,body) / put(url,body) / delete(url) → {statusCode, ok, body, headers}' },
            { label: 'executionId',  kind: monaco.languages.CompletionItemKind.Variable, detail: 'String',           insertText: 'executionId',  range, documentation: 'ID da execução atual' },
            { label: 'requiresShipping', kind: monaco.languages.CompletionItemKind.Variable, detail: 'boolean', insertText: 'requiresShipping', range },
            { label: 'invoiceRequired',  kind: monaco.languages.CompletionItemKind.Variable, detail: 'boolean', insertText: 'invoiceRequired',  range },
            ...upstreamSuggestions,
          ],
        }
      },
    })
    completionDisposables.push(d)
  }

  // ── Dynamic providers for installed packages ─────────────────────────────
  for (const pkg of packageSignatures.value) {
    // Static triggers: package name + module name (e.g. "beautifulsoup4" → "bs4")
    const staticTriggers = [...new Set([pkg.packageName, pkg.moduleName])]
      .map(n => n.toLowerCase().replace(/[-]/g, '_'))

    for (const lang of ['groovy', 'python'] as const) {
      const d = monaco.languages.registerCompletionItemProvider(lang, {
        triggerCharacters: ['.'],
        provideCompletionItems(model, position) {
          const beforeDot = model.getLineContent(position.lineNumber).slice(0, position.column - 1)

          // Extract aliases from "import X as alias" anywhere in the script
          // e.g. "import pandas as pd" → pd is an alias for pandas
          const scriptContent = model.getValue()
          const aliasPattern = /import\s+([\w.]+)\s+as\s+(\w+)/g
          const dynamicAliases: string[] = []
          let m: RegExpExecArray | null
          while ((m = aliasPattern.exec(scriptContent)) !== null) {
            const importedName = m[1].toLowerCase().replace(/[-]/g, '_')
            const alias = m[2]
            if (staticTriggers.some(t => importedName === t || importedName.startsWith(t + '.'))) {
              dynamicAliases.push(alias)
            }
          }

          const allTriggers = [...staticTriggers, ...dynamicAliases]
          const matched = allTriggers.some(t => new RegExp(`\\b${t}\\b\\s*\\.\\s*$`).test(beforeDot))
          if (!matched) return { suggestions: [] }

          const wordInfo = model.getWordUntilPosition(position)
          const range: Monaco.IRange = {
            startLineNumber: position.lineNumber,
            endLineNumber:   position.lineNumber,
            startColumn:     wordInfo.startColumn,
            endColumn:       wordInfo.endColumn,
          }

          const suggestions: Monaco.languages.CompletionItem[] = pkg.members.map(m => {
            const isFunc = m.kind === 'function'
            // Groovy calls module functions directly; Python uses the same syntax
            const label = isFunc ? `${m.name}${m.signature}` : m.name
            const insertText = isFunc
              ? `${m.name}(${buildSnippetParams(m.signature)})`
              : m.name
            return {
              label,
              kind: isFunc
                ? monaco.languages.CompletionItemKind.Function
                : monaco.languages.CompletionItemKind.Class,
              detail: `${pkg.moduleName}.${m.name}`,
              documentation: m.doc || undefined,
              insertText,
              insertTextRules: isFunc
                ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
                : undefined,
              range,
            }
          })
          return { suggestions }
        },
      })
      completionDisposables.push(d)
    }
  }
}

/** Convert a Python signature string like "(url, data=None, **kwargs)" into a tabstop snippet */
function buildSnippetParams(signature: string): string {
  // Strip outer parens
  const inner = signature.replace(/^\(/, '').replace(/\)$/, '').trim()
  if (!inner) return ''
  const params = inner.split(',').map(p => p.trim()).filter(p => p && p !== '**kwargs' && p !== '*args' && p !== '/')
  return params.map((p, i) => {
    const name = p.split('=')[0].replace(/^\*+/, '').trim()
    return `\${${i + 1}:${name}}`
  }).join(', ')
}

onBeforeUnmount(() => {
  completionDisposables.forEach(d => d.dispose())
  completionDisposables = []
  disposeEditor()
})

watch(
  () => props.modelValue,
  async (open) => {
    if (open) {
      parseConfigData()
      await initEditor()
    } else {
      disposeEditor()
    }
  },
  { immediate: true }
)

watch(language, (lang) => {
  if (!editorInstance || !monacoRef) return
  const model = editorInstance.getModel()
  if (model) monacoRef.editor.setModelLanguage(model, lang === 'groovy' ? 'groovy' : 'python')
  editorInstance.setValue(TEMPLATES[lang])
  validationResult.value = null
})


// ── Validate ──────────────────────────────────────────────────────────────────
async function validateScript() {
  validating.value = true
  validationResult.value = null
  try {
    const res = await $axios.post('/api/v1/admin/workflows/script/validate', {
      language: language.value,
      script: scriptContent.value
    })
    const data = res.data
    validationResult.value = data
    if (!data.valid && data.line && monacoRef && editorInstance) {
      const model = editorInstance.getModel()
      if (model) {
        monacoRef.editor.setModelMarkers(model, 'script-validator', [{
          startLineNumber: data.line,
          startColumn: data.column ?? 1,
          endLineNumber: data.line,
          endColumn: (data.column ?? 1) + 80,
          message: data.error ?? 'Erro de sintaxe',
          severity: monacoRef.MarkerSeverity.Error
        }])
      }
    } else if (data.valid && monacoRef && editorInstance) {
      const model = editorInstance.getModel()
      if (model) monacoRef.editor.setModelMarkers(model, 'script-validator', [])
    }
  } finally {
    validating.value = false
  }
}

// ── Test ──────────────────────────────────────────────────────────────────────
async function runTest() {
  testRunning.value = true
  testResult.value = null
  try {
    let mockContext: Record<string, unknown> = {}
    try { mockContext = JSON.parse(mockContextJson.value || '{}') } catch { /* keep empty */ }
    const res = await $axios.post('/api/v1/admin/workflows/script/test', {
      language: language.value,
      script: scriptContent.value,
      ownerType: props.ownerType,
      mockContext
    })
    testResult.value = res.data
  } catch (err: any) {
    testResult.value = {
      success: false, logs: [], status: 'FAILURE',
      transitionKey: null, message: null, executionTimeMs: 0,
      error: err.response?.data?.message ?? err.message ?? 'Erro desconhecido'
    }
  } finally {
    testRunning.value = false
  }
}

// ── Dependencies ──────────────────────────────────────────────────────────────
type DepStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'INSTALLING' | 'INSTALLED' | 'FAILED'
interface Dependency {
  id: string
  packageName: string
  packageVersion: string | null
  status: DepStatus
  riskLevel: string | null
  requestedAt: string
  pypiInfo?: { summary?: string; downloadsLastMonth?: number; error?: string } | null
}

const showDepsPanel   = ref(false)
const deps            = ref<Dependency[]>([])
const depsLoading     = ref(false)
const newPkg          = ref('')
const newPkgVersion   = ref('')
const newPkgReason    = ref('')
const depSubmitting   = ref(false)
const depError        = ref('')

const DEP_STATUS_LABEL: Record<DepStatus, string> = {
  PENDING: 'Aguardando', APPROVED: 'Aprovado', REJECTED: 'Rejeitado',
  INSTALLING: 'Instalando', INSTALLED: 'Instalado', FAILED: 'Falhou'
}
const DEP_STATUS_CLASS: Record<DepStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-700', APPROVED: 'bg-blue-100 text-blue-700',
  REJECTED: 'bg-red-100 text-red-700', INSTALLING: 'bg-purple-100 text-purple-700',
  INSTALLED: 'bg-emerald-100 text-emerald-700', FAILED: 'bg-red-100 text-red-800',
}

async function loadDeps() {
  depsLoading.value = true
  try {
    const res = await $axios.get('/api/v1/admin/workflows/dependencies')
    deps.value = res.data.data ?? res.data
  } finally {
    depsLoading.value = false }
}

async function requestDep() {
  depError.value = ''
  if (!newPkg.value.trim()) { depError.value = 'Informe o nome do pacote'; return }
  if (newPkgReason.value.trim().length < 20) { depError.value = 'Justificativa muito curta (mín. 20 caracteres)'; return }
  depSubmitting.value = true
  try {
    await $axios.post('/api/v1/admin/workflows/dependencies', {
      packageName: newPkg.value.trim(),
      packageVersion: newPkgVersion.value.trim() || null,
      justification: newPkgReason.value.trim()
    })
    newPkg.value = ''
    newPkgVersion.value = ''
    newPkgReason.value = ''
    await loadDeps()
  } catch (e: any) {
    depError.value = e.response?.data?.message ?? 'Erro ao enviar solicitação'
  } finally {
    depSubmitting.value = false
  }
}

watch(showDepsPanel, (open) => { if (open && !deps.value.length) loadDeps() })

// ── Save ──────────────────────────────────────────────────────────────────────
function save() {
  const payload: Record<string, unknown> = {
    language: language.value,
    script: scriptContent.value,
    timeoutSeconds: timeoutSeconds.value,
  }
  if (outputDeclarations.value.length) {
    payload.outputDeclarations = outputDeclarations.value
  }
  emit('save', JSON.stringify(payload))
  emit('update:modelValue', false)
}

function close() {
  emit('update:modelValue', false)
}
</script>

<template>
  <teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 flex flex-col bg-[#1e1e1e]"
      style="z-index: 9999;"
    >
      <!-- Header bar -->
      <div class="flex shrink-0 items-center gap-3 border-b border-white/10 bg-[#252526] px-4 py-2.5">

        <!-- Language pills -->
        <div class="flex items-center gap-1 rounded-lg bg-white/10 p-1">
          <button
            class="rounded px-3 py-1 text-xs font-medium transition"
            :class="language === 'python' ? 'bg-teal-600 text-white shadow' : 'text-slate-400 hover:text-white'"
            @click="language = 'python'"
          >Python</button>
        </div>

        <!-- Timeout -->
        <div class="flex items-center gap-1.5 text-xs text-slate-400">
          <span>Timeout</span>
          <input
            v-model.number="timeoutSeconds"
            type="number" min="1" max="60"
            class="w-14 rounded bg-white/10 px-2 py-1 text-center text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
          <span>s</span>
        </div>

        <div class="flex items-center gap-2">
          <!-- Deps toggle -->
          <button
            class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition"
            :class="showDepsPanel ? 'bg-teal-600 text-white' : 'bg-white/10 text-slate-300 hover:bg-white/20'"
            @click="showDepsPanel = !showDepsPanel"
          >
            <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
            </svg>
            Pacotes
            <span v-if="deps.filter(d => d.status === 'INSTALLED').length"
                  class="rounded-full bg-teal-400/30 px-1.5 py-0.5 text-[10px]">
              {{ deps.filter(d => d.status === 'INSTALLED').length }}
            </span>
          </button>
        </div>

        <div class="ml-auto flex items-center gap-2">
          <!-- Validate -->
          <button
            class="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/20 disabled:opacity-50"
            :disabled="validating"
            @click="validateScript"
          >
            <svg v-if="validating" class="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            <svg v-else class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Validar
          </button>

          <!-- Validation badge -->
          <span
            v-if="validationResult"
            class="rounded-full px-2 py-0.5 text-xs font-medium"
            :class="validationResult.valid ? 'bg-emerald-900/60 text-emerald-300' : 'bg-red-900/60 text-red-300'"
          >
            {{ validationResult.valid ? '✓ Válido' : '✗ ' + (validationResult.error?.slice(0, 50) ?? 'Erro') }}
          </span>

          <!-- Save -->
          <button
            class="flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-teal-500"
            @click="save"
          >
            <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            Salvar
          </button>

          <!-- Close -->
          <button
            class="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
            title="Fechar (Esc)"
            @click="close"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- 3-column body -->
      <div class="flex min-h-0 flex-1 overflow-hidden">

        <!-- Left: Context docs (220px) -->
        <div class="flex w-52 shrink-0 flex-col border-r border-white/10 bg-[#252526] overflow-y-auto">
          <div class="border-b border-white/10 px-3 py-2">
            <p class="text-[10px] font-semibold uppercase tracking-wider text-teal-400">Contexto</p>
            <p class="text-[10px] text-slate-500 mt-0.5">ownerType: {{ ownerType }}</p>
          </div>
          <div class="flex-1 overflow-y-auto p-3 space-y-3">

            <!-- Always available -->
            <div>
              <p class="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Sempre disponíveis</p>
              <div class="space-y-1.5">
                <div class="rounded bg-black/30 px-2 py-1.5 text-[11px]">
                  <code class="text-teal-300">log</code>
                  <p class="mt-0.5 text-[10px] text-slate-500">log.info/warn/error(msg)</p>
                </div>
                <div class="rounded bg-black/30 px-2 py-1.5 text-[11px]">
                  <code class="text-teal-300">executionId</code>
                  <p class="mt-0.5 text-[10px] text-slate-500">String — ID da execução</p>
                </div>
              </div>
            </div>


            <!-- Owner bindings (static entity fields for ORDER/DELIVERY) -->
            <div v-if="contextDocs.length">
              <p class="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Do workflow</p>
              <div class="space-y-1.5">
                <template v-for="doc in contextDocs" :key="doc.variable">
                  <div v-if="doc.type === 'ScriptOrder' || doc.type === 'ScriptDelivery'" class="rounded bg-black/30 text-[11px]">
                    <div class="flex items-baseline gap-1 px-2 py-1.5">
                      <code class="text-teal-300">{{ doc.variable }}</code>
                      <span class="text-[10px] text-purple-400">{{ doc.type }}</span>
                    </div>
                    <div class="border-t border-white/5 px-2 pb-1.5 pt-1 space-y-0.5">
                      <div
                        v-for="f in (doc.type === 'ScriptOrder' ? ORDER_FIELDS : DELIVERY_FIELDS)"
                        :key="f.name"
                        class="flex items-baseline gap-1 text-[10px]"
                      >
                        <code class="text-sky-400 shrink-0">
                          {{ language === 'groovy' ? doc.variable + '.' + f.name : doc.variable + '.get' + f.name.charAt(0).toUpperCase() + f.name.slice(1) + '()' }}
                        </code>
                        <span class="text-slate-600 shrink-0">{{ f.type }}</span>
                      </div>
                    </div>
                  </div>
                  <div v-else class="rounded bg-black/30 px-2 py-1.5 text-[11px]">
                    <div class="flex items-baseline gap-1">
                      <code class="text-teal-300">{{ doc.variable }}</code>
                      <span class="text-[10px] text-slate-600">{{ doc.type }}</span>
                    </div>
                    <p class="mt-0.5 text-[10px] text-slate-500">{{ doc.description }}</p>
                  </div>
                </template>
              </div>
            </div>

            <!-- Upstream graph context (inferred from previous nodes) -->
            <div v-if="contextSchema?.length">
              <p class="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-amber-500">Nós anteriores</p>
              <div class="space-y-1">
                <div
                  v-for="v in contextSchema"
                  :key="v.key + v.source"
                  class="rounded bg-amber-900/20 px-2 py-1.5 text-[11px] border border-amber-900/30"
                >
                  <div class="flex items-baseline gap-1.5">
                    <code class="text-amber-300 shrink-0">{{ v.key }}</code>
                    <span class="text-[10px] text-slate-500 shrink-0">{{ v.type }}</span>
                    <span class="text-[9px] text-slate-600 ml-auto shrink-0">{{ v.source }}</span>
                  </div>
                  <p v-if="v.description" class="mt-0.5 text-[10px] text-slate-500 leading-tight">{{ v.description }}</p>
                </div>
              </div>
            </div>

            <!-- Return format -->
            <div>
              <p class="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Retorno</p>
              <pre v-if="language === 'groovy'" class="rounded bg-black/30 px-2 py-2 text-[10px] text-green-400 leading-[1.6] whitespace-pre-wrap">return [
  status: 'SUCCESS',
  transitionKey: 'chave',
  message: 'msg',
  // opcional — escreve no contexto:
  context: [chave: valor]
]</pre>
              <pre v-else class="rounded bg-black/30 px-2 py-2 text-[10px] text-green-400 leading-[1.6] whitespace-pre-wrap">{
  "status": "SUCCESS",
  "transitionKey": "chave",
  "message": "msg",
  "context": {"chave": valor}
}</pre>
            </div>

            <!-- Output declarations — what this script writes -->
            <div>
              <p class="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-400">Este script produz</p>
              <p class="mb-2 text-[9px] text-slate-600 leading-tight">Declare as chaves que este script escreve em <code class="text-green-400">context</code> para que nós posteriores saibam o que esperar.</p>
              <div v-if="outputDeclarations.length" class="mb-2 space-y-1">
                <div
                  v-for="(d, i) in outputDeclarations"
                  :key="i"
                  class="flex items-start gap-1 rounded bg-indigo-900/20 border border-indigo-900/30 px-2 py-1.5 text-[11px]"
                >
                  <div class="flex-1 min-w-0">
                    <div class="flex items-baseline gap-1">
                      <code class="text-indigo-300">{{ d.key }}</code>
                      <span class="text-[10px] text-slate-500">{{ d.type }}</span>
                    </div>
                    <p v-if="d.description" class="text-[10px] text-slate-500 mt-0.5 truncate">{{ d.description }}</p>
                  </div>
                  <button class="shrink-0 text-slate-600 hover:text-red-400 transition text-[11px] leading-none mt-0.5" @click="removeOutputDeclaration(i)">✕</button>
                </div>
              </div>
              <!-- Add new declaration -->
              <div class="space-y-1">
                <input
                  v-model="newOutputKey"
                  class="w-full rounded bg-black/30 px-2 py-1 text-[11px] font-mono text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="nome_da_chave"
                  @keydown.enter.prevent="addOutputDeclaration"
                />
                <div class="flex gap-1">
                  <select
                    v-model="newOutputType"
                    class="rounded bg-black/30 px-1.5 py-1 text-[11px] text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="string">string</option>
                    <option value="number">number</option>
                    <option value="boolean">boolean</option>
                    <option value="object">object</option>
                    <option value="array">array</option>
                  </select>
                  <input
                    v-model="newOutputDesc"
                    class="flex-1 min-w-0 rounded bg-black/30 px-2 py-1 text-[11px] text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="descrição"
                    @keydown.enter.prevent="addOutputDeclaration"
                  />
                  <button
                    class="shrink-0 rounded bg-indigo-700 px-2 py-1 text-[11px] text-white hover:bg-indigo-600 transition disabled:opacity-40"
                    :disabled="!newOutputKey.trim()"
                    @click="addOutputDeclaration"
                  >+</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Center: Monaco editor (flex-1) -->
        <div class="flex flex-1 flex-col min-w-0">
          <div class="border-b border-white/10 px-4 py-1.5">
            <span class="text-[11px] text-slate-500">script.{{ language === 'groovy' ? 'groovy' : 'py' }}</span>
          </div>
          <div ref="editorContainerRef" class="flex-1" />
        </div>

        <!-- Deps panel (280px, conditional) -->
        <div v-if="showDepsPanel" class="flex w-72 shrink-0 flex-col border-l border-white/10 bg-[#1a1a2e]">
          <div class="border-b border-white/10 px-3 py-2 flex items-center justify-between">
            <p class="text-[10px] font-semibold uppercase tracking-wider text-teal-400">Pacotes Python</p>
            <button class="text-slate-500 hover:text-white text-xs" @click="loadDeps">↻</button>
          </div>
          <div class="flex flex-1 flex-col overflow-y-auto p-3 gap-3">

            <!-- Installed packages used in script -->
            <div>
              <p class="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Seus pacotes</p>
              <div v-if="depsLoading" class="text-[11px] text-slate-500 italic">Carregando…</div>
              <div v-else-if="!deps.length" class="text-[11px] text-slate-500 italic">Nenhum pacote solicitado</div>
              <div v-else class="space-y-1.5">
                <div v-for="d in deps" :key="d.id" class="rounded bg-black/30 px-2 py-1.5 text-[11px]">
                  <div class="flex items-center justify-between gap-1">
                    <code class="text-teal-300">{{ d.packageName }}<span v-if="d.packageVersion" class="text-slate-500">==={{ d.packageVersion }}</span></code>
                    <span class="rounded-full px-1.5 py-0.5 text-[9px] font-semibold shrink-0" :class="DEP_STATUS_CLASS[d.status]">
                      {{ DEP_STATUS_LABEL[d.status] }}
                    </span>
                  </div>
                  <p v-if="d.pypiInfo?.summary" class="mt-0.5 text-[10px] text-slate-500 truncate">{{ d.pypiInfo.summary }}</p>
                  <div v-if="d.riskLevel && d.status !== 'REJECTED'" class="mt-0.5">
                    <span class="text-[9px] font-semibold px-1 py-0.5 rounded"
                          :class="{ LOW: 'text-emerald-400', MEDIUM: 'text-amber-400', HIGH: 'text-orange-400', CRITICAL: 'text-red-400' }[d.riskLevel] ?? 'text-slate-400'">
                      Risco {{ d.riskLevel }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Request new -->
            <div class="border-t border-white/10 pt-3">
              <p class="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Solicitar pacote</p>
              <div class="space-y-2">
                <div class="flex gap-1.5">
                  <input v-model="newPkg" placeholder="nome-do-pacote"
                    class="flex-1 min-w-0 rounded bg-black/30 px-2 py-1.5 text-[11px] font-mono text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500" />
                  <input v-model="newPkgVersion" placeholder="1.0.0"
                    class="w-16 rounded bg-black/30 px-2 py-1.5 text-[11px] font-mono text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500" />
                </div>
                <textarea v-model="newPkgReason" placeholder="Por que você precisa deste pacote? (mín. 20 chars)"
                  class="w-full resize-none rounded bg-black/30 px-2 py-1.5 text-[11px] text-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  rows="3" />
                <p v-if="depError" class="text-[10px] text-red-400">{{ depError }}</p>
                <button
                  class="flex w-full items-center justify-center gap-1.5 rounded-lg bg-teal-700/80 py-2 text-[11px] font-semibold text-white transition hover:bg-teal-600 disabled:opacity-50"
                  :disabled="depSubmitting"
                  @click="requestDep"
                >
                  {{ depSubmitting ? 'Enviando…' : 'Enviar solicitação' }}
                </button>
              </div>
              <p class="mt-2 text-[10px] text-slate-600 leading-[1.5]">
                A equipe revisará a solicitação. Após aprovação, o pacote será instalado e disponível para import no seu script.
              </p>
            </div>
          </div>
        </div>

        <!-- Right: Test panel (288px) -->
        <div class="flex w-72 shrink-0 flex-col border-l border-white/10 bg-[#252526]">
          <div class="border-b border-white/10 px-3 py-2">
            <p class="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Painel de Teste</p>
          </div>
          <div class="flex flex-1 flex-col overflow-y-auto p-3 gap-3">

            <!-- Mock context -->
            <div>
              <p class="mb-1 text-[10px] font-medium text-slate-500">Contexto mock (JSON)</p>
              <textarea
                v-model="mockContextJson"
                class="w-full resize-none rounded bg-black/30 px-2 py-2 text-[11px] font-mono text-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
                rows="9"
                placeholder="{}"
              />
            </div>

            <button
              class="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-700 py-2.5 text-xs font-semibold text-white transition hover:bg-teal-600 disabled:opacity-50"
              :disabled="testRunning"
              @click="runTest"
            >
              <svg v-if="testRunning" class="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              <svg v-else class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3l14 9-14 9V3z"/>
              </svg>
              {{ testRunning ? 'Executando...' : 'Executar teste' }}
            </button>

            <!-- Results -->
            <div v-if="testResult" class="flex flex-col gap-2">
              <div class="flex items-center justify-between">
                <span
                  class="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                  :class="testResult.success ? 'bg-emerald-900/60 text-emerald-300' : 'bg-red-900/60 text-red-300'"
                >
                  {{ testResult.status ?? (testResult.success ? 'SUCCESS' : 'FAILURE') }}
                </span>
                <span class="text-[10px] text-slate-500">{{ testResult.executionTimeMs }}ms</span>
              </div>

              <div v-if="testResult.transitionKey" class="text-[11px]">
                <span class="text-slate-500">transitionKey: </span>
                <code class="text-teal-400">{{ testResult.transitionKey }}</code>
              </div>
              <div v-if="testResult.message" class="text-[11px] text-slate-400">
                <span class="text-slate-500">message: </span>{{ testResult.message }}
              </div>
              <div v-if="testResult.error" class="rounded bg-red-900/30 px-2 py-1.5 text-[11px] text-red-400">
                {{ testResult.error }}
              </div>

              <div v-if="testResult.logs?.length">
                <p class="mb-1 text-[10px] text-slate-500">Console</p>
                <div class="max-h-40 overflow-y-auto rounded bg-black/40 p-2">
                  <p
                    v-for="(line, i) in testResult.logs"
                    :key="i"
                    class="font-mono text-[10px] leading-5"
                    :class="{
                      'text-slate-300': line.startsWith('[INFO]'),
                      'text-amber-400': line.startsWith('[WARN]'),
                      'text-red-400':   line.startsWith('[ERROR]')
                    }"
                  >{{ line }}</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>
