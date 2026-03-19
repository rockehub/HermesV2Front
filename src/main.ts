import 'reflect-metadata'
import {pinia} from "@/stores/main";
import {createApp} from 'vue';
import App from './App.vue';
import '@/assets/css/style.css';
import notification from "@/helpers/utils/notification";
import {bootPlugins, menuItems, registerPlugins} from "@/helpers/extensionLoader/extension-loader";
import {configure, defineRule} from 'vee-validate';
import {all} from '@vee-validate/rules';
import {localize} from '@vee-validate/i18n';
import {useBreakpoints} from "@/stores/breakpoints";
import whenAuthenticatedRunner from "@/classes/initialization/auth"


import integration from "@/helpers/integration/integration";
import router from "@/helpers/routes/main";

// import 'material-icons/iconfont/material-icons.css';
// import websocket from "@/helpers/integration/websocket";
// import Pusher from "pusher-js";
import clickAway from "@/helpers/directives/ClickAway";
import {useLocalizationStore} from "@/stores/localizationStore";
import {inactivityPlugin} from "@/helpers/plugins/InactivityPlugin";

// window.Pusher = Pusher;

const initApp = async () => {
    const localizationStore = useLocalizationStore(pinia);
    Object.entries(all).forEach(([name, rule]) => {
        defineRule(name, rule);
    });

    configure({
        generateMessage: localize('br', {
            messages: localizationStore.i18n.global.messages
        })
    });

    const app = createApp(App);

    app.use(router);
    app.use(pinia);
    app.use(localizationStore.i18n);
    app.use(integration);
    // app.use(websocket);
    app.use(whenAuthenticatedRunner)
    app.use(inactivityPlugin, {duration: 900000} as any);
    app.directive('click-away', clickAway);

    app.config.globalProperties.$toast = notification;
    app.config.globalProperties.$menu = menuItems;

    const breakpoints = useBreakpoints(pinia);
    breakpoints.init();
    app.config.globalProperties.$breakpoints = breakpoints;

    await bootPlugins();

    await registerPlugins(app);

    app.mount('#app');
};

// Make sure that we get all error messages properly displayed
// as long as we are not in production mode
window.onerror = (message, _source, _lineno, _colno, error) => {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    if (message.toString().includes('ResizeObserver')) {
        // That error can apparently be ignored and can probably
        // not do anything about it anyway
        return;
    }
    console.error('error caught in main.ts');
    console.error(message);
    console.error(error);
};


if (import.meta.env.DEV) {
  // Script para capturar e organizar chaves i18n faltantes
  ;(function () {
    const missingKeys = {}
    const STORAGE_KEY = 'i18n_missing_keys'

    // Carrega chaves já capturadas do localStorage
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

    // Salva chaves no localStorage
    const saveKeys = () => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(missingKeys, null, 2))
      } catch (e) {
        console.error('Erro ao salvar chaves:', e)
      }
    }

    // Cria estrutura aninhada a partir da chave
    const setNestedKey = (obj, path, value = '') => {
      const keys = path.split('.')
      let current = obj

      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {}
        }
        current = current[keys[i]]
      }

      // Só adiciona se não existir
      if (current[keys[keys.length - 1]] === undefined) {
        current[keys[keys.length - 1]] = value
        return true // Nova chave adicionada
      }
      return false // Chave já existia
    }

    // Intercepta console.warn
    const originalWarn = console.warn
    console.warn = function (...args) {
      const message = args[0]

      // Detecta warning do intlify
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
              `%c[i18n-capture] Nova chave detectada: ${locale}.${key}`,
              'color: #4CAF50; font-weight: bold;'
            )
            saveKeys()
          }
        }
      }

      // Chama o warn original
      originalWarn.apply(console, args)
    }

    // Função para baixar o JSON
    window.downloadI18nKeys = () => {
      const dataStr = JSON.stringify(missingKeys, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'missing-i18n-keys.json'
      link.click()
      URL.revokeObjectURL(url)
      console.log(
        '%c[i18n-capture] Arquivo baixado com sucesso!',
        'color: #2196F3; font-weight: bold;'
      )
    }

    // Função para visualizar as chaves
    window.showI18nKeys = () => {
      console.log('%c[i18n-capture] Chaves capturadas:', 'color: #FF9800; font-weight: bold;')
      console.log(JSON.stringify(missingKeys, null, 2))
    }

    // Função para limpar as chaves
    window.clearI18nKeys = () => {
      if (confirm('Tem certeza que deseja limpar todas as chaves capturadas?')) {
        Object.keys(missingKeys).forEach((key) => delete missingKeys[key])
        localStorage.removeItem(STORAGE_KEY)
        console.log('%c[i18n-capture] Chaves limpas!', 'color: #F44336; font-weight: bold;')
      }
    }

    // Carrega chaves existentes ao iniciar
    loadExistingKeys()

    console.log(
      '%c[i18n-capture] Monitor de i18n iniciado!',
      'color: #9C27B0; font-weight: bold; font-size: 14px;'
    )
    console.log('%cComandos disponíveis:', 'color: #9C27B0; font-weight: bold;')
    console.log('  - downloadI18nKeys() : Baixa arquivo JSON')
    console.log('  - showI18nKeys()     : Mostra chaves no console')
    console.log('  - clearI18nKeys()    : Limpa chaves capturadas')
  })()
}


initApp().catch(error => console.error('Failed to initialize the app:', error));
