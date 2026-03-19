// composables/useAnalyticsApi.ts
import { ref } from 'vue'
import type { AxiosRequestConfig } from 'axios'
import { isAxiosError } from 'axios'
import { $axios } from '@/helpers/integration/integration'
import type {
  ChartConfig,
  ChartQueryResponse,
  EntityMetadata,
  QueryConfig
} from '@/bin/platform/dashboard/components/dynamicChartWidget/types/analytics'


// Se o $axios já tem baseURL = "/api/v1", isso vira "/api/v1/analytics/..."
const API_PREFIX = '/api/v1/analytics'

export function useAnalyticsApi() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  const clearError = () => (error.value = null)

  async function request<T>(config: AxiosRequestConfig): Promise<T> {
    loading.value = true
    error.value = null

    try {
      const response = await $axios.request<T>({
        ...config,
        // Se quiser forçar JSON em requests com body:
        headers: {
          'Content-Type': 'application/json',
          ...(config.headers || {})
        }
      })

      return response.data
    } catch (e) {
      // tenta extrair mensagem padronizada do backend
      if (isAxiosError(e)) {
        const msg =
          (e.response?.data as any)?.message ||
          e.response?.statusText ||
          e.message ||
          'Erro desconhecido'
        error.value = msg
      } else {
        error.value = e instanceof Error ? e.message : 'Erro desconhecido'
      }
      throw e
    } finally {
      loading.value = false
    }
  }

  async function getEntities(): Promise<EntityMetadata[]> {
    return request<EntityMetadata[]>({
      method: 'GET',
      url: `${API_PREFIX}/entities`
    })
  }

  async function getEntityMetadata(entityName: string): Promise<EntityMetadata> {
    return request<EntityMetadata>({
      method: 'GET',
      url: `${API_PREFIX}/entities/${encodeURIComponent(entityName)}`
    })
  }

  async function executeChartQuery(
    queryConfig: QueryConfig,
    chartConfig: ChartConfig
  ): Promise<ChartQueryResponse> {
    return request<ChartQueryResponse>({
      method: 'POST',
      url: `${API_PREFIX}/chart`,
      data: { queryConfig, chartConfig }
    })
  }

  return {
    loading,
    error,
    clearError,
    getEntities,
    getEntityMetadata,
    executeChartQuery
  }
}
