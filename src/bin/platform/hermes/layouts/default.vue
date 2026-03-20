<script lang="ts" setup>
import SidebarComponent from '@/components/sidebar/sidebar.vue'
import HeaderComponent from '@/components/header/header.vue'
import MenuConfigPopup from '@/bin/platform/hermes/components/menu/MenuConfigPopup.vue'
import type { MenuIcon } from '@/types/global.d'
import type { HermesMenuItem } from '@/bin/platform/hermes/classes/MenuUtils'
import { useRoute, useRouter } from 'vue-router'
import { computed, onMounted, ref, watch } from 'vue'
import { useMenuStore } from '@/stores/menuStore'
import type { RouteLocationRaw } from 'vue-router'

const props = defineProps<{
  icon: MenuIcon
  menuItems: HermesMenuItem[]
  back?: RouteLocationRaw | null
  sectionLabel?: string | null
}>()

const route = useRoute()
const router = useRouter()
const menuStore = useMenuStore()

const isConfigMode = computed(() => menuStore.isConfigMode)
const isExpanded = computed(() => menuStore.sidebarFormat === 'expanded')

const configTarget = ref<any>(null)

const setActive = (name: string): string => {
  const activeParam = route.params.sub ?? route.params.cockpit
  const base = 'outline-none transition-colors duration-200'
  const active =
    'bg-primary/10 text-primary hover:bg-primary/20 dark:bg-navy-600 dark:text-accent-light dark:hover:bg-navy-450'
  const inactive = 'hover:bg-primary/20 dark:hover:bg-navy-300/20'
  return `${base} ${activeParam === name ? active : inactive}`
}

function openConfig(menu: HermesMenuItem) {
  // Sub-itens do Hermes são sempre backend
  configTarget.value = {
    entityName: menu.entityName,
    displayName: menu.label,
    icon: menu.icon,
    color: menu.color
  }
}

watch(
  () => props.menuItems,
  (val, oldVal) => {
    console.log('menuitem', val)
    if (val.length <= 0) {
      document.body.classList.remove('has-min-sidebar', 'is-header-blur')
    } else {
      document.body.classList.add('has-min-sidebar', 'is-header-blur')
    }
  }
)

onMounted(() => {
  if (props.menuItems.length == 0) {
    document.body.classList.remove('has-min-sidebar', 'is-header-blur')
  }
})
</script>

