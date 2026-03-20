<template>
  <div
      v-show="$breakpoints.isXs && globalState.isSearchbarActive"
      class="fixed inset-0 z-[100] flex flex-col bg-white dark:bg-navy-700 h-100vh sm:hidden"
  >
    <div
        class="flex items-center space-x-2 bg-slate-100 px-3 pt-2 dark:bg-navy-800"
    >
      <button
          class="btn -ml-1.5 h-7 w-7 shrink-0 rounded-full p-0 text-slate-600 hover:bg-slate-300/20 active:bg-slate-300/25 dark:text-navy-100 dark:hover:bg-navy-300/20 dark:active:bg-navy-300/25"
          @click="globalState.closeSearchBar()"
      >
        <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            fill="none"
            stroke-width="1.5"
            viewBox="0 0 24 24"
            stroke="currentColor"
        >
          <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>
      <input
          class="form-input h-8 w-full bg-transparent placeholder-slate-400 dark:placeholder-navy-300"
          type="text"
          ref="search"
          :placeholder="$t('search.input')"
          v-bind:value="searchState.searchQuery"
          @input="onInput"
      />
    </div>

    <div
        class="is-scrollbar-hidden flex shrink-0 overflow-x-auto bg-slate-100 px-2 text-slate-600 dark:bg-navy-800 dark:text-navy-200"
    >
      <button
          @click="searchState.activeBar = 'contacts'"
          :class="searchState.activeBar === 'contacts' ? 'border-primary dark:border-accent text-primary dark:text-accent-light' : 'border-transparent hover:text-slate-800 focus:text-slate-800 dark:hover:text-navy-100 dark:focus:text-navy-100'"
          class="btn shrink-0 rounded-none border-b-2 px-3.5 py-2.5"
      >
        {{ $t('search.contacts') }}
      </button>
      <button
          @click="searchState.activeBar = 'messages'"
          :class="searchState.activeBar === 'messages' ? 'border-primary dark:border-accent text-primary dark:text-accent-light' : 'border-transparent hover:text-slate-800 focus:text-slate-800 dark:hover:text-navy-100 dark:focus:text-navy-100'"
          class="btn shrink-0 rounded-none border-b-2 px-3.5 py-2.5"
      >
        {{ $t('search.messages') }}
      </button>
    </div>

    <div
        class="is-scrollbar-hidden overflow-y-auto overscroll-contain pb-2"
    >
      <AppContainer/>

      <div
          class="mt-3 flex items-center justify-between bg-slate-100 py-1.5 px-3 dark:bg-navy-800"
      >
        <p class="text-xs uppercase">{{$t('search.results')}}</p>
      </div>

      <div class="mt-1 font-inter font-medium">
        <a  v-for="(item, index) in searchState.getSearchResults" :key="`${item.name}-${index}`"
            class="group flex items-center space-x-2 px-2.5 py-2 tracking-wide outline-none transition-all hover:bg-slate-100 hover:text-slate-800 focus:bg-slate-100 focus:text-slate-800 dark:hover:bg-navy-600 dark:hover:text-navy-100 dark:focus:bg-navy-600 dark:focus:text-navy-100"
        >
          <UserAvatar :size="10" />
          <span>{{ item.name }}</span>
          <strong v-if="item.description">{{ item.description }}</strong>
        </a >
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import {useGlobalState} from "@/stores/global";
import {defineComponent} from "vue";
import {useSearchStore} from "@/stores/stores";
import UserAvatar from "@/components/generic/UserAvatar.vue";
import AppContainer from "@/components/apps/AppContainer.vue";

export default defineComponent({
  name: 'SearchBarMobile',
  setup: () => {
    const globalState = useGlobalState()
    const searchState = useSearchStore()
    const onInput = (event: Event) => {
      const target = event.target as HTMLInputElement | null
      searchState.search(target?.value ?? '')
    }

    return { globalState, searchState, onInput }
  },
  components: {AppContainer, UserAvatar},
  updated() {
    let input: HTMLInputElement = this.$refs.search as HTMLInputElement;
    input.focus();
  },
})
</script>
