// services/api/CrudService.ts
import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios'
import type { PaginationParams, PageResponse, SearchParams } from '../types/crud'
import { $axios } from '@/helpers/integration/integration'

class CrudService {
  async findAll<T>(
    entity: string,
    params: Partial<PaginationParams> = {}
  ): Promise<PageResponse<T>> {
    const { data } = await $axios.get<PageResponse<T>>(`/api/v1/data/${entity}`, { params })
    return data
  }

  async findById<T>(entity: string, id: string | number): Promise<T> {
    const { data } = await $axios.get<T>(`/api/v1/data/${entity}/${id}`)
    return data
  }

  async fetchRelation<T>(entityName: string, id: string, relation: string | number) {
    const { data } = await $axios.get<T>(`/api/v1/data/${entityName}/${id}/${relation}`)
    return data
  }

  async create<T, D = Partial<T>>(entity: string, payload: D): Promise<T> {
    const { data } = await $axios.post<T>(`/api/v1/data/${entity}`, payload)
    return data
  }

  async update<T, D = Partial<T>>(entity: string, id: string | number, payload: D): Promise<T> {
    const { data } = await $axios.put<T>(`/api/v1/data/${entity}/${id}`, payload)
    return data
  }

  async patch<T, D = Partial<T>>(entity: string, id: string | number, payload: D): Promise<T> {
    const { data } = await $axios.patch<T>(`/api/v1/data/${entity}/${id}`, payload)
    return data
  }

  async delete(entity: string, id: string | number): Promise<void> {
    await $axios.delete(`/api/v1/data/${entity}/${id}`)
  }

  async search<T>(entity: string, searchParams: SearchParams): Promise<PageResponse<T>> {
    const { data } = await $axios.get<PageResponse<T>>(`/api/v1/data/${entity}/search`, {
      params: searchParams
    })
    return data
  }

  async execute<T = any, D = any>(
    entity: string,
    action: string,
    id: string | number | null = null,
    payload: D | null = null
  ): Promise<T> {
    const url = id ? `/api/v1/data/${entity}/${id}/${action}` : `/${entity}/${action}`
    const { data } = await $axios.post<T>(url, payload)
    return data
  }

  async customRequest<T>(
    method: 'get' | 'post' | 'put' | 'patch' | 'delete',
    url: string,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const { data } = await $axios.request<T>({
      method,
      url,
      ...config
    })
    return data
  }

  /**
   * Associa/substitui uma relação (PUT)
   * Para to-one (ManyToOne, OneToOne) ou substituir to-many completo
   */
  async associateRelation(
    entity: string,
    id: string | number,
    relation: string,
    targetIds: string | number | (string | number)[]
  ): Promise<void> {
    const ids = Array.isArray(targetIds) ? targetIds : [targetIds]
    const uris = ids
      .map((targetId) => `${$axios.defaults.baseURL}/api/v1/data/${relation}/${targetId}`)
      .join('\n')

    await $axios.put(`/api/v1/data/${entity}/${id}/${relation}`, uris, {
      headers: {
        'Content-Type': 'text/uri-list'
      }
    })
  }

  /**
   * Adiciona itens a uma relação to-many (POST)
   * NÃO remove os existentes
   */
  async addToRelation(
    entity: string,
    id: string | number,
    relation: string,
    targetIds: string | number | (string | number)[]
  ): Promise<void> {
    const ids = Array.isArray(targetIds) ? targetIds : [targetIds]
    const uris = ids
      .map((targetId) => `${$axios.defaults.baseURL}/api/v1/data/${relation}/${targetId}`)
      .join('\n')

    await $axios.post(`/api/v1/data/${entity}/${id}/${relation}`, uris, {
      headers: {
        'Content-Type': 'text/uri-list'
      }
    })
  }

  /**
   * Remove um item específico de uma relação to-many (DELETE)
   * Ou remove toda a associação de um to-one
   */
  async removeFromRelation(
    entity: string,
    id: string | number,
    relation: string,
    targetId?: string | number
  ): Promise<void> {
    const url = targetId
      ? `/api/v1/data/${entity}/${id}/${relation}/${targetId}`
      : `/api/v1/data/${entity}/${id}/${relation}`

    await $axios.delete(url)
  }

  /**
   * Atualiza relação via PATCH no body (alternativa ao text/uri-list)
   */
  async updateRelationInBody<T>(
    entity: string,
    id: string | number,
    relation: string,
    targetId: string | number
  ): Promise<T> {
    const uri = `${$axios.defaults.baseURL}/api/v1/data/${relation}/${targetId}`

    const { data } = await $axios.patch<T>(`/api/v1/data/${entity}/${id}`, { [relation]: uri })
    return data
  }
}

export default new CrudService()
