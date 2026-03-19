<script lang="ts" setup>
import type { AbstractFormSchema } from '@/classes/form/AbstractFormSchema'
import { useForm } from 'vee-validate'
import * as yup from 'yup'
import { evaluateCondition } from '@/classes/form/FieldValidatorUtils'
import { toTypedSchema } from '@vee-validate/yup'
import { ConditionEvaluator } from '@/classes/form/ConditionEvaluator'
import { DynamicMethodsUtils } from '@/classes/form/DynamicMethodsUtils'
import { useI18n } from 'vue-i18n'
import { computed, onMounted, ref, watch } from 'vue'
import FormFields from '@/components/plugins/form/form-fields.vue'
import { useFormFields } from '@/classes/form/composable/useFormFields'
import type { FieldType, RegisteredField } from '@/classes/form/FieldRegistry'
import type { FieldCondition } from '@/classes/form/schemas'

const { t } = useI18n()

const props = defineProps<{
  schema: AbstractFormSchema<any>
  noSubmitButton?: boolean
  initialValues?: any
  saving?: boolean
  context?: 'create' | 'update' | 'all'
}>()

const emit = defineEmits(['onSubmit'])

const filteredFields = ref<RegisteredField[]>([])

const { fields } = useFormFields(props.schema)

const { handleSubmit, values, errors, resetForm } = useForm({
  validationSchema: computed(() => {
    const schemaObject: Record<string, yup.AnySchema> = {}

    filteredFields.value.forEach((field) => {
      if (field.config.disableValidationIn && field.config.disableValidationIn === props.context) {
        schemaObject[field.config.code] = yup.mixed().notRequired()
      } else if (field.config.validation) {
        schemaObject[field.config.code] = field.config.validation as yup.AnySchema
      }
    })

    return toTypedSchema(yup.object(schemaObject))
  }),
  initialValues: props.initialValues
})

function isConditionEvaluator(cond: unknown): cond is ConditionEvaluator {
  return cond instanceof ConditionEvaluator
}

function isFieldCondition(cond: unknown): cond is FieldCondition {
  return (
    typeof cond === 'object' &&
    cond !== null &&
    'action' in cond &&
    'field' in cond &&
    'operator' in cond
  )
}

async function evaluateFieldCondition(
  condition: FieldCondition | ConditionEvaluator | ConditionEvaluator[] | undefined,
  formValues: any
): Promise<boolean> {
  if (!condition) return true

  if (Array.isArray(condition)) {
    const evaluations = await Promise.all(condition.map((cond) => cond.handle(formValues)))
    return evaluations.every((res) => res)
  }

  if (isConditionEvaluator(condition)) {
    return condition.handle(formValues)
  }

  if (isFieldCondition(condition)) {
    const result = evaluateCondition(condition, formValues)
    return condition.action === 'show' ? result : !result
  }

  return true
}

const isReady = ref(false)

const filterFields = async () => {
  const context = props.context || 'all'

  const results = await Promise.all(
    fields.value.map((field) => evaluateFieldCondition(field.config.condition, values))
  )

  filteredFields.value = fields.value.filter((field, index) => {
    if (!field.config?.code) return false

    const conditionPassed = results[index]
    const contextMatch =
      field.config.context === undefined ||
      field.config.context === context ||
      field.config.context === 'all'

    return conditionPassed && contextMatch
  })

  isReady.value = true
}

function debounce<T extends (...args: any[]) => any>(func: T, delay: number) {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => func(...args), delay)
  }
}

onMounted(() => {
  filterFields()
})

const debouncedFilterFields = debounce(filterFields, 300)

watch(values, () => debouncedFilterFields())

const groupedTabs = computed(() => {
  const groups = filteredFields.value.reduce(
    (acc, field) => {
      const tabName = field.config.tab || 'general'
      const tabLabel = field.config.tabLabel
      const tabOrder = Number(field.config.tabOrder ?? 0)

      if (!acc[tabName]) {
        acc[tabName] = {
          name: tabName,
          label: tabLabel,
          order: tabOrder,
          fields: [] as RegisteredField[]
        }
      }

      if (!acc[tabName].label && tabLabel) {
        acc[tabName].label = tabLabel
      }

      acc[tabName].order = Math.min(acc[tabName].order, tabOrder)
      acc[tabName].fields.push(field as RegisteredField<FieldType>)
      return acc
    },
    {} as Record<string, { name: string; label?: string; order: number; fields: RegisteredField[] }>
  )

  return Object.values(groups).sort((left, right) => {
    if (left.order !== right.order) {
      return left.order - right.order
    }

    return left.name.localeCompare(right.name)
  })
})

