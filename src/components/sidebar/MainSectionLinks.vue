<template>
  <div
    class="is-scrollbar-hidden flex grow flex-col space-y-4 overflow-y-auto pt-6"
  >

    <router-link :to="menu" v-for="menu in menus" :key="menu.name" :class="setActive(menu.name)">
          <span
            :class="{'material-icons': menu.icon.type === 'material', 'text-[1.2rem]':menu.icon.type === 'fa', [ menu.icon.icon]:menu.icon.type === 'fa'  }"
            class="p-2"
          >{{ menu.icon.type === 'material' ? menu.icon.icon : '' }}</span>
    </router-link>

  </div>
</template>
<script lang="ts" setup>
import { useRoute } from 'vue-router'
import { usePluginManager } from '@/helpers/extensionLoader/usePluginManager'
import { computed, isRef, unref } from 'vue'

const { pluginMenuItems } = usePluginManager()

const menus = computed(() => {
  const flatten = (input: any[]): any[] => {
    const result: any[] = []

    const helper = (arr: any[]) => {
      for (const item of arr) {
        const value = isRef(item) ? unref(item) : item
        if (Array.isArray(value)) {
          helper(value)
        } else {
          result.push(value)
        }
      }
    }

    helper(input)
    return result
  }
  let data = flatten(unref(pluginMenuItems))
  console.log('last parse from data', data)
  return data
})

const route = useRoute()
const setActive = (name: string): string => {
  if (route.name === name) {
    return 'flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary outline-none transition-colors duration-200 hover:bg-primary/20 focus:bg-primary/20 active:bg-primary/25 dark:bg-navy-600 dark:text-accent-light dark:hover:bg-navy-450 dark:focus:bg-navy-450 dark:active:bg-navy-450/90'
  } else {
    return 'flex h-11 w-11 items-center justify-center rounded-lg outline-none transition-colors duration-200 hover:bg-primary/20 focus:bg-primary/20 active:bg-primary/25 dark:hover:bg-navy-300/20 dark:focus:bg-navy-300/20 dark:active:bg-navy-300/25'
  }
}
</script>