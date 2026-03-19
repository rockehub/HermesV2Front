// types/metadata.types.ts
export interface ValidationRule {
  type: 'required' | 'email' | 'min' | 'max' | 'pattern' | 'minLength' | 'maxLength'
  param?: string | number
  message: string
}

export interface ValidationMetadata {
  rules: ValidationRule[]
}

export interface OptionMetadata {
  value: string | number
  label: string
}

export interface RelationMetadata {
  type: 'many-to-one' | 'one-to-many' | 'many-to-many' | 'one-to-one'
  targetEntity: string
  resourcePath?: string
  displayField?: string
}

export interface FieldConditionMetadata {
  action: 'show' | 'hide'
  field: string
  operator: '>' | '<' | '=' | '!='
  value: any
}

export interface FieldMetadata {
  code: string
  label: string
  type: FieldType
  fieldType: FieldType
  span: number
  validation?: ValidationMetadata
  options?: OptionMetadata[]
  relation?: RelationMetadata
  placeholder?: string
  tab?: string
  tabLabel?: string
  tabOrder?: number
  context?: 'create' | 'update' | 'all'
  disableValidationIn?: 'create' | 'update'
  condition?: FieldConditionMetadata
}

export interface ColumnDefinition {
  field: string
  label?: string
  type?: 'text' | 'boolean' | 'number' | 'currency' | 'date' | 'datetime' | 'badge'
  sortable?: boolean
}

export interface EntityMetadata {
  entityName: string
  formName: string
  fields: FieldMetadata[]
  columns?: ColumnDefinition[]
}

export interface EntityInfo {
  name: string
  displayName: string
}

export type FieldType =
  | 'text'
  | 'number'
  | 'options'
  | 'textarea'
  | 'relation'
  | 'file'
  | 'dynamic'
  | 'repeater'
  | 'search'
  | 'subform'
  | 'layout'


