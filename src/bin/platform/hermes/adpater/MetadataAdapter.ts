// services/metadata/MetadataAdapter.ts
import * as yup from 'yup'
import type {
  EntityMetadata,
  FieldMetadata,
  ValidationMetadata,
  ValidationRule
} from '../types/metadata.d'
import type { FormSchema, FormField } from '../types/form.d.ts'

export class MetadataAdapter {
  /**
   * Converte metadata do backend para schema do form generator
   */
  static toFormSchema(backendMetadata: EntityMetadata): FormSchema {
    return {
      formName: backendMetadata.formName,
      entityName: backendMetadata.entityName,
      fields: backendMetadata.fields.map((field) => this.adaptField(field)),
      columns: backendMetadata.columns
    }
  }

  /**
   * Adapta um campo individual
   */
  static adaptField(backendField: FieldMetadata): FormField {
    const adapted: FormField = {
      code: backendField.code,
      label: backendField.label,
      type: backendField.type,
      fieldType: backendField.fieldType,
      tabLabel: backendField.tab ?? 'General',
      tabOrder: 0,
      span: backendField.span || 6,
      validation: this.adaptValidation(backendField.validation),
      placeholder: backendField.placeholder,
      params: {}
    }

    // Opções para selects/enums
    if (backendField.options) {
      adapted.options = backendField.options
      adapted.params = {
        ...adapted.params,
        options: backendField.options
      }
    }

    // Relacionamentos
    if (backendField.relation) {
      adapted.relation = backendField.relation
      adapted.params = {
        ...adapted.params,
        relation: backendField.relation
      }
    }

    // Tab
    if (backendField.tab) {
      adapted.tab = backendField.tab
    }

    // Context
    if (backendField.context) {
      adapted.context = backendField.context
    }

    if (backendField.disableValidationIn) {
      adapted.disableValidationIn = backendField.disableValidationIn
    }

    if (backendField.condition) {
      adapted.condition = backendField.condition
    }

    return adapted
  }

  /**
   * Adapta validações para formato yup
   */
  static adaptValidation(backendValidation?: ValidationMetadata): yup.AnySchema | undefined {
    if (!backendValidation?.rules || backendValidation.rules.length === 0) {
      return undefined
    }

    return this.buildYupSchema(backendValidation.rules)
  }

  /**
   * Constrói schema yup baseado nas regras
   */
  static buildYupSchema(rules: ValidationRule[]): yup.AnySchema {
    let schema: yup.StringSchema | yup.NumberSchema | yup.AnySchema = yup.string()

    // Determina tipo base - verifica se há validação de VALOR numérico (não comprimento)
    const hasNumberValidation = rules.some(
      (r) => r.type === 'min' || r.type === 'max' // Apenas min/max de valor
    )

    if (hasNumberValidation) {
      schema = yup.number()
    }

    // Aplica cada regra
    rules.forEach((rule) => {
      switch (rule.type) {
        case 'required':
          schema = schema.required(rule.message || 'validation.required')
          break

        case 'email':
          if (schema instanceof yup.StringSchema) {
            schema = schema.email(rule.message || 'validation.email')
          }
          break

        case 'min':
          if (schema instanceof yup.NumberSchema) {
            schema = schema.min(Number(rule.param), rule.message || 'validation.min.value')
          }
          break

        case 'max':
          if (schema instanceof yup.NumberSchema) {
            schema = schema.max(Number(rule.param), rule.message || 'validation.max.value')
          }
          break

        case 'minLength':
          if (schema instanceof yup.StringSchema) {
            schema = schema.min(Number(rule.param), rule.message || 'validation.min.length')
          }
          break

        case 'maxLength':
          if (schema instanceof yup.StringSchema) {
            schema = schema.max(Number(rule.param), rule.message || 'validation.max.length')
          }
          break

        case 'pattern':
          if (schema instanceof yup.StringSchema && typeof rule.param === 'string') {
            schema = schema.matches(new RegExp(rule.param), rule.message || 'validation.pattern')
          }
          break
      }
    })

    return schema
  }
}
