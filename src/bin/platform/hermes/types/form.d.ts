// types/form.types.ts
import type * as yup from 'yup'
import type { ColumnDefinition, FieldConditionMetadata } from './metadata.d'

export interface FormSchema {
  formName: string
  entityName: string
  fields: FormField[]
  columns?: ColumnDefinition[]
}

export interface FormField {
  code: string
  label: string
  type: FieldType
  fieldType: FieldType
  tabLabel: string
  tabOrder: number
  span: number
  validation?: yup.AnySchema
  options?: OptionMetadata[]
  relation?: RelationMetadata
  placeholder?: string
  tab?: string
  context?: 'create' | 'update' | 'all'
  disableValidationIn?: 'create' | 'update'
  condition?: FieldConditionMetadata
  params?: Record<string, any>
}
