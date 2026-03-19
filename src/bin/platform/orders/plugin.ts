import { ExtensionBase } from '@/helpers/extensionLoader/ExtensionBase'
import type { MenuItem } from '@/types/global'
import OrdersPage from './pages/orders.vue'
import { type Ref, ref } from 'vue'
import { $axios } from '@/helpers/integration/integration'

export default class OrdersPlugin extends ExtensionBase {
  name = 'orders'
  component = OrdersPage
  menuItem: Ref<MenuItem[]> = ref([])

  routes = [
    {
      name: 'orders',
      path: '/orders',
      component: OrdersPage,
      meta: { auth: true, roles: ['orders:view'] }
    }
  ]

  async boot(): Promise<void> {}

  async whenAuthenticated(): Promise<void> {
    try {
      await $axios.post('/api/v1/admin/plugins/roles', {
        pluginId: 'orders',
        roles: [{ name: 'orders:view', description: 'Visualizar pedidos' }]
      })
    } catch (e) {
      console.warn('OrdersPlugin: failed to register roles', e)
    }

    this.menuItem.value = [
      {
        name: 'orders',
        label: 'Pedidos',
        icon: { icon: 'fa-light fa-bag-shopping', type: 'fa' }
      }
    ]
  }
}
