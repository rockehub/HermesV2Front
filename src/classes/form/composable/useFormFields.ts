import { computed, type Ref, type ComputedRef, shallowRef } from 'vue'
import { FieldRegistry, type RegisteredField, type FieldType } from '../FieldRegistry'
import type { AbstractFormSchema } from '../AbstractFormSchema'
import type { AnyFieldSchema, FieldCondition } from '../schemas'
import { ConditionEvaluator } from '../ConditionEvaluator'
import type { DynamicFormSchema } from '@/bin/platform/hermes/adpater/FormSchemaAdapter'

export interface UseFormFieldsReturn<T extends AbstractFormSchema<any>> {
  /** Todos os campos registrados */
  fields: ComputedRef<RegisteredField[]>

  /** Campos agrupados por tipo */
  fieldsByType: ComputedRef<Record<FieldType, RegisteredField[]>>

  /** Campos agrupados por tab */
  fieldsByTab: ComputedRef<Record<string, RegisteredField[]>>

  /** Schema atual */
  schema: Ref<T>

  /** Busca campo por propertyKey */
  getField: (propertyKey: string) => RegisteredField | undefined

  /** Busca campo por code */
  getFieldByCode: (code: string) => RegisteredField | undefined

  /** Busca campos por tipo */
  getFieldsByType: <FT extends FieldType>(type: FT) => RegisteredField<FT>[]

  /** Filtra campos visíveis baseado no contexto */
  getVisibleFields: (context: 'create' | 'update') => RegisteredField[]

  /** Filtra campos visíveis baseado no contexto e condições (async) */
  getVisibleFieldsAsync: (
    context: 'create' | 'update',
    values: Record<string, any>
  ) => Promise<RegisteredField[]>

  /** Converte para JSON */
  toJSON: () => Record<string, any>[]

  /** Valores do formulário como objeto reativo */
  formValues: ComputedRef<Record<string, any>>

  /** Validação do Yup schema combinado */
  validationSchema: ComputedRef<Record<string, any>>
}

export function useFormFields<T extends AbstractFormSchema<any>>(
  schemaInstance: T
): UseFormFieldsReturn<T> {
  const schema = shallowRef(schemaInstance) as Ref<T>

  const fields = computed(() => {
    if ('getFields' in schema.value && typeof schema.value.getFields === 'function') {
      return (schema.value as unknown as DynamicFormSchema).getFields()
    }

    // Caso contrário, usa o FieldRegistry (para schemas com decorators)
    return FieldRegistry.getFields(schema)
  })

  const fieldsByType = computed(() => {
    const grouped: Record<string, RegisteredField[]> = {}

    for (const field of fields.value) {
      if (!grouped[field.fieldType]) {
        grouped[field.fieldType] = []
      }
      grouped[field.fieldType].push(field)
    }

    return grouped as Record<FieldType, RegisteredField[]>
  })

  const fieldsByTab = computed(() => {
    const grouped: Record<string, RegisteredField[]> = {
      _default: []
    }

    for (const field of fields.value) {
      const tab = field.config.tab || '_default'
      if (!grouped[tab]) {
        grouped[tab] = []
      }
      grouped[tab].push(field)
    }

    return grouped
  })

  const getField = (propertyKey: string): RegisteredField | undefined => {
    return FieldRegistry.getFieldByPropertyKey(schema.value, propertyKey)
  }

  const getFieldByCode = (code: string): RegisteredField | undefined => {
    return FieldRegistry.getFieldByCode(schema.value, code)
  }

  const getFieldsByType = <FT extends FieldType>(type: FT): RegisteredField<FT>[] => {
    return FieldRegistry.getFieldsByType(schema.value, type)
  }

  const getVisibleFields = (context: 'create' | 'update'): RegisteredField[] => {
    return fields.value.filter((field: RegisteredField) => {
      const ctx = field.config.context
      return !ctx || ctx === 'all' || ctx === context
    })
  }

  const getVisibleFieldsAsync = async (
    context: 'create' | 'update',
    values: Record<string, any>
  ): Promise<RegisteredField[]> => {
    const results = await Promise.all(
      fields.value.map((field: RegisteredField) =>
        evaluateFieldCondition(field.config.condition, values)
      )
    )

    return fields.value.filter((field: RegisteredField, index: number) => {
      const conditionPassed = results[index]
      const ctx = field.config.context
      const contextMatch = !ctx || ctx === 'all' || ctx === context
      return conditionPassed && contextMatch
    })
  }

  const toJSON = (): Record<string, any>[] => {
    return FieldRegistry.toJSON(schema.value)
  }

  const formValues = computed(() => {
    const values: Record<string, any> = {}

    for (const field of fields.value) {
      const { propertyKey, config } = field
      if (!propertyKey.startsWith('_')) {
        values[config.code] = (schema.value as any)[propertyKey]
      }
    }

    return values
  })

  const validationSchema = computed(() => {
    const validations: Record<string, any> = {}

    for (const field of fields.value) {
      if (field.config.validation) {
        validations[field.config.code] = field.config.validation
      }
    }

    return validations
  })




  return {
    fields,
    fieldsByType,
    fieldsByTab,
    schema,
    getField,
    getFieldByCode,
    getFieldsByType,
    getVisibleFields,
    getVisibleFieldsAsync,
    toJSON,
    formValues,
    validationSchema
  }
}

