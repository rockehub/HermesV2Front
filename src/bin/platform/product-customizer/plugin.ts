import { ExtensionBase } from '@/helpers/extensionLoader/ExtensionBase'
import type { MenuItem } from '@/types/global.d'
import { type Ref, ref } from 'vue'
import { $axios } from '@/helpers/integration/integration'
import { hasRole } from '@/helpers/rbac/checks/hasRole'
import ProductsPage from './pages/ProductsPage.vue'
import ProductDetailPage from './pages/ProductDetailPage.vue'

export default class ProductCustomizerPlugin extends ExtensionBase {
  component = ProductsPage
  menuItem: Ref<MenuItem[]> = ref([])
  name = 'ProductCustomizer'

  routes = [
    {
      name: 'product-customizer',
      path: '/product-customizer',
      component: ProductsPage,
      meta: { auth: true, roles: ['products:customize'] }
    },
    {
      name: 'product-customizer-detail',
      path: '/product-customizer/:productId',
      component: ProductDetailPage,
      meta: { auth: true, roles: ['products:customize'] }
    }
  ]

  async whenAuthenticated(): Promise<void> {
    try {
      await $axios.post('/api/v1/admin/plugins/roles', {
        pluginId: 'product-customizer',
        roles: [
          { name: 'products:customize', description: 'Acessar o customizador de produtos' },
          { name: 'products:price:edit', description: 'Editar preços dos produtos' }
        ]
      })
    } catch (e) {
      console.warn('ProductCustomizerPlugin: falha ao registrar roles', e)
    }

    if (hasRole(['products:customize'])) {
      this.menuItem.value = [
        {
          name: 'product-customizer',
          label: 'Customizador',
          icon: { icon: 'fa-light fa-sliders text-[1.2rem]', type: 'fa' }
        }
      ]
    }
  }
}
