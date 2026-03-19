import { FieldRegistry, type FieldType, type FieldSchemaMap } from './FieldRegistry'
import type {
  TextFieldSchema,
  NumberFieldSchema,
  OptionFieldSchema,
  FileFieldSchema,
  TextareaFieldSchema,
  RelationFieldSchema,
  SearchFieldSchema,
  LayoutFieldSchema,
  SubFormFieldSchema,
  DynamicFieldSchema
} from './schemas'

type Constructor = new (...args: any[]) => any

/**
 * Factory genérica para criar decorators de campo
 */
function createFieldDecorator<T extends FieldType>(fieldType: T) {
  return function (config: FieldSchemaMap[T]) {
    return function (target: Object, propertyKey: string | symbol) {
      const ctor = target.constructor as Constructor
      FieldRegistry.register(ctor, String(propertyKey), fieldType, config)
    }
  }
}

// Decorators específicos para cada tipo de campo
export const TextField = createFieldDecorator<'text'>('text')
export const NumberField = createFieldDecorator<'number'>('number')
export const OptionsField = createFieldDecorator<'options'>('options')
export const FileField = createFieldDecorator<'file'>('file')
export const TextareaField = createFieldDecorator<'textarea'>('textarea')
export const RelationField = createFieldDecorator<'relation'>('relation')
export const SearchField = createFieldDecorator<'search'>('search')
export const LayoutField = createFieldDecorator<'layout'>('layout')
export const SubFormField = createFieldDecorator<'subform'>('subform')
export const DynamicField = createFieldDecorator<'dynamic'>('dynamic')
export const RepeaterField = createFieldDecorator<'repeater'>('repeater')

// Re-export dos tipos para conveniência
export type {
  TextFieldSchema,
  NumberFieldSchema,
  OptionFieldSchema,
  FileFieldSchema,
  TextareaFieldSchema,
  RelationFieldSchema,
  SearchFieldSchema,
  LayoutFieldSchema,
  SubFormFieldSchema,
  DynamicFieldSchema
}
