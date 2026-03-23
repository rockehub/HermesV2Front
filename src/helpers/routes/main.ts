import {
  createRouter,
  createWebHistory,
  type NavigationGuardNext,
  type RouteRecordRaw
} from 'vue-router'
import { routes as defaultRoutes } from '@/helpers/routes/routes'
import { pluginsLoaded, routes } from '@/helpers/extensionLoader/extension-loader'
import { useAuthStore } from '@/stores/auth'
import { usePluginManager } from '@/helpers/extensionLoader/usePluginManager'
import { hasRole } from '@/helpers/rbac/checks/hasRole'
import { watch } from 'vue'

const router = createRouter({
  history: createWebHistory(),
  routes: defaultRoutes
})

watch(
  () => routes.value,
  (newRoute: any) => {
    if (newRoute && Array.isArray(newRoute)) {
      newRoute.forEach((route) => {
        if (route.name && !router.hasRoute(route.name)) {
          router.addRoute(route as RouteRecordRaw)
        }
      })
    } else if (newRoute && newRoute.name && !router.hasRoute(newRoute.name)) {
      router.addRoute(newRoute as RouteRecordRaw)
    }
  },
  { deep: true }
)

const pluginManager = usePluginManager()

router.beforeEach(async (to, from, next) => {
  const user = useAuthStore()

  await new Promise<boolean>((resolve) => {
    const checkPluginsLoaded = setInterval(() => {
      if (pluginsLoaded.value) {
        clearInterval(checkPluginsLoaded)
        resolve(true)
      }
    }, 100)
  })

  let nextCalled = false
  const guardedNext: NavigationGuardNext = ((arg?: any) => {
    if (!nextCalled) {
      nextCalled = true
      if (arg === undefined) {
        next()
      } else {
        next(arg)
      }
    }
  }) as NavigationGuardNext

  if (!to.matched.length) {
    return guardedNext(to)
  }

  for (const plugin of Object.values(pluginManager.getPlugins().value)) {
    await plugin.routerBefore(to, from, guardedNext)
    if (nextCalled) return
  }

  if (to.matched.some((record) => record.meta.auth) && !user.checkAuth()) {
    return guardedNext({ name: 'login', query: { redirect: to.fullPath } })
  }

  if (user.checkAuth() && user.isBillingOnly && !['billing', 'onboarding', 'store-setup', 'select-tenant'].includes(String(to.name))) {
    return guardedNext({ name: 'billing' })
  }

  if (user.checkAuth() && !user.isStoreSetupComplete && !['store-setup', 'onboarding', 'billing', 'select-tenant'].includes(String(to.name))) {
    return guardedNext({ name: 'store-setup' })
  }

  if (to.meta.roles && !hasRole(to.meta.roles as string[])) {
    return guardedNext({ name: 'dashboard' })
  }

  if (to.matched.some((record) => record.meta.noAuth) && user.checkAuth()) {
    if (user.isBillingOnly) {
      return guardedNext({ name: 'billing' })
    }
    if (!user.isStoreSetupComplete) {
      return guardedNext({ name: 'store-setup' })
    }
    return guardedNext({ name: 'dashboard' })
  }

  return guardedNext()
})

router.afterEach(async (to, from) => {
  for (const plugin of Object.values(pluginManager.getPlugins().value)) {
    await plugin.routerAfter(to, from)
  }
})

export default router
