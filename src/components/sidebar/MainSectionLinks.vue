<template>
  <!-- w-full garante que o wrapper ocupa toda a largura do sidebar para o botão absolute ficar no lugar certo -->
  <div class="relative flex w-full min-h-0 grow flex-col">
    <!-- Botão expand/minimizar posicionado na borda direita do main-sidebar -->
    <button
      class="absolute -right-3 top-6 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition-colors duration-200 hover:bg-slate-50 dark:border-navy-600 dark:bg-navy-700 dark:hover:bg-navy-600"
      :title="isExpanded ? 'Minimizar menu' : 'Expandir menu'"
      @click="menuStore.toggleFormat()"
    >
      <em
        :class="isExpanded ? 'fa-solid fa-angles-left' : 'fa-solid fa-angles-right'"
        class="text-[9px] text-slate-500 dark:text-navy-200"
      ></em>
    </button>

    <!-- Lista de itens -->
    <div
      class="is-scrollbar-hidden flex grow flex-col overflow-y-auto pt-3"
      :class="isExpanded ? 'space-y-0.5 px-2' : 'items-center space-y-1'"
    >
      <template v-for="menu in menus" :key="menu.entityName ?? menu.label">
        <!-- MODO EXPANDIDO: ícone + label -->
        <template v-if="isExpanded">
          <button
            v-if="isConfigMode"
            class="group flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left outline-none transition-colors duration-200"
            :class="setActive(menu)"
            @click="openConfig(menu)"
          >
            <em
              :class="iconClass(menu)"
              :style="menu.color ? `color:${menu.color}` : ''"
              class="w-5 shrink-0 text-center"
            >
              {{ menu.icon?.type === 'material' ? menu.icon.icon : '' }}
            </em>
            <span class="flex-1 truncate text-sm font-medium">{{ menu.label }}</span>
            <em
              v-if="menu.hasChildren"
              class="fa-solid fa-chevron-right text-[9px] opacity-30"
            ></em>
            <em
              class="fa-solid fa-pen-to-square text-[9px] opacity-0 transition-opacity group-hover:opacity-40"
            ></em>
          </button>

          <router-link
            v-else
            :to="menu"
            class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 outline-none transition-colors duration-200"
            :class="setActive(menu)"
          >
            <em
              :class="iconClass(menu)"
              :style="menu.color ? `color:${menu.color}` : ''"
              class="w-5 shrink-0 text-center"
            >
              {{ menu.icon?.type === 'material' ? menu.icon.icon : '' }}
            </em>
            <span class="flex-1 truncate text-sm font-medium">{{ menu.label }}</span>
            <em
              v-if="menu.hasChildren"
              class="fa-solid fa-chevron-right text-[9px] opacity-30"
            ></em>
          </router-link>
        </template>

        <!-- MODO MINIMIZADO: só ícone (44×44) -->
        <template v-else>
          <button
            v-if="isConfigMode"
            class="group relative flex h-11 w-11 items-center justify-center rounded-lg outline-none transition-colors duration-200"
            :class="setActive(menu)"
            :title="menu.label"
            @click="openConfig(menu)"
          >
            <em
              :class="iconClass(menu)"
              :style="menu.color ? `color:${menu.color}` : ''"
              class="p-2 text-[1.2rem]"
            >
              {{ menu.icon?.type === 'material' ? menu.icon.icon : '' }}
            </em>
            <span
              v-if="menu.hasChildren"
              class="absolute bottom-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-navy-400"
            ></span>
            <em
              class="fa-solid fa-pen-to-square absolute -right-1 -top-1 hidden h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[8px] text-white group-hover:flex"
            ></em>
          </button>

          <router-link
            v-else
            :to="menu"
            class="relative flex h-11 w-11 items-center justify-center rounded-lg outline-none transition-colors duration-200"
            :class="setActive(menu)"
            :title="menu.label"
          >
            <em
              :class="iconClass(menu)"
              :style="menu.color ? `color:${menu.color}` : ''"
              class="text-[1.2rem]"
            >
              {{ menu.icon?.type === 'material' ? menu.icon.icon : '' }}
            </em>
            <span
              v-if="menu.hasChildren"
              class="absolute bottom-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-navy-400"
            ></span>
          </router-link>
        </template>
      </template>
    </div>
  </div>

  <MenuConfigPopup :show="!!configTarget" :item="configTarget" @close="configTarget = null" />
</template>

<script lang="ts" setup>
import { useRoute, useRouter } from 'vue-router'
import { usePluginManager } from '@/helpers/extensionLoader/usePluginManager'
import { computed, isRef, ref, unref } from 'vue'
import { useMenuStore } from '@/stores/menuStore'
import MenuConfigPopup from '@/bin/platform/hermes/components/menu/MenuConfigPopup.vue'

const { pluginMenuItems } = usePluginManager()
const menuStore = useMenuStore()
const isConfigMode = computed(() => menuStore.isConfigMode)
const isExpanded = computed(() => menuStore.sidebarFormat === 'expanded')
const configTarget = ref<any>(null)

const rawMenus = computed(() => {
  const result: any[] = []
  const helper = (arr: any[]) => {
    for (const item of arr) {
      const value = isRef(item) ? unref(item) : item
      if (Array.isArray(value)) helper(value)
      else result.push(value)
    }
  }
  helper(unref(pluginMenuItems))
  return result
})

const menus = computed(() =>
  rawMenus.value.map((menu) => {
    if (menu.entityName) return menu
    const override = menuStore.getLocalOverride({ name: menu.name, label: menu.label })
    return override
      ? {
          ...menu,
          label: override.displayName ?? menu.label,
          icon: override.icon ?? menu.icon,
          color: override.color ?? menu.color
        }
      : menu
  })
)

const route = useRoute()
const router = useRouter()

// Monta as classes do ícone — usa objeto para que Vue aplique cada classe separada
const iconClass = (menu: any) => {
  const classes: Record<string, boolean> = {}
  if (menu.icon?.type === 'material') classes['material-icons'] = true
  if (menu.icon?.type === 'fa') {
    // icon string pode conter múltiplas classes ("fa-light fa-home") — aplica cada uma
    const parts = (menu.icon.icon as string).split(' ')
    for (const p of parts) if (p) classes[p] = true
  }
  return classes
}

const activeClass =
  'bg-primary/10 text-primary hover:bg-primary/20 dark:bg-navy-600 dark:text-accent-light dark:hover:bg-navy-450'
const inactiveClass = 'hover:bg-primary/20 dark:hover:bg-navy-300/20'

function setActive(menu: any): string {
  try {
    const resolved = router.resolve(menu)
    const isActive =
      route.fullPath === resolved.fullPath || route.fullPath.startsWith(resolved.fullPath + '/')
    return isActive ? activeClass : inactiveClass
  } catch {
    return inactiveClass
  }
}

function openConfig(menu: any) {
  configTarget.value = {
    entityName: menu.entityName ?? undefined,
    routeName: menu.entityName ? undefined : menu.name,
    displayName: menu.label,
    icon: menu.icon,
    color: menu.color
  }
}
</script>
