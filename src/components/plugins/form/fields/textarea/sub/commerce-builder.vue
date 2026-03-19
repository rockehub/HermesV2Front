<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useFormContext } from 'vee-validate'
import type { BaseFieldProps, TextareaFieldSchema } from '@/classes/form/schemas'
import {
  conditionProviderOptions,
  createDefaultConditionState,
  createDefaultProcessBlueprint,
  createEmptyProcessStep,
  parseConditionState,
  parseProcessBlueprint,
  processStepTypeOptions,
  resolveVisualBuilderMode,
  serializeConditionState,
  serializeProcessBlueprint,
  supportsVisualConditionProvider,
  type ConditionBuilderState,
  type ProcessBlueprint,
  type ProcessStepDefinition
} from '@/bin/platform/hermes/utils/commerceFlowBuilders'

const props = defineProps<BaseFieldProps<TextareaFieldSchema> & { params: any }>()

const form = useFormContext<Record<string, any>>()
const editorTab = ref<'visual' | 'raw'>('visual')
const rawJson = ref('')
const visualUnavailable = ref(false)

const fieldCode = computed(() => props.params.config.code as string)
const builderMode = computed(() => resolveVisualBuilderMode(fieldCode.value))
const provider = computed(() => String(form?.values?.provider ?? props.initialValues?.provider ?? ''))
const currentFieldValue = computed(() => {
  const formValue = form?.values?.[fieldCode.value]
  if (typeof formValue === 'string') {
    return formValue
  }
  const initialValue = props.initialValues?.[fieldCode.value]
  return typeof initialValue === 'string' ? initialValue : ''
})

const conditionState = reactive<ConditionBuilderState>(createDefaultConditionState(provider.value))
const processBlueprint = reactive<ProcessBlueprint>(createDefaultProcessBlueprint(fieldCode.value))

const availableProcessTypes = computed(() => processStepTypeOptions(fieldCode.value))
const canUseVisualCondition = computed(
  () => builderMode.value === 'condition' && supportsVisualConditionProvider(provider.value)
)
const canUseVisualProcess = computed(() => builderMode.value === 'process')
const canUseVisualEditor = computed(() => canUseVisualCondition.value || canUseVisualProcess.value)

function syncFieldValue(nextValue: string) {
  if (!props.field) {
    return
  }
  props.field.onInput?.({ target: { value: nextValue } })
  props.field.onChange?.({ target: { value: nextValue } })
}

function normalizeMultilineInput(value: string): string[] {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter((item, index, array) => item.length > 0 && array.indexOf(item) === index)
}

const vendorList = computed({
  get: () => conditionState.vendorsAvailable.join('\n'),
  set: (value: string) => {
    conditionState.vendorsAvailable = normalizeMultilineInput(value)
  }
})

const channelList = computed({
  get: () => conditionState.channels.join('\n'),
  set: (value: string) => {
    conditionState.channels = normalizeMultilineInput(value)
  }
})

const countryList = computed({
  get: () => conditionState.countryIds.join('\n'),
  set: (value: string) => {
    conditionState.countryIds = normalizeMultilineInput(value)
  }
})

function resetConditionState(nextProvider: string, rawValue: string) {
  const parsed = parseConditionState(nextProvider, rawValue)
  Object.assign(conditionState, parsed)
}

function resetProcessBlueprint(rawValue: string) {
  const parsed = parseProcessBlueprint(fieldCode.value, rawValue)
  processBlueprint.version = parsed.version
  processBlueprint.startStepId = parsed.startStepId
  processBlueprint.steps.splice(0, processBlueprint.steps.length, ...parsed.steps)
}

function initializeEditor() {
  rawJson.value = currentFieldValue.value
  visualUnavailable.value = false

  if (builderMode.value === 'condition') {
    if (supportsVisualConditionProvider(provider.value)) {
      resetConditionState(provider.value, rawJson.value)
      editorTab.value = 'visual'
      return
    }
    editorTab.value = 'raw'
    visualUnavailable.value = provider.value.length > 0
    return
  }

  if (builderMode.value === 'process') {
    resetProcessBlueprint(rawJson.value)
    editorTab.value = 'visual'
    return
  }

  editorTab.value = 'raw'
}

watch([builderMode, provider, currentFieldValue], initializeEditor, { immediate: true })

