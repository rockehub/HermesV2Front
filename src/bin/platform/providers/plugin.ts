import { ExtensionBase } from '@/helpers/extensionLoader/ExtensionBase'
import type { MenuItem } from '@/types/global.d'
import providersPage from './pages/providers.vue'
import { type Ref, ref } from 'vue'
import { $axios } from '@/helpers/integration/integration'
import { useAuthStore } from '@/stores/auth'

export default class ProvidersPlugin extends ExtensionBase {
  name = 'providers'
  component = providersPage
  menuItem: Ref<MenuItem[]> = ref([])

  routes = [
    {
      name: 'providers',
      path: '/providers/:tab?',
      component: providersPage,
      meta: { auth: true }
    }
  ]

  async boot(): Promise<void> {}

  async whenAuthenticated(): Promise<void> {
    try {
      await $axios.post('/api/v1/admin/plugins/roles', {
        pluginId: 'providers',
        roles: [{ name: 'providers:manage', description: 'Configurar provedores' }]
      })
    } catch (e) {
      console.warn('ProvidersPlugin: falha ao registrar roles', e)
    }

    if (useAuthStore().isAdmin) {
      this.menuItem.value = [
        {
          name: 'providers',
          label: 'Provedores',
          icon: { icon: 'fa-light fa-plug-circle-bolt', type: 'fa' }
        }
      ]
    }
  }
}

