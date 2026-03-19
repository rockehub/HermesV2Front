import { FieldRegistry, type RegisteredField } from './FieldRegistry'

export abstract class AbstractFormSchema<T> {
  abstract formName: string

  public constructor(...args: any[]) {
    this.init(...args)
  }

  protected init(...args: any[]): void {}

  /**
   * Creates and returns a new instance of the schema.
   */
  static getInstance<T extends AbstractFormSchema<any>>(
    this: new (...args: any[]) => T,
    ...args: any[]
  ): T {
    return new this(...args)
  }

  /**
   * Retorna todos os campos registrados para esta instância
   */
  getFields(): RegisteredField[] {
    return FieldRegistry.getFields(this)
  }

  /**
   * Retorna os campos como JSON
   */
  getFieldsAsJSON(): Record<string, any>[] {
    return FieldRegistry.toJSON(this)
  }

  /**
   * Populates the instance with values from the given meta object.
   */
  fromForm(meta: Record<string, any>): this {
    const fields = this.getFields()

    for (const field of fields) {
      const { propertyKey, config } = field
      if (!propertyKey.startsWith('_') && meta[config.code] !== undefined) {
        ;(this as any)[propertyKey] = meta[config.code]
      }
    }

    return this
  }

  /**
   * Generic method to transform object to a plain representation.
   */
  private toObject(mapToCode: boolean): Record<string, any> {
    const fields = this.getFields()

    return fields.reduce((obj: Record<string, any>, field) => {
      const { propertyKey, config } = field
      if (!propertyKey.startsWith('_') && this.hasOwnProperty(propertyKey)) {
        const key = mapToCode ? config.code : propertyKey
        obj[key] = (this as any)[propertyKey]
      }
      return obj
    }, {})
  }

  /**
   * Converts the instance to a plain object using property keys.
   */
  public toPlainObject(): Record<string, any> {
    return this.toObject(false)
  }

  /**
   * Converts the instance to a plain object using field codes.
   */
  public toPlainObjectCode(): Record<string, any> {
    return this.toObject(true)
  }

  /**
   * Converts the instance to FormData.
   */
  public toFormData(): FormData {
    const fields = this.getFields()
    const formData = new FormData()

    const appendValue = (key: string, value: any): void => {
      if (value instanceof File || value instanceof Blob) {
        formData.append(key, value)
      } else if (Array.isArray(value)) {
        value.forEach((item, index) => {
          appendValue(`${key}[${index}]`, item)
        })
      } else if (value && typeof value === 'object') {
        Object.entries(value).forEach(([subKey, subValue]) => {
          appendValue(`${key}[${subKey}]`, subValue)
        })
      } else {
        formData.append(key, value !== undefined ? String(value) : '')
      }
    }

    for (const field of fields) {
      const { propertyKey, config } = field
      if (!propertyKey.startsWith('_') && this.hasOwnProperty(propertyKey)) {
        const value = (this as any)[propertyKey]
        appendValue(config.code, value)
      }
    }

    return formData
  }

  /**
   * Resets the instance fields to undefined.
   */
  public reset(): void {
    const fields = this.getFields()

    for (const field of fields) {
      const { propertyKey } = field
      if (!propertyKey.startsWith('_') && this.hasOwnProperty(propertyKey)) {
        ;(this as any)[propertyKey] = undefined
      }
    }
  }

  /**
   * Retorna o schema de validação Yup combinado
   */
  public getValidationSchema(context?: 'create' | 'update'): Record<string, any> {
    const fields = this.getFields()
    const validations: Record<string, any> = {}

    for (const field of fields) {
      const { config } = field

      // Pula validação se desabilitada para este contexto
      if (context && config.disableValidationIn === context) {
        continue
      }

      if (config.validation) {
        validations[config.code] = config.validation
      }
    }

    return validations
  }

  /**
   * Retorna campos filtrados por contexto
   */
  public getFieldsForContext(context: 'create' | 'update'): RegisteredField[] {
    return this.getFields().filter((field) => {
      const ctx = field.config.context
      return !ctx || ctx === 'all' || ctx === context
    })
  }

  /**
   * Retorna campos agrupados por tab
   */
  public getFieldsByTab(): Record<string, RegisteredField[]> {
    const grouped: Record<string, RegisteredField[]> = { _default: [] }

    for (const field of this.getFields()) {
      const tab = field.config.tab || '_default'
      if (!grouped[tab]) {
        grouped[tab] = []
      }
      grouped[tab].push(field)
    }

    return grouped
  }

  /**
   * Clona a instância atual
   */
  public clone(): this {
    const Constructor = this.constructor as new (...args: any[]) => this
    const instance = new Constructor()

    const fields = this.getFields()
    for (const field of fields) {
      const { propertyKey } = field
      if (this.hasOwnProperty(propertyKey)) {
        const value = (this as any)[propertyKey]
        ;(instance as any)[propertyKey] =
          value && typeof value === 'object' ? JSON.parse(JSON.stringify(value)) : value
      }
    }

    return instance
  }
}