const serializedVisualValue = computed(() => {
  if (builderMode.value === 'condition') {
    return serializeConditionState(provider.value, conditionState)
  }
  if (builderMode.value === 'process') {
    return serializeProcessBlueprint(processBlueprint)
  }
  return rawJson.value
})

const effectiveValue = computed(() => (editorTab.value === 'raw' ? rawJson.value : serializedVisualValue.value))

watch(effectiveValue, (nextValue) => {
  syncFieldValue(nextValue)
}, { immediate: true })

function selectProvider(nextProvider: string) {
  form?.setFieldValue?.('provider', nextProvider)
  rawJson.value = ''
}

function addStep() {
  const nextStep = createEmptyProcessStep(fieldCode.value, processBlueprint.steps.length + 1)
  processBlueprint.steps.push(nextStep)
  if (!processBlueprint.startStepId) {
    processBlueprint.startStepId = nextStep.id
  }
}

function removeStep(stepId: string) {
  const nextSteps = processBlueprint.steps.filter((step) => step.id !== stepId)
  processBlueprint.steps.splice(0, processBlueprint.steps.length, ...nextSteps)
  processBlueprint.steps.forEach((step) => {
    step.nextIds = step.nextIds.filter((nextId) => nextId !== stepId)
  })
  if (processBlueprint.startStepId === stepId) {
    processBlueprint.startStepId = processBlueprint.steps[0]?.id ?? null
  }
}

function toggleTransition(step: ProcessStepDefinition, targetStepId: string, enabled: boolean) {
  const nextIds = step.nextIds.filter((id) => id !== targetStepId)
  if (enabled) {
    nextIds.push(targetStepId)
  }
  step.nextIds = Array.from(new Set(nextIds))
}

function resetProcessTemplate() {
  const nextBlueprint = createDefaultProcessBlueprint(fieldCode.value)
  processBlueprint.version = nextBlueprint.version
  processBlueprint.startStepId = nextBlueprint.startStepId
  processBlueprint.steps.splice(0, processBlueprint.steps.length, ...nextBlueprint.steps)
}
</script>