/**
 * Type guard para verificar se é um ConditionEvaluator
 */
function isConditionEvaluator(cond: unknown): cond is ConditionEvaluator {
  return cond instanceof ConditionEvaluator
}

/**
 * Type guard para verificar se é uma FieldCondition simples
 */
function isFieldCondition(cond: unknown): cond is FieldCondition {
  return (
    typeof cond === 'object' &&
    cond !== null &&
    'action' in cond &&
    'field' in cond &&
    'operator' in cond
  )
}

/**
 * Avalia uma FieldCondition simples
 */
function evaluateSimpleCondition(condition: FieldCondition, values: Record<string, any>): boolean {
  const { field, operator, value } = condition
  const targetValue = values[field]

  switch (operator) {
    case '=':
      return targetValue === value
    case '!=':
      return targetValue !== value
    case '>':
      return targetValue > value
    case '<':
      return targetValue < value
    default:
      return false
  }
}

/**
 * Avalia a condição de visibilidade de um campo (async)
 */
async function evaluateFieldCondition(
  condition: FieldCondition | ConditionEvaluator | ConditionEvaluator[] | undefined,
  values: Record<string, any>
): Promise<boolean> {
  if (!condition) return true

  // Array de ConditionEvaluators (AND implícito)
  if (Array.isArray(condition)) {
    const evaluations = await Promise.all(condition.map((cond) => cond.handle(values)))
    return evaluations.every((res) => res)
  }

  // ConditionEvaluator único
  if (isConditionEvaluator(condition)) {
    return condition.handle(values)
  }

  // FieldCondition simples
  if (isFieldCondition(condition)) {
    const result = evaluateSimpleCondition(condition, values)
    return condition.action === 'show' ? result : !result
  }

  return true
}

/**
 * Composable para uso em componentes de renderização de formulário
 */
export interface UseFormRendererReturn {
  /** Campo atual sendo renderizado */
  currentField: Ref<RegisteredField | null>

  /** Define o campo atual */
  setCurrentField: (field: RegisteredField | null) => void

  /** Avalia condições de visibilidade (sync - apenas FieldCondition simples) */
  evaluateConditionSync: (field: RegisteredField, values: Record<string, any>) => boolean

  /** Avalia condições de visibilidade (async - suporta ConditionEvaluator) */
  evaluateConditionAsync: (field: RegisteredField, values: Record<string, any>) => Promise<boolean>
}

export function useFormRenderer(): UseFormRendererReturn {
  const currentField: Ref<RegisteredField | null> = shallowRef(null)

  const setCurrentField = (field: RegisteredField | null) => {
    currentField.value = field
  }

  const evaluateConditionSync = (field: RegisteredField, values: Record<string, any>): boolean => {
    const condition = field.config.condition

    if (!condition) return true

    // Para ConditionEvaluator, retorna true (precisa usar async)
    if (isConditionEvaluator(condition) || Array.isArray(condition)) {
      console.warn(
        `Field "${field.config.code}" has async condition. Use evaluateConditionAsync instead.`
      )
      return true
    }

    // FieldCondition simples
    if (isFieldCondition(condition)) {
      const result = evaluateSimpleCondition(condition, values)
      return condition.action === 'show' ? result : !result
    }

    return true
  }

  const evaluateConditionAsync = async (
    field: RegisteredField,
    values: Record<string, any>
  ): Promise<boolean> => {
    return evaluateFieldCondition(field.config.condition, values)
  }

  return {
    currentField,
    setCurrentField,
    evaluateConditionSync,
    evaluateConditionAsync
  }
}
