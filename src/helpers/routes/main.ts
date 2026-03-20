import {
  createRouter,
  createWebHistory,
  type NavigationGuardNext,
  type RouteLocationRaw, type RouteRecordRaw
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
    console.log('adding this route', newRoute)
    if (newRoute && Array.isArray(newRoute)) {
      newRoute.forEach((route) => {
        if (route.name && !router.hasRoute(route.name)) {
          router.addRoute(route)
          console.info(`Added route: ${route.path}`)
        }
      })
    } else if (newRoute) {
      if (newRoute.name && !router.hasRoute(newRoute.name)) {
        router.addRoute(newRoute)
        console.info(`Added route: ${newRoute.path}`)
      }
    }
  },
  { deep: true }
)

const pluginManager = usePluginManager()

router.beforeEach(async (to, from, next) => {
  const user = useAuthStore()
  console.log(to)

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
    } else {
      console.warn('next() was called more than once')
    }
  }) as NavigationGuardNext

  if (!to.matched.length) {
    return guardedNext(to)
  }

  for (const plugin of Object.values(pluginManager.getPlugins().value)) {
    await plugin.routerBefore(to, from, guardedNext)
    if (nextCalled) return
  }

  if (to.matched.some((record) => record.meta.auth)) {
    if (!user.checkAuth()) {
      if (to.name !== 'login') {
        return guardedNext({
          name: 'login',
          query: { redirect: to.fullPath }
        })
      }
    }
  }

  if (to.meta.roles && !hasRole(to.meta.roles as string[])) {
    return guardedNext({ name: 'dashboard' })
  }

  if (to.matched.some((record) => record.meta.noAuth)) {
    if (user.checkAuth()) {
      return guardedNext({ name: 'dashboard' })
    }
  }

  return guardedNext()
})

router.afterEach(async (to, from) => {
  for (const plugin of Object.values(pluginManager.getPlugins().value)) {
    await plugin.routerAfter(to, from)
  }
})

export default router
