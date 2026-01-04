import { type App, type Ref } from 'vue'
import { type MenuItem } from '@/types/global.d'
import type { RouteLocationNormalized } from 'vue-router'

export abstract class ExtensionBase {
  async boot(): Promise<void> {

  }

  async register(app: App): Promise<void> {

  }

  async routerBefore(to: RouteLocationNormalized, from, next) {

  }

  async routerAfter(to, from) {

  }

  async whenAuthenticated() {

  }

  async whenUnauthenticated() {

  }


  abstract name: string
  abstract routes: any
  abstract menuItem: Ref<MenuItem[]>
  abstract component: any
  description: string = 'extension base description'
  globalComponents: any[] = []
  globalWidgets: any[] = []
  languages = {}
}