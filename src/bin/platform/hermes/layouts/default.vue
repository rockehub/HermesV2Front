<script lang="ts" setup>

import SidebarComponent from '@/components/sidebar/sidebar.vue'
import HeaderComponent from '@/components/header/header.vue'
import type { MenuIcon, MenuItem } from '@/types/global'
import { useRoute } from 'vue-router'

const props = defineProps<{ icon: MenuIcon, menuItems: MenuItem[] }>()

console.log(props.menuItems)

const route = useRoute()
const setActive = (name: string): string => {
  const activeParam = route.params.sub ?? route.params.cockpit
  console.log(activeParam)

  const baseClass = 'flex h-11 w-11 items-center justify-center rounded-lg outline-none transition-colors duration-200'
  const activeClass = 'bg-primary/10 text-primary hover:bg-primary/20 focus:bg-primary/20 active:bg-primary/25 dark:bg-navy-600 dark:text-accent-light dark:hover:bg-navy-450 dark:focus:bg-navy-450 dark:active:bg-navy-450/90'
  const inactiveClass = 'hover:bg-primary/20 focus:bg-primary/20 active:bg-primary/25 dark:hover:bg-navy-300/20 dark:focus:bg-navy-300/20 dark:active:bg-navy-300/25'

  return `${baseClass} ${activeParam === name ? activeClass : inactiveClass}`
}
</script>

<template>
  <sidebar-component>
    <template #extendedSidebar>
      <div class="sidebar-panel-min">
        <div class="flex h-full flex-col bg-white dark:bg-navy-750">
          <div class="flex h-18 shrink-0 items-center justify-center">
            <div class="avatar flex h-10 w-10">
              <div
                class="is-initial is-initial rounded-full bg-primary/10 text-primary dark:bg-accent-light/10 dark:text-accent-light">
                <em
                  :class="{'material-icons': icon.type === 'material','text-[1.2rem]': icon.type === 'fa',[icon.icon]: icon.type === 'fa'}">
                  {{ icon.type === 'material' ? icon.icon : '' }}
                </em>
              </div>
            </div>
          </div>
          <div
            class="is-scrollbar-hidden items-center  flex grow flex-col space-y-4 overflow-y-auto pt-6"
          >
            <router-link :to="menu" v-for="menu in menuItems" :key="menu.name" :class="setActive(menu.params.sub ?? menu.params.cockpit)">
          <span
            :class="{'material-icons': menu.icon.type === 'material', 'text-[1.2rem]':menu.icon.type === 'fa', [ menu.icon.icon]:menu.icon.type === 'fa'  }"
            class="p-2"
          >{{ menu.icon.type === 'material' ? menu.icon.icon : '' }}</span>
            </router-link>
          </div>
        </div>
      </div>
    </template>
  </sidebar-component>
  <main class="main-content w-full pb-8" v-auto-animate>
    <header-component />
    <div class="grow overflow-y-auto px-[calc(var(--margin-x)-.5rem)] py-5 transition-all duration-[.25s] scrollbar-sm">
      <slot></slot>
    </div>
  </main>
</template>

<style scoped>

</style>