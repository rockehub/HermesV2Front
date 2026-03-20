import { defineStore } from 'pinia'
import type { WidgetBase } from '@/helpers/extensionLoader/WidgetBase'
import { $axios } from '@/helpers/integration/integration'
import type { WidgetArea } from '@/types/global.d'

export type WidgetAreaResponse = WidgetArea

export const useGlobalWidgetStore = defineStore('globalWidgetStore', () => {
  /**
   * Busca widgets de uma área específica
   */
  const fetchUsersWidget = async (widgetArea: string): Promise<WidgetAreaResponse> => {
    const response = await $axios.get(`/widgets/${widgetArea}`)
    return response.data
  }

  /**
   * Adiciona widget a uma área com configuração inicial
   */
  const addToWidgetArea = async (
    widgetArea: string,
    widget: WidgetBase,
    configuration: Record<string, any>
  ): Promise<WidgetAreaResponse> => {
    const response = await $axios.post(`/widgets/${widgetArea}`, {
      name: widget.name,
      configuration: configuration,
      allowMultiple: widget.allowMultiple
    })
    return response.data
  }

  /**
   * Atualiza configuração de um widget individualmente
   */
  const updateWidgetConfiguration = async (
    widgetAreaId: string,
    widgetId: string,
    configuration: Record<string, any>
  ): Promise<WidgetAreaResponse> => {
    const response = await $axios.patch(`/widgets/${widgetAreaId}/${widgetId}/configuration`, {
      configuration
    })
    return response.data
  }

  /**
   * Atualiza posição de um widget individualmente
   */
  const updateWidgetPosition = async (
    widgetAreaId: string,
    widgetId: string,
    position: number
  ): Promise<void> => {
    await $axios.patch(`/widgets/${widgetAreaId}/${widgetId}/position`, { position })
  }

  /**
   * Deleta um widget de uma área
   */
  const deleteWidget = async (
    widgetId: string,
    widgetAreaId: string
  ): Promise<WidgetAreaResponse> => {
    const response = await $axios.delete(`/widgets/${widgetAreaId}/${widgetId}/detach-widget`)
    return response.data
  }

  /**
   * Atualiza posições de múltiplos widgets (bulk update - opcional, mantido para compatibilidade)
   */
  const updatePositions = async (
    widgets: Array<{ id: string; pivot: string; position: number }>,
    widgetArea: string
  ): Promise<void> => {
    const sanitizedWidgets = widgets.map(({ id, pivot, position }, index) => ({
      widgetId: id,
      widgetAreaId: pivot,
      position: index + 1
    }))

    await $axios.patch('/widgets/update-positions', {
      widgets: sanitizedWidgets,
      widgetArea
    })
  }

  return {
    fetchUsersWidget,
    addToWidgetArea,
    updateWidgetConfiguration,
    updateWidgetPosition,
    deleteWidget,
    updatePositions
  }
})
