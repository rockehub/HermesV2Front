// composables/useDynamicFormSchema.ts
import { ref, type Ref } from 'vue'
import { useFormMetadata } from './useFormMetadata'
import { FormSchemaAdapter, type DynamicFormSchema } from '../adpater/FormSchemaAdapter'

interface UseDynamicFormSchemaReturn {
  schema: Ref<DynamicFormSchema & any | null>
  loading: Ref<boolean>
  error: Ref<string | null>
  loadSchema: (entityName: string) => Promise<DynamicFormSchema>
}

export function useDynamicFormSchema(): UseDynamicFormSchemaReturn {
  const schema = ref<DynamicFormSchema | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const { fetchSchema } = useFormMetadata()

  /**
   * Carrega o schema do backend e converte para DynamicFormSchema
   */
  const loadSchema = async (entityName: string): Promise<DynamicFormSchema> => {
    loading.value = true
    error.value = null

    try {
      // Busca metadata do backend
      const metadata = await fetchSchema(entityName)

      // Converte para DynamicFormSchema
      const dynamicSchema = FormSchemaAdapter.createSchema(metadata)

      schema.value = dynamicSchema

      return dynamicSchema
    } catch (e: any) {
      error.value = e.message || 'Erro ao carregar schema'
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    schema,
    loading,
    error,
    loadSchema
  }
}
