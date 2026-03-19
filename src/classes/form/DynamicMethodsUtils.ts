import type { FieldType, RegisteredField } from '@/classes/form/FieldRegistry'
import type { AbstractFormSchema } from '@/classes/form/AbstractFormSchema'
import { isArray } from 'lodash-es'

/**
 * Interface para o formato simples retornado pelos métodos dinâmicos
 */
export interface SimpleDynamicField {
  code: string
  fieldType: FieldType
  type: string
  label: string
  span: number
  tab?: string
  context?: 'create' | 'update' | 'all'
  validation?: any
  condition?: any
  [key: string]: any
}

export class DynamicMethodsUtils {
  /**
   * Converte o nome do código para nome de função
   */
  static toFunctionName(code: string, prefix: string, suffix: string): string {
    const camelCode = code.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
    const pascalCode = camelCode.charAt(0).toUpperCase() + camelCode.slice(1)
    return `${prefix}${pascalCode}${suffix}`
  }

  /**
   * Converte formato simples para RegisteredField
   */
  static toRegisteredField(simpleField: SimpleDynamicField): RegisteredField {
    const { code, fieldType, ...rest } = simpleField

    return {
      propertyKey: code,
      fieldType: fieldType,
      config: {
        code,
        ...rest
      }
    } as RegisteredField // Cast aqui
  }

  /**
   * Converte array de formato simples para RegisteredField[]
   */
  static toRegisteredFields(simpleFields: SimpleDynamicField[]): RegisteredField[] {
    if(isArray(simpleFields)) {
      return simpleFields.map((field) => this.toRegisteredField(field))
    }

    return simpleFields
  }

  /**
   * Invoca método dinâmico e retorna campos no formato RegisteredField
   */
  static async invoke(
    schema: AbstractFormSchema<any>,
    code?: string,
    prefix: string = 'get',
    suffix: string = 'Options',
    data?: any,
    returnPure?: boolean
  ): Promise<RegisteredField[]> {
    if (!code) return []

    const methodName = this.toFunctionName(code, prefix, suffix)
    const recordSchema = schema as Record<string, any>

    if (typeof recordSchema[methodName] === 'function') {
      const result = await recordSchema[methodName](data)

      if(returnPure){
        return result;
      }

      // Se já é array de RegisteredField (tem propertyKey), retorna direto
      if (result?.[0]?.propertyKey !== undefined) {
        return result
      }

      // Senão, converte do formato simples
      return this.toRegisteredFields(result)
    }

    throw Error(`No Method ${methodName} Found in ${schema.constructor.name}`)
  }

  /**
   * Versão que não lança erro se método não existir
   */
  static async invokeIfExists(
    schema: AbstractFormSchema<any>,
    code?: string,
    prefix: string = 'get',
    suffix: string = 'Options',
    data?: any
  ): Promise<RegisteredField[]> {
    if (!code) return []

    const methodName = this.toFunctionName(code, prefix, suffix)
    const recordSchema = schema as Record<string, any>

    if (typeof recordSchema[methodName] === 'function') {
      const result = await recordSchema[methodName](data)

      if (result?.[0]?.propertyKey !== undefined) {
        return result
      }

      return this.toRegisteredFields(result)
    }

    return []
  }
}