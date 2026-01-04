<template>
  <div class="sidebar print:hidden">
    <div class="main-sidebar">
      <div
        class="flex h-full w-full flex-col items-center border-r border-slate-150 bg-white dark:border-navy-700 dark:bg-navy-800">
        <!-- Application Logo -->
        <ApplicationLogo/>

        <!-- Main Sections Links -->
        <MainSectionLinks/>

        <!-- Bottom Links -->
        <BottomLinks/>
      </div>
    </div>

    <slot name="extendedSidebar"></slot>
  </div>

  <RightSideBar/>
</template>

<script lang="ts" setup>
import { onMounted, onBeforeUnmount, useSlots } from 'vue'
import ApplicationLogo from "@/components/sidebar/ApplicationLogo.vue"
import MainSectionLinks from "@/components/sidebar/MainSectionLinks.vue"
import BottomLinks from "@/components/sidebar/BottomLinks.vue"
import RightSideBar from "@/components/sidebar/RightSideBar.vue"

const slots = useSlots()

onMounted(() => {
  const hasExtendedSidebar = !!slots.extendedSidebar

  if (hasExtendedSidebar) {
    document.body.classList.add('has-min-sidebar', 'is-header-blur')
  }
})

onBeforeUnmount(() => {
  document.body.classList.remove('has-min-sidebar', 'is-header-blur')
})
</script>
