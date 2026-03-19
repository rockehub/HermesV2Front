import { ExtensionBase } from '@/helpers/extensionLoader/ExtensionBase'
import type { MenuItem } from '@/types/global'
import employeesPage from './pages/employees.vue'
import employeeDetailPage from './pages/employee-detail.vue'
import rolesPage from './pages/roles.vue'
import { type Ref, ref } from 'vue'
import { $axios } from '@/helpers/integration/integration'
import { useAuthStore } from '@/stores/auth'
import { pt } from './lang/pt/lang'

export default class SecurityPlugin extends ExtensionBase {
  name = 'security'
  component = employeesPage
  menuItem: Ref<MenuItem[]> = ref([])
  languages = { pt }

  routes = [
    {
      name: 'security-employees',
      path: '/security/employees',
      component: employeesPage,
      meta: { auth: true, roles: ['ADMIN'] }
    },
    {
      name: 'security-employee',
      path: '/security/employees/:id',
      component: employeeDetailPage,
      meta: { auth: true, roles: ['ADMIN'] }
    },
    {
      name: 'security-roles',
      path: '/security/roles',
      component: rolesPage,
      meta: { auth: true, roles: ['ADMIN'] }
    }
  ]

  async boot(): Promise<void> {}

  async whenAuthenticated(): Promise<void> {
    try {
      await $axios.post('/api/v1/admin/plugins/roles', {
        pluginId: 'security',
        roles: [
          { name: 'security:employees:read', description: 'Ver employees' },
          { name: 'security:employees:write', description: 'Criar/editar employees' },
          { name: 'security:roles:read', description: 'Ver roles e privileges' },
          { name: 'security:roles:write', description: 'Criar/editar roles e privileges' },
        ]
      })
    } catch (e) {
      console.warn('SecurityPlugin: falha ao registrar roles', e)
    }

    if (useAuthStore().isAdmin) {
      this.menuItem.value = [
        {
          name: 'security-employees',
          label: 'Segurança',
          icon: { icon: 'fa-light fa-shield-halved', type: 'fa' }
        }
      ]
    }
  }
}
