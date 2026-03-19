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

export type FieldType =
  | 'text'
  | 'number'
  | 'options'
  | 'file'
  | 'textarea'
  | 'relation'
  | 'search'
  | 'layout'
  | 'subform'
  | 'dynamic'
  | 'repeater'

export type FieldSchemaMap = {
  text: TextFieldSchema
  number: NumberFieldSchema
  options: OptionFieldSchema
  file: FileFieldSchema
  textarea: TextareaFieldSchema
  relation: RelationFieldSchema
  search: SearchFieldSchema
  layout: LayoutFieldSchema
  subform: SubFormFieldSchema
  dynamic: DynamicFieldSchema
  repeater: DynamicFieldSchema
}

export interface RegisteredField<T extends FieldType = FieldType> {
  propertyKey: string
  fieldType: T
  config: FieldSchemaMap[T]
}

type Constructor<T = any> = new (...args: any[]) => T

class FieldRegistryClass {
  private registry = new WeakMap<Constructor, RegisteredField[]>()
  private classNameMap = new Map<string, Constructor>()

  register<T extends FieldType>(
    target: Constructor,
    propertyKey: string,
    fieldType: T,
    config: FieldSchemaMap[T]
  ): void {
    if (!this.registry.has(target)) {
      this.registry.set(target, [])
      this.classNameMap.set(target.name, target)
    }

    const fields = this.registry.get(target)!

    // Evita duplicatas
    const existingIndex = fields.findIndex((f) => f.propertyKey === propertyKey)
    if (existingIndex >= 0) {
      fields[existingIndex] = { propertyKey, fieldType, config }
    } else {
      fields.push({ propertyKey, fieldType, config })
    }
  }

  getFields(target: Constructor | object): RegisteredField[] {
    const ctor = (target.constructor as Constructor)

    // Coleta fields da classe atual e de todas as classes pai
    const allFields: RegisteredField[] = []
    let currentCtor: Constructor | null = ctor

    while (currentCtor && currentCtor !== Object) {
      const fields = this.registry.get(currentCtor) || []
      // Adiciona no início para que campos da classe pai venham primeiro
      allFields.unshift(...fields)
      currentCtor = Object.getPrototypeOf(currentCtor)
    }

    // Remove duplicatas (campos sobrescritos na classe filha)
    const seen = new Set<string>()
    return allFields
      .filter((field) => {
        if (seen.has(field.propertyKey)) return false
        seen.add(field.propertyKey)
        return true
      })
      .reverse() // Reverte para manter ordem correta
  }

  getFieldsByType<T extends FieldType>(
    target: Constructor | object,
    fieldType: T
  ): RegisteredField<T>[] {
    return this.getFields(target).filter((f): f is RegisteredField<T> => f.fieldType === fieldType)
  }

  getFieldByPropertyKey(
    target: Constructor | object,
    propertyKey: string
  ): RegisteredField | undefined {
    return this.getFields(target).find((f) => f.propertyKey === propertyKey)
  }

  getFieldByCode(target: Constructor | object, code: string): RegisteredField | undefined {
    return this.getFields(target).find((f) => f.config.code === code)
  }

  hasFields(target: Constructor | object): boolean {
    return this.getFields(target).length > 0
  }

  clear(target: Constructor): void {
    this.registry.delete(target)
    this.classNameMap.delete(target.name)
  }

  toJSON(target: Constructor | object): Record<string, any>[] {
    return this.getFields(target).map((field) => ({
      propertyKey: field.propertyKey,
      fieldType: field.fieldType,
      ...field.config
    }))
  }
}

export const FieldRegistry = new FieldRegistryClass()
