import { ref, readonly, computed, type Ref, type DeepReadonly } from 'vue'
import {
  routes,
  menuItems,
  searchContexts,
  plugins,
  globalWidgets,
  languages
} from './extension-loader'
import { WidgetBase } from '@/helpers/extensionLoader/WidgetBase'
import { type Configurable } from '@/types/global.d'
import { merge } from 'lodash-es'
import type { ExtensionBase } from '@/helpers/extensionLoader/ExtensionBase'

type UnknownRecord = Record<string, unknown>
type TranslationMessages = Record<string, unknown>
type TranslationMap = Record<string, TranslationMessages>

type RouteItem = unknown
type SearchContextItem = unknown
type PluginRegistry = Record<string, ExtensionBase>
type LanguageRegistry = Record<string, unknown>

type WidgetConfigurationField = {
  name: string
  default?: unknown
} & Record<string, unknown>

type WidgetGroup = {
  widgets: WidgetBase[]
} & Record<string, unknown>

type GlobalWidgetItem = {
  widgets: WidgetBase[]
}

type ConfigurableWidget = WidgetBase & Configurable

type UsePluginManagerReturn = {
  getPlugins: () => DeepReadonly<Ref<PluginRegistry>>
  getRoutes: () => DeepReadonly<Ref<RouteItem[]>>
  getMenuItems: () => DeepReadonly<typeof menuItems>
  getSearchContexts: () => DeepReadonly<Ref<SearchContextItem[]>>
  getGlobalWidgets: () => DeepReadonly<Ref<WidgetGroup[]>>

  isConfigurable: (widget: WidgetBase | Configurable) => widget is Configurable
  buildConfigurationValues: (
    widget: WidgetBase | Configurable,
    formData?: Record<string, unknown>
  ) => Record<string, unknown>
  findWidgetByName: (name: string) => WidgetBase | undefined
  mergeConfiguration: (widget: ConfigurableWidget) => WidgetConfigurationField[]

  mergeAllTranslations: () => Promise<TranslationMap>

  pluginMenuItems: typeof menuItems
}

export function usePluginManager(): UsePluginManagerReturn {
  // Reactive references to expose data
  const pluginRoutes = ref([...routes.value]) as Ref<RouteItem[]>
  const pluginMenuItems = menuItems
  const pluginSearchContexts = ref([...searchContexts]) as Ref<SearchContextItem[]>
  const pluginGlobalWidgets = ref([...globalWidgets]) as Ref<WidgetGroup[]>
  const registeredPlugins = ref({ ...plugins }) as Ref<PluginRegistry>
  const registeredLanguages = ref(languages) as Ref<LanguageRegistry>

  // Methods to access and manipulate plugin data
  const getPlugins = () => readonly(registeredPlugins)
  const getRoutes = () => readonly(pluginRoutes)
  const getMenuItems = () => readonly(pluginMenuItems)
  const getSearchContexts = () => readonly(pluginSearchContexts)
  const getGlobalWidgets = () => readonly(pluginGlobalWidgets)

  const mergeAllTranslations = async (): Promise<TranslationMap> => {
    const mergedMessages: TranslationMap = {}

    // 1. Carrega os arquivos principais de src/lang/<lang-code>/lang.ts
    const baseLangModules = import.meta.glob('../../lang/**/lang.ts', { eager: true })

    for (const path in baseLangModules) {
      const mod = baseLangModules[path] as Record<string, unknown>
      const langCode = path.match(/lang\/([^/]+)\/lang\.ts$/)?.[1]
      if (!langCode) continue

      const messages =
        (mod[langCode] as TranslationMessages | undefined) ??
        (mod.default as TranslationMessages | undefined) ??
        {}

      mergedMessages[langCode] = merge({}, mergedMessages[langCode] ?? {}, messages)
    }

    // 2. Carrega arquivos dos plugins
    const pluginLangModules = import.meta.glob(
      ['../../bin/custom/**/lang/**/lang.ts', '../../bin/platform/**/lang/**/lang.ts'],
      { eager: true }
    )

    for (const path in pluginLangModules) {
      const mod = pluginLangModules[path] as Record<string, unknown>
      const langCode = path.match(/lang\/([^/]+)\/lang\.ts$/)?.[1]
      if (!langCode) continue

      const messages =
        (mod[langCode] as TranslationMessages | undefined) ??
        (mod.default as TranslationMessages | undefined) ??
        {}

      mergedMessages[langCode] = merge({}, mergedMessages[langCode] ?? {}, messages)
    }

    return mergedMessages
  }

  const isConfigurable = (widget: WidgetBase | Configurable): widget is Configurable => {
    return 'widgetConfiguration' in widget
  }

  const mergeConfiguration = (widget: ConfigurableWidget): WidgetConfigurationField[] => {
    return [
      ...(widget.configuration as WidgetConfigurationField[]),
      ...((widget.widgetConfiguration ?? []) as unknown as WidgetConfigurationField[])
    ]
  }

  const buildConfigurationValues = (
    widget: WidgetBase | Configurable,
    formData?: Record<string, unknown>
  ): Record<string, unknown> => {
    let config: WidgetConfigurationField[] = []

    if (isConfigurable(widget)) {
      config = [
        ...(widget.configuration as WidgetConfigurationField[]),
        ...((widget.widgetConfiguration ?? []) as unknown as WidgetConfigurationField[])
      ]
    }

    const payload: Record<string, unknown> = {}

    config.forEach((conf) => {
      if (formData) {
        if (Object.prototype.hasOwnProperty.call(formData, conf.name)) {
          payload[conf.name] = formData[conf.name]
        } else if (Object.prototype.hasOwnProperty.call(conf, 'default')) {
          payload[conf.name] = conf.default
        }
      } else if (Object.prototype.hasOwnProperty.call(conf, 'default')) {
        payload[conf.name] = conf.default
      }
    })

    return payload
  }

  const allWidgets = computed<WidgetBase[]>(() => {
    const globalWidgetsValue = getGlobalWidgets().value as GlobalWidgetItem[]
    return globalWidgetsValue.flatMap((item) => item.widgets)
  })

  const findWidgetByName = (name: string): WidgetBase | undefined => {
    return allWidgets.value.find((widget) => widget.name === name)
  }

  return {
    getPlugins,
    getRoutes,
    getMenuItems,
    getSearchContexts,
    getGlobalWidgets,
    isConfigurable,
    buildConfigurationValues,
    findWidgetByName,
    mergeConfiguration,
    mergeAllTranslations,
    pluginMenuItems
  }
}
