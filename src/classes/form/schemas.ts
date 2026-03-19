import type * as yup from 'yup'
import type { ConditionEvaluator } from '@/classes/form/ConditionEvaluator'
import type { AbstractFormSchema } from '@/classes/form/AbstractFormSchema'
import type { RegisteredField } from '@/classes/form/FieldRegistry'


// Tipo genÃ©rico para qualquer schema Yup (compatÃ­vel com mÃºltiplas versÃµes)
export type YupSchema = yup.AnySchema | yup.Schema<any, any, any, any>

export interface BaseFieldSchema {
  fieldType?: string
  code: string
  label: string
  span: number
  tab?: string
  tabLabel?: string
  tabOrder?: number
  context?: 'create' | 'update' | 'all'
  disableValidationIn?: 'create' | 'update'
  validation?: YupSchema
  condition?: FieldCondition | ConditionEvaluator | ConditionEvaluator[]
  useOnBlur?: boolean
}

export interface FieldCondition {
  action: 'show' | 'hide'
  field: string
  operator: '>' | '<' | '=' | '!='
  value: any
}


export type FieldFinderType =
  | 'text'
  | 'options'
  | 'file'
  | 'subform'
  | 'layout'
  | 'relation'
  | 'textarea'
  | 'dynamic'
  | 'repeater'
  | 'number'
  | 'search'

export type FieldType =
  // TextFieldSchema
  | 'text'
  | 'password'
  | 'email'
  | 'tel'
  | 'url'
  | 'hidden'
  | 'date'
  | 'time'
  | 'datetime-local'
  | 'month'
  | 'week'
  | 'color'

  // NumberFieldSchema
  | 'number'
  | 'range'
  | 'currency'
  | 'quantity'

  // OptionFieldSchema
  | 'checkbox'
  | 'radio'
  | 'select'
  | 'datalist'
  | 'switch'

  // TextareaFieldSchema
  | 'simple'
  | 'editor'

  // RelationFieldSchema
  | 'record'
  | 'list'

  // LayoutFieldSchema
  | 'section'
  | 'line'

  // SubFormFieldSchema
  | 'literal'
  | 'modal'

  // DynamicFieldSchema
  | 'request'

  // SearchFieldSchema
  | 'box'

  // FileFieldSchema
  | 'file'


export interface TextFieldSchema extends BaseFieldSchema {
  type:
    | 'text'
    | 'password'
    | 'email'
    | 'tel'
    | 'url'
    | 'hidden'
    | 'date'
    | 'time'
    | 'datetime-local'
    | 'month'
    | 'week'
    | 'color'
}

export interface SearchFieldSchema extends BaseFieldSchema {
  type: 'box'
}

export interface UpdateBehavior {
  afterUpdate: AfterTypes
}

export interface RemoveBehavior {
  batch: boolean
  detach?: boolean
}

export interface CreateBehavior {
  afterCreate: AfterTypes
}

export enum AfterTypes {
  useReturnData = 1,
  refresh = 2
}

type BehaviorBasedOnActions = {
  formSchema?: AbstractFormSchema<any>
  addBehavior?: boolean
  removeBehavior?: RemoveBehavior
  createBehavior?: CreateBehavior
  updateBehavior?: UpdateBehavior
}

export interface RelationFieldSchema extends BaseFieldSchema, BehaviorBasedOnActions {
  type: 'record' | 'list'
  useExternalData: boolean
  recordTableField?: string[]
}

export interface LayoutFieldSchema extends BaseFieldSchema {
  type: 'section' | 'line'
  title?: string
  description?: string
}

export interface SubFormFieldSchema extends BaseFieldSchema {
  type: 'literal' | 'modal'
  form: AbstractFormSchema<any>
  initialValuesProperty?: string
}

export interface TextareaFieldSchema extends BaseFieldSchema {
  type: 'simple' | 'editor'
}

export interface DynamicFieldSchema extends BaseFieldSchema {
  type: 'request' | 'literal'
  initialValuesProperty: string
  shouldUseInCreate?: boolean
}

export interface OptionFieldSchema extends BaseFieldSchema {
  type: 'checkbox' | 'radio' | 'select' | 'datalist' | 'switch'
  multiple?: boolean
  size?: number
  boxed?: boolean
  noEmptyOption?: boolean
  options?: OptionSelect[]
}

export interface OptionSelect {
  name: string
  id: string | number
}

export interface NumberFieldSchema extends BaseFieldSchema {
  type: 'number' | 'range' | 'currency' | 'quantity'
  min?: number
  max?: number
  step?: number
}

export interface FileFieldSchema extends BaseFieldSchema {
  type: 'file'
  accept?: string
  multiple?: boolean
  capture?: string
  webKitDirectory?: boolean
}

export interface OptionsPropsSchema {
  options: any[]
  params: RegisteredField<'options'>
  field: any
}

export interface BaseFieldProps<T> {
  params: T
  field: any
  schema: AbstractFormSchema<any>
  initialValues?: any
}

export type Option<T> = {
  name: string
  id: T
}

// Union type de todos os schemas
export type AnyFieldSchema =
  | TextFieldSchema
  | NumberFieldSchema
  | OptionFieldSchema
  | FileFieldSchema
  | TextareaFieldSchema
  | RelationFieldSchema
  | SearchFieldSchema
  | LayoutFieldSchema
  | SubFormFieldSchema
  | DynamicFieldSchema

