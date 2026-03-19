// services/metadata/FormSchemaAdapter.ts
import type { EntityMetadata } from '../types/metadata.d'
import { AbstractFormSchema } from '@/classes/form/AbstractFormSchema'
import type { RegisteredField, FieldType } from '@/classes/form/FieldRegistry'
import type { FormField, FormSchema } from '@/bin/platform/hermes/types/form'
import { useCrud } from '@/bin/platform/hermes/composables/useCrud'

/**
 * Adapter que converte metadata do backend para AbstractFormSchema
 */
export class FormSchemaAdapter {
  /**
   * Cria uma instancia de AbstractFormSchema a partir do metadata do backend
   */
  static createSchema(metadata: FormSchema): DynamicFormSchema {
    const schema = new DynamicFormSchema(metadata.formName, metadata.entityName)

    metadata.fields.forEach((field) => {
      const adaptedField = this.adaptField(field)
      schema.addField(adaptedField)
    })

    return schema
  }

  /**
   * Adapta um campo individual para RegisteredField
   */
  private static adaptField(backendField: FormField): RegisteredField {
    const config: any = {
      code: backendField.code,
      label: backendField.label,
      type: backendField.type,
      fieldType: backendField.fieldType,
      span: backendField.span || 6,
      validation: backendField.validation,
      tab: backendField.tab || 'general',
      tabLabel: backendField.tabLabel,
      tabOrder: backendField.tabOrder || 0,
      context: backendField.context || 'all',
      disableValidationIn: backendField.disableValidationIn,
      condition: backendField.condition,
      placeholder: backendField.placeholder
    }

    if (backendField.options) {
      config.options = backendField.options.map((opt) => ({
        id: opt.value,
        name: opt.label
      }))
    }

    if (backendField.relation) {
      config.relation = {
        type: backendField.relation.type,
        targetEntity: backendField.relation.targetEntity,
        resourcePath: backendField.relation.resourcePath,
        displayField: backendField.relation.displayField || 'nome'
      }
    }

    return {
      propertyKey: backendField.code,
      fieldType: backendField.fieldType,
      config: config
    } as RegisteredField
  }

  private static mapFieldType(backendType: string): FieldType {
    const typeMap: Record<string, FieldType> = {
      text: 'text',
      number: 'number',
      options: 'options',
      textarea: 'textarea',
      relation: 'relation',
      file: 'file',
      date: 'text'
    }

    return typeMap[backendType] || 'text'
  }
}

/**
 * Classe que implementa AbstractFormSchema dinamicamente
 * Armazena os campos como RegisteredField[] para compatibilidade com o form generator
 */
export class DynamicFormSchema extends AbstractFormSchema<any> {
  private fields: RegisteredField[] = []
  public formName: string
  public entityName: string

  constructor(formName: string, entityName: string) {
    super()
    this.formName = formName
    this.entityName = entityName
  }

  addField(field: RegisteredField): void {
    this.fields.push(field)
  }

  async listEntityItems(fieldCodeOrEntity: string): Promise<Record<string, any>> {
    const field = this.getFieldByCode(fieldCodeOrEntity)
    const resourcePath =
      field?.config?.relation?.resourcePath ||
      field?.config?.relation?.targetEntity?.toLowerCase?.() ||
      fieldCodeOrEntity

    const { fetchAll } = useCrud<Record<string, any>>(resourcePath)
    return await fetchAll()
  }

  async findEntityRecord([value, relation]: [string, string]): Promise<Record<string, any>> {
    const { fetchRelation } = useCrud<Record<string, any>>(this.entityName)
    return await fetchRelation(relation, value)
  }

  getFields(): RegisteredField[] {
    return this.fields
  }

  getFieldByCode(code: string): RegisteredField | undefined {
    return this.fields.find((f) => f.config.code === code)
  }

  async associateToOne([id, relation, targetId]: [
    string | number,
    string,
    string | number
  ]): Promise<void> {
    const { associateRelation } = useCrud(this.entityName)
    await associateRelation(id, relation, targetId)
  }

  async replaceToMany(
    id: string | number,
    relation: string,
    targetIds: (string | number)[]
  ): Promise<void> {
    const { associateRelation } = useCrud(this.entityName)
    await associateRelation(id, relation, targetIds)
  }

  async addToMany([id, relation, targetIds]: [
    string | number,
    string,
    (string | number)[]
  ]): Promise<void> {
    const { addToRelation } = useCrud(this.entityName)
    await addToRelation(id, relation, targetIds)
  }

  async removeFromMany(
    id: string | number,
    relation: string,
    targetId: string | number
  ): Promise<void> {
    const { removeFromRelation } = useCrud(this.entityName)
    await removeFromRelation(id, relation, targetId)
  }

  async clearToOne(id: string | number, relation: string): Promise<void> {
    const { removeFromRelation } = useCrud(this.entityName)
    await removeFromRelation(id, relation)
  }

  fromForm(values: any): any {
    return values
  }

  toForm(data: any): any {
    return data
  }
}