<template>
  <div class="space-y-4">
    <textarea v-bind="field" :value="effectiveValue" class="hidden" />

    <div class="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-navy-600 dark:bg-navy-800/40">
      <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p class="text-sm font-semibold text-slate-700 dark:text-navy-100">
            {{ builderMode === 'condition' ? 'Editor visual de condicao' : 'Editor visual de processo' }}
          </p>
          <p class="mt-1 text-xs text-slate-500 dark:text-navy-300">
            {{ builderMode === 'condition'
              ? 'O JSON salvo continua no formato do backend, mas a configuracao fica editavel em blocos.'
              : 'Monte um blueprint leve de etapas e transicoes para o processo comercial.' }}
          </p>
        </div>

        <div class="inline-flex rounded-full bg-white p-1 shadow-sm dark:bg-navy-700">
          <button
            type="button"
            class="rounded-full px-3 py-1.5 text-xs font-medium transition"
            :class="editorTab === 'visual'
              ? 'bg-primary text-white dark:bg-accent'
              : 'text-slate-500 hover:text-slate-700 dark:text-navy-200 dark:hover:text-navy-50'"
            :disabled="!canUseVisualEditor"
            @click="editorTab = 'visual'"
          >
            Visual
          </button>
          <button
            type="button"
            class="rounded-full px-3 py-1.5 text-xs font-medium transition"
            :class="editorTab === 'raw'
              ? 'bg-primary text-white dark:bg-accent'
              : 'text-slate-500 hover:text-slate-700 dark:text-navy-200 dark:hover:text-navy-50'"
            @click="editorTab = 'raw'"
          >
            JSON
          </button>
        </div>
      </div>

      <div v-if="builderMode === 'condition'" class="mt-4 space-y-4">
        <div>
          <p class="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-navy-300">
            Provider da condicao
          </p>
          <div class="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            <button
              v-for="option in conditionProviderOptions"
              :key="option.id"
              type="button"
              class="rounded-2xl border p-3 text-left transition"
              :class="provider === option.id
                ? 'border-primary bg-primary/5 text-primary dark:border-accent dark:bg-accent/10 dark:text-accent-light'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-navy-600 dark:bg-navy-700/40 dark:text-navy-100 dark:hover:border-navy-500'"
              @click="selectProvider(option.id)"
            >
              <p class="text-sm font-semibold">{{ option.label }}</p>
              <p class="mt-1 text-xs opacity-80">{{ option.description }}</p>
            </button>
          </div>
        </div>

        <div
          v-if="visualUnavailable"
          class="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200"
        >
          O provider atual nao tem template visual. O campo continua editavel no modo JSON bruto.
        </div>

        <template v-if="editorTab === 'visual' && canUseVisualCondition">
          <div v-if="provider === 'order_value'" class="grid gap-4 md:grid-cols-3">
            <label class="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-navy-300">
              Escopo
              <select v-model="conditionState.scope" class="form-select mt-2 w-full rounded-xl">
                <option value="order_total">Total do pedido</option>
                <option value="product_total">Total de produtos</option>
                <option value="pre_payment_total">Total antes do pagamento</option>
              </select>
            </label>
            <label class="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-navy-300">
              Operador
              <select v-model="conditionState.operator" class="form-select mt-2 w-full rounded-xl">
                <option value="greater_than">Maior que</option>
                <option value="greater_or_equal">Maior ou igual</option>
                <option value="equal_to">Igual</option>
                <option value="less_than">Menor que</option>
                <option value="less_or_equal">Menor ou igual</option>
              </select>
            </label>
            <label class="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-navy-300">
              Unidade
              <select v-model="conditionState.unit" class="form-select mt-2 w-full rounded-xl">
                <option value="major">Valor principal</option>
                <option value="minor">Centavos</option>
              </select>
            </label>
            <label class="block md:col-span-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-navy-300">
              Valor
              <input v-model.number="conditionState.amount" type="number" min="0" step="0.01" class="form-input mt-2 w-full rounded-xl" />
            </label>
          </div>

          <label v-else-if="provider === 'vendor'" class="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-navy-300">
            Vendors liberados
            <textarea v-model="vendorList" rows="6" class="form-textarea mt-2 w-full rounded-xl" placeholder="Um UUID por linha ou separado por virgula"></textarea>
          </label>

          <div v-else-if="provider === 'channel'" class="grid gap-4 md:grid-cols-2">
            <label class="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-navy-300">
              Operador
              <select v-model="conditionState.operator" class="form-select mt-2 w-full rounded-xl">
                <option value="enable_in">Habilitar em</option>
                <option value="disable_in">Desabilitar em</option>
              </select>
            </label>
            <label class="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-navy-300 md:col-span-2">
              Canais
              <textarea v-model="channelList" rows="4" class="form-textarea mt-2 w-full rounded-xl" placeholder="web, admin, marketplace"></textarea>
            </label>
          </div>

          <label v-else-if="provider === 'shipping_country'" class="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-navy-300">
            Paises aceitos
            <textarea v-model="countryList" rows="6" class="form-textarea mt-2 w-full rounded-xl" placeholder="UUIDs dos paises, um por linha"></textarea>
          </label>

          <div v-else-if="provider === 'delivery_date'" class="grid gap-4 md:grid-cols-3">
            <label class="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-navy-300">
              Operador
              <select v-model="conditionState.operator" class="form-select mt-2 w-full rounded-xl">
                <option value="equal_to">Igual a</option>
                <option value="greater_than">Maior que</option>
                <option value="less_than">Menor que</option>
              </select>
            </label>
            <label class="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-navy-300">
              Base
              <select v-model="conditionState.operation" class="form-select mt-2 w-full rounded-xl">
                <option value="calendar_days">Dias corridos</option>
                <option value="business_days">Dias uteis</option>
              </select>
            </label>
            <label class="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-navy-300">
              Granularidade
              <select v-model="conditionState.method" class="form-select mt-2 w-full rounded-xl">
                <option value="day">Dia</option>
                <option value="week">Semana</option>
                <option value="month">Mes</option>
                <option value="year">Ano</option>
              </select>
            </label>
            <label class="block md:col-span-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-navy-300">
              Valor
              <input v-model.number="conditionState.value" type="number" min="0" step="1" class="form-input mt-2 w-full rounded-xl" />
            </label>
          </div>

          <div v-else-if="provider === 'installment_count'" class="grid gap-4 md:grid-cols-2">
            <label class="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-navy-300">
              Operador
              <select v-model="conditionState.operator" class="form-select mt-2 w-full rounded-xl">
                <option value="equal_to">Igual a</option>
                <option value="greater_than">Maior que</option>
                <option value="less_than">Menor que</option>
              </select>
            </label>
            <label class="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-navy-300">
              Numero de parcelas
              <input v-model.number="conditionState.value" type="number" min="1" step="1" class="form-input mt-2 w-full rounded-xl" />
            </label>
          </div>

          <label v-else-if="provider === 'payment_provider'" class="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-navy-300">
            Provider exigido
            <input v-model="conditionState.paymentProvider" type="text" class="form-input mt-2 w-full rounded-xl" placeholder="card, pix, pagarme, stripewallet" />
          </label>

          <div v-else-if="provider === 'vendors_connected_to_stripe'" class="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200">
            Esta condicao nao precisa de payload adicional. O backend so valida se os vendors do split possuem conexao Stripe.
          </div>
        </template>
      </div>

      <div v-else-if="builderMode === 'process'" class="mt-4 space-y-4">
        <div v-if="editorTab === 'visual'" class="space-y-4">
          <div class="flex flex-wrap gap-2">
            <button type="button" class="btn rounded-full border border-primary px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary hover:text-white dark:border-accent dark:text-accent-light dark:hover:bg-accent dark:hover:text-white" @click="addStep">
              Adicionar etapa
            </button>
            <button type="button" class="btn rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-navy-500 dark:text-navy-100 dark:hover:bg-navy-700" @click="resetProcessTemplate">
              Restaurar template
            </button>
          </div>

          <div class="space-y-4">
            <article
              v-for="(step, index) in processBlueprint.steps"
              :key="step.id"
              class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-navy-600 dark:bg-navy-700/40"
            >
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="text-sm font-semibold text-slate-700 dark:text-navy-100">Etapa {{ index + 1 }}</p>
                  <p class="text-xs text-slate-400 dark:text-navy-300">ID {{ step.id.slice(0, 8) }}</p>
                </div>
                <button type="button" class="text-xs font-semibold text-error" @click="removeStep(step.id)">
                  Remover
                </button>
              </div>

              <div class="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <label class="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-navy-300">
                  Nome
                  <input v-model="step.name" type="text" class="form-input mt-2 w-full rounded-xl" />
                </label>
                <label class="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-navy-300">
                  Codigo
                  <input v-model="step.code" type="text" class="form-input mt-2 w-full rounded-xl" />
                </label>
                <label class="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-navy-300">
                  Tipo
                  <select v-model="step.type" class="form-select mt-2 w-full rounded-xl">
                    <option v-for="type in availableProcessTypes" :key="type" :value="type">{{ type }}</option>
                  </select>
                </label>
                <label class="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-navy-300">
                  Provider
                  <input v-model="step.provider" type="text" class="form-input mt-2 w-full rounded-xl" placeholder="focus, card, correios..." />
                </label>
              </div>

              <div class="mt-4 grid gap-4 lg:grid-cols-[220px,1fr]">
                <label class="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600 dark:border-navy-600 dark:bg-navy-800 dark:text-navy-100">
                  <input v-model="processBlueprint.startStepId" :value="step.id" type="radio" name="start-step" class="form-radio" />
                  Etapa inicial
                </label>

                <div class="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 dark:border-navy-600 dark:bg-navy-800">
                  <p class="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-navy-300">
                    Proximas etapas
                  </p>
                  <div class="grid gap-2 md:grid-cols-2">
                    <label
                      v-for="target in processBlueprint.steps.filter((candidate) => candidate.id !== step.id)"
                      :key="target.id"
                      class="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 dark:border-navy-500 dark:bg-navy-700 dark:text-navy-100"
                    >
                      <input
                        :checked="step.nextIds.includes(target.id)"
                        type="checkbox"
                        class="form-checkbox"
                        @change="toggleTransition(step, target.id, ($event.target as HTMLInputElement).checked)"
                      />
                      <span>{{ target.name }}</span>
                    </label>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>
      </div>

      <div v-if="editorTab === 'raw'" class="mt-4">
        <textarea
          v-model="rawJson"
          rows="16"
          class="form-textarea w-full rounded-2xl font-mono text-xs"
          placeholder="Cole ou edite o JSON bruto aqui"
        />
      </div>

      <div class="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white/70 p-3 dark:border-navy-500 dark:bg-navy-900/40">
        <p class="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-navy-300">
          Payload gerado
        </p>
        <pre class="max-h-72 overflow-auto text-xs text-slate-600 dark:text-navy-100">{{ effectiveValue }}</pre>
      </div>
    </div>
  </div>
</template>
