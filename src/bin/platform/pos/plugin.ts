import { ExtensionBase } from '@/helpers/extensionLoader/ExtensionBase'
import type { MenuItem } from '@/types/global'
import posPage from './pages/pos.vue'
import { type Ref, ref } from 'vue'
import { $axios } from '@/helpers/integration/integration'
import { useAuthStore } from '@/stores/auth'
import { hasRole } from '@/helpers/rbac/checks/hasRole'
import { PosProductSearchWidget } from './widgets/PosProductSearch/PosProductSearch'
import { PosCartWidget } from './widgets/PosCart/PosCart'
import { PosCustomerWidget } from './widgets/PosCustomer/PosCustomer'
import { PosPaymentWidget } from './widgets/PosPayment/PosPayment'
import { PosSummaryWidget } from './widgets/PosSummary/PosSummary'
import { PosRecentSalesWidget } from './widgets/PosRecentSales/PosRecentSales'
import { PosQuickProductsWidget } from './widgets/PosQuickProducts/PosQuickProducts'
import { PosDeliveryWidget } from './widgets/PosDelivery/PosDelivery'

export default class PosPlugin extends ExtensionBase {
  component = posPage
  menuItem: Ref<MenuItem[]> = ref([])
  name = 'POS'

  routes = [
    {
      name: 'pos',
      path: '/pos',
      component: posPage,
      meta: { auth: true, roles: ['pos:sale:create'] }
    }
  ]

  globalWidgets = [
    PosProductSearchWidget,
    PosCartWidget,
    PosCustomerWidget,
    PosDeliveryWidget,
    PosPaymentWidget,
    PosSummaryWidget,
    PosRecentSalesWidget,
    PosQuickProductsWidget
  ]

  async whenAuthenticated(): Promise<void> {
    try {
      await $axios.post('/api/v1/admin/plugins/roles', {
        pluginId: 'pos',
        roles: [
          { name: 'pos:sale:create', description: 'Criar vendas no PDV' },
          { name: 'pos:discount:apply', description: 'Aplicar descontos' },
          { name: 'pos:price:change', description: 'Alterar preço unitário' },
          { name: 'pos:order:cancel', description: 'Cancelar pedidos PDV' },
          { name: 'pos:reports:view', description: 'Ver relatórios PDV' }
        ]
      })
    } catch (e) {
      console.warn('PosPlugin: falha ao registrar roles', e)
    }

    if (hasRole(['pos:sale:create'])) {
      this.menuItem.value = [
        {
          name: 'pos',
          label: 'PDV',
          icon: { icon: 'fa-light fa-cash-register text-[1.2rem]', type: 'fa' }
        }
      ]
    }
  }
}
