import { ExtensionBase } from '@/helpers/extensionLoader/ExtensionBase'
import type { MenuItem } from '@/types/global'
import FiscalPage from './pages/fiscal.vue'
import { type Ref, ref } from 'vue'

export default class FiscalPlugin extends ExtensionBase {
  name = 'fiscal'
  component = FiscalPage
  menuItem: Ref<MenuItem[]> = ref([])

  routes = [
    {
      name: 'fiscal',
      path: '/fiscal/:sub?',
      component: FiscalPage,
      meta: { auth: true }
    }
  ]

  async boot(): Promise<void> {}

  async whenAuthenticated(): Promise<void> {
    this.menuItem.value = [
      {
        name: 'fiscal',
        label: 'Fiscal',
        icon: { icon: 'fa-light fa-file-invoice', type: 'fa' }
      }
    ]
  }
}
