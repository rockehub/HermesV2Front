<template>
  <Popper
    placement="bottom-end"
    offsetDistance="4"
    class="inline-flex"
    @open:popper="toggleDropdown"
    @close:popper="closeDropDown"
  >
    <button
      class="btn space-x-2 rounded-full bg-slate-150 font-medium text-slate-800 hover:bg-slate-200 focus:bg-slate-200 active:bg-slate-200/80 dark:bg-navy-500 dark:text-navy-50 dark:hover:bg-navy-450 dark:focus:bg-navy-450 dark:active:bg-navy-450/90"
    >
      <span>{{
        $t('search.context.' + searchStore.getSearchContexts) ?? $t('search.searchContexts')
      }}</span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-4 w-4 transition-transform duration-200"
        :class="isDropdownVisible && 'rotate-180'"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </button>
    <template #content>
      <div
        class="rounded-md border border-slate-150 bg-white py-1.5 font-inter dark:border-navy-500 dark:bg-navy-700"
      >
        <ul>
          <li v-for="context in loadedContexts" :key="context.label">
            <a
              @click="selectContext(context.value)"
              href="#"
              class="flex items-center px-3 h-8 pr-12 font-medium tracking-wide outline-none transition-all hover:bg-slate-100 hover:text-slate-800 focus:bg-slate-100 focus:text-slate-800 dark:hover:bg-navy-600 dark:hover:text-navy-100 dark:focus:bg-navy-600 dark:focus:text-navy-100"
              >{{ $t('search.context.' + context.label) }}</a
            >
          </li>
        </ul>
      </div>
    </template>
  </Popper>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Popper from 'vue3-popper'
import { searchContexts } from '@/helpers/extensionLoader/extension-loader'
import type { SearchContextItem } from '@/types/global.d'
import { useSearchStore } from '@/stores/stores'

const loadedContexts: SearchContextItem[] = searchContexts
const searchStore = useSearchStore()

if (searchStore.getSearchContexts.length === 0) {
  // searchStore.setSearchContexts(loadedContexts[0].value)
}

const isDropdownVisible = ref(false)

const selectContext = (context: string) => {
  searchStore.setSearchContexts(context)
  closeDropDown()
}

const toggleDropdown = () => {
  isDropdownVisible.value = !isDropdownVisible.value
}

const closeDropDown = () => {
  isDropdownVisible.value = false
}
</script>

<style>
.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: opacity 0.1s;
}

.dropdown-fade-enter, .dropdown-fade-leave-to /* .dropdown-fade-leave-active in <2.1.8 */ {
  opacity: 0;
}
</style>
