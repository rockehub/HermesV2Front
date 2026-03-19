// composables/useCrud.ts
import { ref, type Ref } from 'vue'
import CrudService from '../services/crudService'
import type { PageResponse, PaginationParams, SearchParams, CrudOptions } from '../types/crud.d'
import { useNotification } from '@/bin/platform/hermes/composables/useNotification'

interface Pagination {
  page: number
  size: number
  totalPages: number
  totalElements: number
}

interface UseCrudReturn<T> {
  items: Ref<T[]>
  currentItem: Ref<T | null>
  loading: Ref<boolean>
  error: Ref<string | null>
  pagination: Ref<Pagination>
  fetchAll: (params?: Partial<PaginationParams>) => Promise<T[]>
  fetchById: (id: string | number) => Promise<T>
  fetchRelation: (relation: string | number, id: string) => Promise<T[]>
  create: <D = Partial<T>>(payload: D) => Promise<T>
  update: <D = Partial<T>>(id: string | number, payload: D) => Promise<T>
  patch: <D = Partial<T>>(id: string | number, payload: D) => Promise<T>
  remove: (id: string | number) => Promise<void>
  search: (searchParams: SearchParams) => Promise<T[]>
  executeAction: <R = any, D = any>(
    action: string,
    id?: string | number | null,
    payload?: D | null
  ) => Promise<R>

  associateRelation: (
    id: string | number,
    relation: string,
    targetIds: string | number | (string | number)[]
  ) => Promise<void>
  addToRelation: (
    id: string | number,
    relation: string,
    targetIds: string | number | (string | number)[]
  ) => Promise<void>
  removeFromRelation: (
    id: string | number,
    relation: string,
    targetId?: string | number
  ) => Promise<void>
  updateRelationInBody: (
    id: string | number,
    relation: string,
    targetId: string | number
  ) => Promise<T>
}

