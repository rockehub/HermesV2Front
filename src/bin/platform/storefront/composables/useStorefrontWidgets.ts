import { computed } from 'vue'
import { usePluginManager } from '@/helpers/extensionLoader/usePluginManager'
import StorefrontWidgetBase, {
  type StorefrontWidgetField,
} from '../widgets/StorefrontWidgetBase'
import type { WidgetBase } from '@/helpers/extensionLoader/WidgetBase'
import type { StorefrontPageType } from '@/bin/platform/storefront/composables/useStorefrontApi'

export function useStorefrontWidgets() {
  const { getGlobalWidgets } = usePluginManager()

  type GlobalWidgetItem = {
    widgets: WidgetBase[]
    name: string
  }

  const widgets = computed(() => {
    let globalWidgets = getGlobalWidgets().value as GlobalWidgetItem[]
    return globalWidgets
      .flatMap((entry) => entry.widgets)
      .filter((widget: any) => widget?.isStorefrontWidget)
  })

  const categories = computed(() => {
    const map = new Map<string, StorefrontWidgetBase[]>()
    widgets.value.forEach((widget: any) => {
      const list = map.get(widget.category) ?? []
      list.push(widget)
      map.set(widget.category, list)
    })
    return Array.from(map.entries()).map(([name, items]) => ({ name, widgets: items }))
  })

  const getWidgetByName = (name: string) =>
    widgets.value.find((widget: any) => widget.name === name)

  const isStorefrontWidget = (widget: WidgetBase): widget is StorefrontWidgetBase => {
    return 'supportedPageTypes' in widget
  }

  const getWidgetsForPageType = (pageType: StorefrontPageType) =>
    widgets.value
      .filter(isStorefrontWidget)
      .filter((widget) => widget.supportedPageTypes.includes(pageType))


  const buildInitialConfiguration = (fields: StorefrontWidgetField[]) => {
    return fields.reduce<Record<string, any>>((acc, field) => {
      acc[field.id] = field.defaultValue ?? (field.type === 'number' ? 0 : '')
      return acc
    }, {})
  }

  return {
    widgets,
    categories,
    getWidgetByName,
    getWidgetsForPageType,
    buildInitialConfiguration
  }
}
