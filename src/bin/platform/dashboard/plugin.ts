import { ExtensionBase } from '@/helpers/extensionLoader/ExtensionBase'
import DashBoardPage from './pages/index.vue'
import { type App, type Ref, ref } from 'vue'
import { Divisor } from '@/bin/platform/dashboard/components/divisorWidget/Divisor'
import { WidgetAreaWidget } from '@/bin/platform/dashboard/components/widgetAreaWidget/WidgetAreaWidget'
import { WelcomeWidget } from '@/bin/platform/dashboard/components/welcomeWidget/WelcomeWidget'
import { pt } from '@/bin/platform/dashboard/lang/pt/lang'
import type { MenuItem } from '@/types/global.d'
import { DynamicChartWidget } from '@/bin/platform/dashboard/components/dynamicChartWidget/DynamicChartWidget'

export default class DashboardPlugin extends ExtensionBase {
  name = 'dashboard'
  component = DashBoardPage
  globalWidgets = [
    Divisor,
    WidgetAreaWidget,
    WelcomeWidget,
    DynamicChartWidget
  ]
  routes = [
    {
      name: 'dashboard',
      path: '/',
      component: DashBoardPage,
      meta: { auth: true }
    }
  ]
  languages = {
    pt: pt
  }
  menuItem: Ref<MenuItem[]> = ref([{
    name: 'dashboard',
    icon: {
      icon: 'dashboard',
      type: 'material'
    },
    label: 'Dashboard'
  }])

  async boot(): Promise<void> {
    console.info('dashboard plugin booted')
  }

  async register(app: App): Promise<void> {
    console.info('dashboard plugin registered')
  }
}
