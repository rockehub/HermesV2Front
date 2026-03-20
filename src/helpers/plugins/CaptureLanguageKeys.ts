import type { App } from 'vue'

interface Options {
  enabled?: boolean
  exposeToWindow?: boolean
}

export default {
  install(app: App, options: Options = {}) {
    const enabled = options.enabled ?? import.meta.env.DEV
    const exposeToWindow = options.exposeToWindow ?? true

    if (!enabled) return

    // ---------------------------
    // GLOBAL ERROR HANDLER
    // ---------------------------
    window.onerror = (message, _source, _lineno, _colno, error) => {
      if (message?.toString().includes('ResizeObserver')) return

      console.error('error caught in plugin')
      console.error(message)
      console.error(error)
    }

    // ---------------------------
    // I18N CAPTURE
    // ---------------------------
    const missingKeys: Record<string, any> = {}
    const STORAGE_KEY = 'i18n_missing_keys'

    const loadExistingKeys = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          Object.assign(missingKeys, JSON.parse(stored))
        }
      } catch (e) {
        console.error('Erro ao carregar chaves existentes:', e)
      }
    }

    const saveKeys = () => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(missingKeys, null, 2))
      } catch (e) {
        console.error('Erro ao salvar chaves:', e)
      }
    }

    const setNestedKey = (obj: any, path: string, value = '') => {
      const keys = path.split('.')
      let current = obj

      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {}
        }
        current = current[keys[i]]
      }

      if (current[keys[keys.length - 1]] === undefined) {
        current[keys[keys.length - 1]] = value
        return true
      }
      return false
    }

    // intercept console.warn
    const originalWarn = console.warn
    console.warn = function (...args) {
      const message = args[0]

      if (typeof message === 'string' && message.includes('[intlify]')) {
        const match = message.match(/Not found '([^']+)' key in '([^']+)' locale/)

        if (match) {
          const [, key, locale] = match

          if (!missingKeys[locale]) {
            missingKeys[locale] = {}
          }

          const isNew = setNestedKey(missingKeys[locale], key, '')

          if (isNew) {
            console.log(
              `%c[i18n-capture] Nova chave: ${locale}.${key}`,
              'color: #4CAF50; font-weight: bold;'
            )
            saveKeys()
          }
        }
      }

      originalWarn.apply(console, args)
    }

    // ---------------------------
    // ACTIONS
    // ---------------------------
    const download = () => {
      const dataStr = JSON.stringify(missingKeys, null, 2)
      const blob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = url
      link.download = 'missing-i18n-keys.json'
      link.click()

      URL.revokeObjectURL(url)

      console.log('%c[i18n-capture] Download OK', 'color: #2196F3; font-weight: bold;')
    }

    const show = () => {
      console.log('%c[i18n-capture] Keys:', 'color: #FF9800; font-weight: bold;')
      console.log(JSON.stringify(missingKeys, null, 2))
    }

    const clear = () => {
      if (confirm('Limpar todas as chaves?')) {
        Object.keys(missingKeys).forEach((k) => delete missingKeys[k])
        localStorage.removeItem(STORAGE_KEY)
        console.log('%c[i18n-capture] Limpas!', 'color: #F44336; font-weight: bold;')
      }
    }

    // ---------------------------
    // INIT
    // ---------------------------
    loadExistingKeys()

    console.log('%c[i18n-capture] Plugin iniciado!', 'color: #9C27B0; font-weight: bold;')

    // expor global (opcional)
    if (exposeToWindow) {
      ;(window as any).downloadI18nKeys = download
      ;(window as any).showI18nKeys = show
      ;(window as any).clearI18nKeys = clear
    }

    // também disponível via app.config.globalProperties
    app.config.globalProperties.$i18nCapture = {
      download,
      show,
      clear
    }
  }
}
