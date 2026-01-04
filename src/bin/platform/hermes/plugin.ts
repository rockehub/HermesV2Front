import { ExtensionBase } from '@/helpers/extensionLoader/ExtensionBase'
import type { MenuItem } from '@/types/global'
import cockpitPage from './pages/cockpit.vue'
import type { Promise } from 'cypress/types/cy-bluebird'
import { $axios } from '@/helpers/integration/integration'
import { type Ref, ref } from 'vue'
import { findMenu } from '@/bin/platform/hermes/classes/MenuUtils'

export default class HermesPlugin extends ExtensionBase {
  component = cockpitPage
  menuItem: Ref<MenuItem[]> = ref([])
  name = 'Hermes'
  routes = [
    {
      name: 'cockpit',
      path: '/cockpit/:cockpit?/:sub?',
      component: cockpitPage,
      meta: { auth: true }
    }
  ]

  async boot(): Promise<void> {


  }


  async whenAuthenticated(): Promise<void> {
    findMenu().then((response) => {
      this.menuItem.value.push(response)
    })
  }
}