<template>
  <sidebar-component>
    <template #extendedSidebar>
      <div class="sidebar-panel-min" v-if="menuItems.length > 0">
        <div class="relative flex h-full flex-col bg-white dark:bg-navy-750">
          <!-- Botão flutuante expand/minimize -->

          <!-- Cabeçalho do painel: breadcrumb com voltar OU ícone simples -->
          <div
            class="flex h-18 shrink-0 items-center border-b border-slate-100 dark:border-navy-700"
            :class="back ? 'px-2 gap-1.5' : 'justify-center'"
          >
            <!-- Com retorno: back button + breadcrumb -->
            <template v-if="back">
              <button
                class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:text-navy-400 dark:hover:bg-navy-700 dark:hover:text-navy-100 transition-colors"
                title="Voltar"
                @click="router.push(back)"
              >
                <em class="fa-solid fa-arrow-left text-xs"></em>
              </button>
              <div v-if="isExpanded" class="min-w-0 flex-1">
                <p class="text-[10px] leading-none text-slate-400 dark:text-navy-400 mb-0.5 truncate">Commerce</p>
                <p class="text-sm font-semibold text-slate-700 dark:text-navy-100 truncate">{{ sectionLabel }}</p>
              </div>
            </template>

            <!-- Sem retorno: ícone centralizado -->
            <template v-else>
              <div class="avatar flex h-10 w-10">
                <div
                  class="is-initial rounded-full bg-primary/10 text-primary dark:bg-accent-light/10 dark:text-accent-light"
                >
                  <em
                    :class="{
                      'material-icons': icon.type === 'material',
                      'text-[1.2rem]': icon.type === 'fa',
                      [icon.icon]: icon.type === 'fa'
                    }"
                  >
                    {{ icon.type === 'material' ? icon.icon : '' }}
                  </em>
                </div>
              </div>
            </template>
          </div>

          <!-- Lista de sub-itens -->
          <div
            class="is-scrollbar-hidden flex grow overflow-y-auto pt-4"
            :class="
              isExpanded
                ? 'flex-col space-y-1 px-2 items-stretch'
                : 'flex-col items-center space-y-3'
            "
          >
            <template v-for="menu in menuItems" :key="menu.entityName">
              <!-- Expandido: ícone + label -->
              <template v-if="isExpanded">
                <button
                  v-if="isConfigMode"
                  class="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left"
                  :class="setActive(menu.params?.sub ?? menu.params?.cockpit)"
                  @click="openConfig(menu)"
                >
                  <span
                    :class="{
                      'material-icons': menu.icon?.type === 'material',
                      'text-[1.1rem]': menu.icon?.type === 'fa',
                      [menu.icon?.icon]: menu.icon?.type === 'fa'
                    }"
                    :style="menu.color ? `color: ${menu.color}` : ''"
                    class="shrink-0"
                    >{{ menu.icon?.type === 'material' ? menu.icon.icon : '' }}</span
                  >
                  <span class="flex-1 truncate text-xs font-medium">{{ menu.label }}</span>
                  <em v-if="menu.hasChildren" class="fa-solid fa-chevron-right text-[9px] opacity-30 shrink-0"></em>
                  <em
                    v-else
                    class="fa-solid fa-pen-to-square shrink-0 text-[10px] opacity-0 group-hover:opacity-60 transition-opacity"
                  ></em>
                </button>

                <router-link
                  v-else
                  :to="menu"
                  class="flex w-full items-center gap-3 rounded-lg px-3 py-2"
                  :class="setActive(menu.params?.sub ?? menu.params?.cockpit)"
                >
                  <span
                    :class="{
                      'material-icons': menu.icon?.type === 'material',
                      'text-[1.1rem]': menu.icon?.type === 'fa',
                      [menu.icon?.icon]: menu.icon?.type === 'fa'
                    }"
                    :style="menu.color ? `color: ${menu.color}` : ''"
                    class="shrink-0"
                    >{{ menu.icon?.type === 'material' ? menu.icon.icon : '' }}</span
                  >
                  <span class="flex-1 truncate text-xs font-medium">{{ menu.label }}</span>
                  <em v-if="menu.hasChildren" class="fa-solid fa-chevron-right text-[9px] opacity-30 shrink-0"></em>
                </router-link>
              </template>

              <!-- Minimizado: só ícone -->
              <template v-else>
                <button
                  v-if="isConfigMode"
                  class="group relative flex h-11 w-11 items-center justify-center rounded-lg"
                  :class="setActive(menu.params?.sub ?? menu.params?.cockpit)"
                  :title="menu.label"
                  @click="openConfig(menu)"
                >
                  <span
                    :class="{
                      'material-icons': menu.icon?.type === 'material',
                      'text-[1.2rem]': menu.icon?.type === 'fa',
                      [menu.icon?.icon]: menu.icon?.type === 'fa'
                    }"
                    :style="menu.color ? `color: ${menu.color}` : ''"
                    class="p-2"
                    >{{ menu.icon?.type === 'material' ? menu.icon.icon : '' }}</span
                  >
                  <em
                    class="fa-solid fa-pen-to-square absolute -right-1 -top-1 text-[9px] bg-primary text-white rounded-full w-3.5 h-3.5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  ></em>
                </button>

                <router-link
                  v-else
                  :to="menu"
                  class="relative flex h-11 w-11 items-center justify-center rounded-lg"
                  :class="setActive(menu.params?.sub ?? menu.params?.cockpit)"
                  :title="menu.label"
                >
                  <span
                    :class="{
                      'material-icons': menu.icon?.type === 'material',
                      'text-[1.2rem]': menu.icon?.type === 'fa',
                      [menu.icon?.icon]: menu.icon?.type === 'fa'
                    }"
                    :style="menu.color ? `color: ${menu.color}` : ''"
                    class="p-2"
                    >{{ menu.icon?.type === 'material' ? menu.icon.icon : '' }}</span
                  >
                  <span
                    v-if="menu.hasChildren"
                    class="absolute bottom-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-navy-400"
                  ></span>
                </router-link>
              </template>
            </template>
          </div>
        </div>
      </div>
    </template>
  </sidebar-component>

  <main class="main-content w-full pb-8" v-auto-animate>
    <header-component />
    <div
      class="grow overflow-y-auto px-[calc(var(--margin-x)-.5rem)] py-5 transition-all duration-[.25s] scrollbar-sm"
    >
      <slot></slot>
    </div>
  </main>

  <MenuConfigPopup :show="!!configTarget" :item="configTarget" @close="configTarget = null" />
</template>