export function useCrud<T = any>(entityName: string, options: CrudOptions = {}): UseCrudReturn<T> {
  const items = ref<T[]>([]) as Ref<T[]>
  const currentItem = ref<T | null>(null) as Ref<T | null>
  const loading = ref(false)
  const error = ref<string | null>(null)
  const pagination = ref<Pagination>({
    page: 0,
    size: 20,
    totalPages: 0,
    totalElements: 0
  })

  const { success, error: showError } = useNotification()

  const showSuccess = options.showSuccess !== false
  const showErrors = options.showErrors !== false

  const fetchAll = async (params: Partial<PaginationParams> = {}): Promise<T[]> => {
    loading.value = true
    error.value = null

    try {
      const response = await CrudService.findAll<T>(entityName, {
        page: pagination.value.page,
        size: pagination.value.size,
        ...params
      })

      // Spring Data REST pode retornar em _embedded ou content
      items.value = response._embedded?.[entityName] || response.content || []

      if (response.page) {
        pagination.value = {
          page: response.page.number,
          size: response.page.size,
          totalPages: response.page.totalPages,
          totalElements: response.page.totalElements
        }
      }

      return items.value
    } catch (e: any) {
      error.value = e.message
      if (showErrors) {
        showError('Erro ao carregar dados')
      }
      throw e
    } finally {
      loading.value = false
    }
  }

  const fetchRelation = async (relation: string | number, id: string): Promise<T[]> => {
    loading.value = true
    error.value = null

    try {
      return await CrudService.fetchRelation<T[]>(entityName, id, relation)
    } catch (e: any) {
      error.value = e.message
      if (showErrors) {
        showError('Erro ao carregar registro')
      }
      throw e
    } finally {
      loading.value = false
    }
  }
  const fetchById = async (id: string | number): Promise<T> => {
    loading.value = true
    error.value = null

    try {
      currentItem.value = await CrudService.findById<T>(entityName, id)
      return currentItem.value
    } catch (e: any) {
      error.value = e.message
      if (showErrors) {
        showError('Erro ao carregar registro')
      }
      throw e
    } finally {
      loading.value = false
    }
  }

  const create = async <D = Partial<T>>(payload: D): Promise<T> => {
    loading.value = true
    error.value = null

    try {
      const created = await CrudService.create<T, D>(entityName, payload)
      items.value.unshift(created)

      if (showSuccess) {
        success('Registro criado com sucesso!')
      }

      return created
    } catch (e: any) {
      error.value = e.message
      if (showErrors) {
        const message = e.response?.data?.message || 'Erro ao criar registro'
        showError(message)
      }
      throw e
    } finally {
      loading.value = false
    }
  }

  const update = async <D = Partial<T>>(id: string | number, payload: D): Promise<T> => {
    loading.value = true
    error.value = null

    try {
      const updated = await CrudService.update<T, D>(entityName, id, payload)

      const index = items.value.findIndex((item: any) => item.id === id)
      if (index !== -1) {
        items.value[index] = updated
      }

      if (showSuccess) {
        success('Registro atualizado com sucesso!')
      }

      return updated
    } catch (e: any) {
      error.value = e.message
      if (showErrors) {
        const message = e.response?.data?.message || 'Erro ao atualizar registro'
        showError(message)
      }
      throw e
    } finally {
      loading.value = false
    }
  }

  const patch = async <D = Partial<T>>(id: string | number, payload: D): Promise<T> => {
    loading.value = true
    error.value = null

    try {
      const patched = await CrudService.patch<T, D>(entityName, id, payload)

      const index = items.value.findIndex((item: any) => item.id === id)
      if (index !== -1) {
        items.value[index] = patched
      }

      if (showSuccess) {
        success('Registro atualizado com sucesso!')
      }

      return patched
    } catch (e: any) {
      error.value = e.message
      if (showErrors) {
        const message = e.response?.data?.message || 'Erro ao atualizar registro'
        showError(message)
      }
      throw e
    } finally {
      loading.value = false
    }
  }

  const remove = async (id: string | number): Promise<void> => {
    loading.value = true
    error.value = null

    try {
      await CrudService.delete(entityName, id)
      items.value = items.value.filter((item: any) => item.id !== id)

      if (showSuccess) {
        success('Registro excluído com sucesso!')
      }
    } catch (e: any) {
      error.value = e.message
      if (showErrors) {
        const message = e.response?.data?.message || 'Erro ao excluir registro'
        showError(message)
      }
      throw e
    } finally {
      loading.value = false
    }
  }

  const search = async (searchParams: SearchParams): Promise<T[]> => {
    loading.value = true
    error.value = null

    try {
      const response = await CrudService.search<T>(entityName, searchParams)
      items.value = response._embedded?.[entityName] || response.content || []
      return items.value
    } catch (e: any) {
      error.value = e.message
      if (showErrors) {
        showError('Erro ao buscar dados')
      }
      throw e
    } finally {
      loading.value = false
    }
  }

  const executeAction = async <R = any, D = any>(
    action: string,
    id: string | number | null = null,
    payload: D | null = null
  ): Promise<R> => {
    loading.value = true
    error.value = null

    try {
      const result = await CrudService.execute<R, D>(entityName, action, id, payload)

      if (showSuccess) {
        success(`Ação "${action}" executada com sucesso!`)
      }

      return result
    } catch (e: any) {
      error.value = e.message
      if (showErrors) {
        const message = e.response?.data?.message || `Erro ao executar "${action}"`
        showError(message)
      }
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Associa/substitui uma relação (PUT)
   */
  const associateRelation = async (
    id: string | number,
    relation: string,
    targetIds: string | number | (string | number)[]
  ): Promise<void> => {
    loading.value = true
    error.value = null

    try {
      await CrudService.associateRelation(entityName, id, relation, targetIds)

      if (showSuccess) {
        success('Relação atualizada com sucesso!')
      }
    } catch (e: any) {
      error.value = e.message
      if (showErrors) {
        const message = e.response?.data?.message || 'Erro ao atualizar relação'
        showError(message)
      }
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Adiciona itens a uma relação to-many (POST)
   */
  const addToRelation = async (
    id: string | number,
    relation: string,
    targetIds: string | number | (string | number)[]
  ): Promise<void> => {
    loading.value = true
    error.value = null

    try {
      await CrudService.addToRelation(entityName, id, relation, targetIds)

      if (showSuccess) {
        success('Itens adicionados à relação com sucesso!')
      }
    } catch (e: any) {
      error.value = e.message
      if (showErrors) {
        const message = e.response?.data?.message || 'Erro ao adicionar à relação'
        showError(message)
      }
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Remove um item de uma relação
   */
  const removeFromRelation = async (
    id: string | number,
    relation: string,
    targetId?: string | number
  ): Promise<void> => {
    loading.value = true
    error.value = null

    try {
      await CrudService.removeFromRelation(entityName, id, relation, targetId)

      if (showSuccess) {
        success('Item removido da relação com sucesso!')
      }
    } catch (e: any) {
      error.value = e.message
      if (showErrors) {
        const message = e.response?.data?.message || 'Erro ao remover da relação'
        showError(message)
      }
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Atualiza relação via PATCH no body
   */
  const updateRelationInBody = async (
    id: string | number,
    relation: string,
    targetId: string | number
  ): Promise<T> => {
    loading.value = true
    error.value = null

    try {
      const updated = await CrudService.updateRelationInBody<T>(entityName, id, relation, targetId)

      if (showSuccess) {
        success('Relação atualizada com sucesso!')
      }

      return updated
    } catch (e: any) {
      error.value = e.message
      if (showErrors) {
        const message = e.response?.data?.message || 'Erro ao atualizar relação'
        showError(message)
      }
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    items,
    currentItem,
    loading,
    error,
    pagination,
    fetchAll,
    fetchRelation,
    fetchById,
    create,
    update,
    patch,
    remove,
    search,
    executeAction,
    associateRelation,
    addToRelation,
    removeFromRelation,
    updateRelationInBody
  }
}
