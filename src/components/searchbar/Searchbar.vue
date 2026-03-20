<template>
  <Popper placement="bottom" offsetDistance="12" v-click-outside-element="closePopper"
          arrow :show="globalState.isSearchbarActive"
          class="flex"
  >
    <div class="relative mr-4 flex h-8">
      <slot>
        <input
          :placeholder="$t('search.input')"
          class="form-input peer h-full rounded-full bg-slate-150 px-4 pl-9 text-xs+ text-slate-800 ring-primary/50 hover:bg-slate-200 focus:ring dark:bg-navy-900/90 dark:text-navy-100 dark:placeholder-navy-300 dark:ring-accent/50 dark:hover:bg-navy-900 dark:focus:bg-navy-900"
          :class="globalState.isSearchbarActive ? 'w-80' : 'w-60'"
          type="text"
          v-model="searchState.searchQuery"
          :disabled="searchState.loading"
          v-on:keyup.enter="search"
        />

        <div role="status " v-if="searchState.loading" class="mx-2">
          <svg aria-hidden="true" class="w-8 h-8 mr-2 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
               viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
              fill="currentColor" />
            <path
              d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
              fill="currentFill" />
          </svg>
          <span class="sr-only">Loading...</span>
        </div>
        <div
          class="pointer-events-none absolute flex h-full w-10 items-center justify-center text-slate-400 peer-focus:text-primary dark:text-navy-300 dark:peer-focus:text-accent"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4.5 w-4.5 transition-colors duration-200"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M3.316 13.781l.73-.171-.73.171zm0-5.457l.73.171-.73-.171zm15.473 0l.73-.171-.73.171zm0 5.457l.73.171-.73-.171zm-5.008 5.008l-.171-.73.171.73zm-5.457 0l-.171.73.171-.73zm0-15.473l-.171-.73.171.73zm5.457 0l.171-.73-.171.73zM20.47 21.53a.75.75 0 101.06-1.06l-1.06 1.06zM4.046 13.61a11.198 11.198 0 010-5.115l-1.46-.342a12.698 12.698 0 000 5.8l1.46-.343zm14.013-5.115a11.196 11.196 0 010 5.115l1.46.342a12.698 12.698 0 000-5.8l-1.46.343zm-4.45 9.564a11.196 11.196 0 01-5.114 0l-.342 1.46c1.907.448 3.892.448 5.8 0l-.343-1.46zM8.496 4.046a11.198 11.198 0 015.115 0l.342-1.46a12.698 12.698 0 00-5.8 0l.343 1.46zm0 14.013a5.97 5.97 0 01-4.45-4.45l-1.46.343a7.47 7.47 0 005.568 5.568l.342-1.46zm5.457 1.46a7.47 7.47 0 005.568-5.567l-1.46-.342a5.97 5.97 0 01-4.45 4.45l.342 1.46zM13.61 4.046a5.97 5.97 0 014.45 4.45l1.46-.343a7.47 7.47 0 00-5.568-5.567l-.342 1.46zm-5.457-1.46a7.47 7.47 0 00-5.567 5.567l1.46.342a5.97 5.97 0 014.45-4.45l-.343-1.46zm8.652 15.28l3.665 3.664 1.06-1.06-3.665-3.665-1.06 1.06z"
            />
          </svg>
        </div>
      </slot>

    </div>
    <template #content>
      <div
        class="popper-box flex max-h-[calc(100vh-3rem)] w-100 flex-col rounded-lg border border-slate-150 bg-white shadow-soft dark:border-navy-800 dark:bg-navy-700 dark:shadow-soft-dark">
        <div class="is-scrollbar-hidden overflow-y-auto overscroll-contain pb-2">
          <div class="mt-3 flex items-center justify-between bg-slate-100 py-1.5 px-3 dark:bg-navy-800">
            <p class="text-xs uppercase">{{ $t('search.results') }}</p>
          </div>
          <div class="mt-1 font-inter font-medium min-w-[400px]  max-h-[400px]">
            <div v-for="item in searchState.getSearchResults" :key="item.name">
              <div
                class="cursor-pointer group flex items-center space-x-2 px-2.5 py-2 tracking-wide outline-hidden transition-all hover:bg-slate-100 hover:text-slate-800 focus:bg-slate-100 focus:text-slate-800 dark:hover:bg-navy-600 dark:hover:text-navy-100 dark:focus:bg-navy-600 dark:focus:text-navy-100"
                @click="onaAction(item.action)"
              >
                <em v-if="item.icon"
                  :class="{'material-icons': item.icon.type === 'material','text-[1.2rem]': item.icon.type === 'fa',[item.icon.icon]: item.icon.type === 'fa'}"
                  class="p-2"
                >
                  {{ item.icon.type === 'material' ? item.icon.icon : '' }}
                </em>

                <!-- Coloca o texto em coluna -->
                <div class="flex flex-col">
                  <span>{{ item.name }}</span>
                  <small class="text-xs text-gray-500 dark:text-gray-400" v-if="item.description">{{ item.description
                    }}</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </Popper>
</template>
<script lang="ts" setup>
import Popper from 'vue3-popper'
import { watch } from 'vue'
import { useGlobalState } from '@/stores/global'
import { useSearchStore } from '@/stores/stores'

const globalState = useGlobalState()
const searchState = useSearchStore()


const closePopper = () => {
  globalState.closeSearchBar()
}
const search = () => {
  searchState.search(searchState.searchQuery).then(() => {
    if (searchState.searchResults.length > 0) {
      globalState.openSearchBar()
    }

  })
}

const onaAction = (action: () => void) => {
  searchState.searchQuery = ''
  action()
}

watch(() => searchState.searchQuery, (value) => {
  if (value.length == 0) {
    closePopper()
    return
  }
  searchState.search(value).then(() => {
    if (searchState.searchResults.length > 0) {
      globalState.openSearchBar()
    }

  })
})


</script>

