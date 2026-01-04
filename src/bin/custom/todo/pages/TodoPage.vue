<script lang="ts">
import {defineComponent} from 'vue'
import SidebarComponent from "@/components/sidebar/sidebar.vue";

export default defineComponent({
  name: "TodoPage",
  components: {SidebarComponent}
})
</script>

<template>
  <sidebar-component :has-extended-sidebar="true" >
    <template #extendedSidebar>
      <div class="sidebar-panel-min">
        <div class="flex h-full flex-col bg-white dark:bg-navy-750">
          <div class="flex h-18 shrink-0 items-center justify-center">
            <div class="avatar flex h-10 w-10">
              <div
                  class="is-initial is-initial rounded-full bg-primary/10 text-primary dark:bg-accent-light/10 dark:text-accent-light"
              >
                <svg
                    class="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                    stroke-width="2"
                >
                  <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </sidebar-component>
  <main class="main-content h-100vh chat-app mt-0 flex w-full flex-col">
    <div
        :class="{'scrollbar-sm': $breakpoints.smAndUp}"
        class="grow overflow-y-auto px-[calc(var(--margin-x)-.5rem)] py-5 transition-all duration-[.25s]">
      <div> todo app</div>
    </div>
  </main>
</template>

<style scoped>

</style>