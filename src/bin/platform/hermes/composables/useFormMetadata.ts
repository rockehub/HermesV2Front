// composables/useFormMetadata.ts
import { ref, type Ref } from 'vue'
import CrudService from '../services/crudService'
import { MetadataAdapter } from '../adpater/MetadataAdapter'
import type { EntityMetadata, EntityInfo } from '../types/metadata.d'
import type { FormSchema } from '../types/form.d'
import { $axios } from '@/helpers/integration/integration'

interface UseFormMetadataReturn {
  schemas: Ref<Map<string, FormSchema & any>>
  loading: Ref<boolean>
  error: Ref<string | null>
  fetchSchema: (entityName: string, forceRefresh?: boolean) => Promise<FormSchema>
  listEntities: () => Promise<EntityInfo[]>
  clearCache: (entityName?: string) => void
}

export function useFormMetadata(): UseFormMetadataReturn {
  const schemas = ref(new Map<string, FormSchema>())
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchSchema = async (
    entityName: string,
    forceRefresh: boolean = false
  ): Promise<FormSchema & any> => {
    // Cache - retorna se já existe e não forçou refresh
    if (!forceRefresh && schemas.value.has(entityName)) {
      return schemas.value.get(entityName)!
    }

    loading.value = true
    error.value = null

    try {
      const backendMetadata = await $axios
        .get<EntityMetadata>(`api/metadata/${entityName}`)
        .then((res) => res.data)

      // Adapta para formato do form generator
      const schema = MetadataAdapter.toFormSchema(backendMetadata)

      // Armazena no cache
      schemas.value.set(entityName, schema)

      return schema
    } catch (e: any) {
      error.value = e.message || 'Erro ao carregar schema'
      throw e
    } finally {
      loading.value = false
    }
  }

  const listEntities = async (): Promise<EntityInfo[]> => {
    loading.value = true
    error.value = null

    try {
      const entities = await $axios
        .get<EntityInfo[]>('/metadata')
        .then((res) => res.data)
      return entities
    } catch (e: any) {
      error.value = e.message || 'Erro ao listar entidades'
      throw e
    } finally {
      loading.value = false
    }
  }

  const clearCache = (entityName?: string): void => {
    if (entityName) {
      schemas.value.delete(entityName)
    } else {
      schemas.value.clear()
    }
  }

  return {
    schemas,
    loading,
    error,
    fetchSchema,
    listEntities,
    clearCache
  }
}
