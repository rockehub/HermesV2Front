import { type App, type Component, createVNode, ref, render } from 'vue'
import { ExtensionBase } from '@/helpers/extensionLoader/ExtensionBase'
import { type SearchContextItem } from '@/types/global.d'
import { registerSearchItem } from '@/helpers/search/searchRegistry'
import router from '@/helpers/routes/main'

export const routes = ref([])
export const pluginsLoaded = ref(false)
export const menuItems = ref([])
export const searchContexts: SearchContextItem[] = []
export const plugins: Record<string, any> = {}
export const languages: Record<string, any> = {}
export const globalWidgets: Array<{ name: string; widgets: any[] }> = []


let componentCounter = 0

export async function loadPlugins() {
  const platformPlugins = import.meta.glob('../../bin/platform/*/plugin.ts', { eager: true })
  const customPlugins = import.meta.glob('../../bin/custom/*/plugin.ts', { eager: true })

  const allPlugins = { ...platformPlugins, ...customPlugins }

  // 1. Criar instâncias diretamente no objeto `plugins`
  await Promise.all(
    Object.entries(allPlugins).map(async ([key, module]) => {
      const PluginClass = module.default
      if (PluginClass && typeof PluginClass === 'function' && PluginClass.prototype instanceof ExtensionBase) {
        console.info(`Loading plugin: ${PluginClass.name}`)
        plugins[PluginClass.name] = new PluginClass() // Já cria a instância aqui
      }
    })
  )

  // 2. Iterar sobre as instâncias para registrar configurações
  Object.values(plugins).forEach((plugin: ExtensionBase) => {
    console.info(`Registering plugin: ${plugin.name}`)


    menuItems.value.push(plugin.menuItem)

    if (plugin.routes && Array.isArray(plugin.routes)) {
      console.log(`registering routes for ${plugin.name}`)
      console.log(...plugin.routes)
      routes.value.push(...plugin.routes)
    } else {
      console.warn(`Plugin ${plugin.name} does not define valid routes.`)
    }

    plugin.menuItem.value.forEach((item) => {
      registerSearchItem({
        name: item.label,
        keywords: [item.label],
        type: 'page',
        icon: item.icon,
        action: () => {
          router.push({ name: item.name })
        }
      })
    })


    if (plugin.searchContexts) {
      searchContexts.push(...plugin.searchContexts)
    }

    if (plugin.languages) {
      console.log(`registering languages for ${plugin.name}`)
      Object.entries(plugin.languages).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          languages[key] = { ...(languages[key] || {}), ...value }
        } else if (!languages[key]) {
          languages[key] = value
        } else {
          console.warn(`Duplicate key found for ${key}, keeping existing value.`)
        }
      })
    }
  })

  console.log('plugins loaded')
  pluginsLoaded.value = true
}


export async function bootPlugins() {
  await Promise.all(
    Object.values(plugins).map(async (PluginClass) => {
      const plugin = PluginClass
      console.info(`Booting plugin: ${plugin.name}`)
      await plugin.boot()
    })
  )
}

export async function runWhenAuthenticated() {
  await Promise.all(
    Object.values(plugins).map(async (PluginClass) => {
      const plugin = PluginClass
      console.info(`When Authenticated: ${plugin.name}`)
      await plugin.whenAuthenticated()
    })
  )
}

export async function runWhenUnauthenticated() {
  await Promise.all(
    Object.values(plugins).map(async (PluginClass) => {
      const plugin = PluginClass
      console.info(`When Authenticated: ${plugin.name}`)
      await plugin.whenUnauthenticated()
    })
  )
}

export async function registerPlugins(app: App) {
  await Promise.all(
    Object.values(plugins).map(async (PluginClass) => {
      const plugin = PluginClass
      console.info(`Registering plugin: ${plugin.name}`)
      plugin.register(app)

      console.info(`Registering GlobalComponents from plugin: ${plugin.name}`)
      registerGlobalComponent(app, plugin)

      console.info(`Registering GlobalWidgets from plugin: ${plugin.name}`)
      registerGlobalWidgets(plugin)
    })
  )
}

function registerGlobalWidgets(plugin: any) {
  let pluginEntry = globalWidgets.find((entry) => entry.name === plugin.name)

  if (!pluginEntry) {
    pluginEntry = { name: plugin.name, widgets: [] }
    globalWidgets.push(pluginEntry)
  }

  plugin.globalWidgets.forEach((widget: any) => {
    console.info('Registering global widget:', widget.name)
    pluginEntry!.widgets.push(new widget())
  })
}

function registerGlobalComponent(app: App, plugin: any) {
  plugin.globalComponents.forEach((component: Component) => {
    const componentName = generateComponentName(component)
    console.info(`Registering component ${componentName}`)

    if (componentName) {
      app.component(componentName, component)
      const rootContainer = document.createElement('div')
      document.body.appendChild(rootContainer)
      render(createVNode(component), rootContainer)
    }
  })
}

function generateComponentName(component: any, fallbackPrefix = 'Component') {
  return component.name || `${fallbackPrefix}_${++componentCounter}`
}

(async function() {
  await loadPlugins()
})()