const defaultTab = computed(() => groupedTabs.value[0]?.name || 'general')

const resolveTabLabel = (tabName: string, tabLabel?: string) => {
  if (tabLabel) {
    return t(tabLabel)
  }

  const fallback = t(`forms.tab.${String(tabName)}`)
  return fallback === `forms.tab.${String(tabName)}` ? tabName : fallback
}

const submit = handleSubmit((formValues) => {
  emit('onSubmit', props.schema.fromForm(formValues))
})

const onBlur = async (field: RegisteredField) => {
  if (field.config.useOnBlur) {
    const fieldValue = values[field.config.code]
    if (!fieldValue) return

    await DynamicMethodsUtils.invoke(props.schema, field.config.code, 'blur', 'Action', [
      fieldValue,
      resetForm
    ])
  }
}

defineExpose({
  submit,
  resetForm
})
</script>

<template>
  <form :class="{ 'form-disabled': saving }" @submit="submit">
    <div
      v-if="!noSubmitButton"
      class="col-span-12 flex items-center justify-between rounded-t-lg border-b border-slate-200 bg-white px-5 py-3.5 dark:border-navy-500 dark:bg-navy-700 mb-5"
    >
      <div>
        <h1 class="text-sm font-semibold text-slate-700 dark:text-navy-100">
          {{ t('forms.' + schema.formName +'.formName') }}
        </h1>
        <p v-if="Object.keys(errors).length > 0" class="mt-0.5 text-xs text-error">
          {{ Object.keys(errors).length }} {{ t('form.commons.errors') }}
        </p>
      </div>
      <button
        :disabled="saving"
        class="btn rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-focus focus:bg-primary-focus active:bg-primary-focus/90 disabled:pointer-events-none disabled:opacity-60 dark:bg-accent dark:hover:bg-accent-focus dark:focus:bg-accent-focus"
        type="submit"
      >
        {{ saving ? t('forms.commons.saving') : t('forms.commons.submit') }}
      </button>
    </div>

    <div v-if="!isReady" class="animate-pulse space-y-5 px-1">
      <div class="space-y-1.5">
        <div class="h-3 w-24 rounded bg-slate-200 dark:bg-navy-500"></div>
        <div class="h-9 w-3/4 rounded-lg bg-slate-150 dark:bg-navy-500"></div>
      </div>
      <div class="space-y-1.5">
        <div class="h-3 w-20 rounded bg-slate-200 dark:bg-navy-500"></div>
        <div class="h-9 w-2/4 rounded-lg bg-slate-150 dark:bg-navy-500"></div>
      </div>
      <div class="space-y-1.5">
        <div class="h-3 w-28 rounded bg-slate-200 dark:bg-navy-500"></div>
        <div class="h-9 w-5/6 rounded-lg bg-slate-150 dark:bg-navy-500"></div>
      </div>
    </div>

    <template v-else>
      <generic-tabs v-if="groupedTabs.length > 1" :default-tab="defaultTab">
        <generic-tab
          v-for="tab in groupedTabs"
          :key="tab.name"
          :label="resolveTabLabel(tab.name, tab.label)"
          :name="tab.name"
          class="grid grid-cols-12 gap-x-4 gap-y-5"
        >
          <form-fields
            :fields="tab.fields"
            :initial-values="initialValues"
            :schema="schema"
            @on-blur="onBlur"
          />
        </generic-tab>
      </generic-tabs>

      <div v-else class="grid grid-cols-12 gap-x-4 gap-y-5">
        <plugins-form-form-fields
          :fields="filteredFields"
          :initial-values="initialValues"
          :schema="schema"
          @on-blur="onBlur"
        />
      </div>
    </template>
  </form>
</template>

<style scoped>
.form-disabled {
  pointer-events: none;
  opacity: 0.6;
}
</style>
