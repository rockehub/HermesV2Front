import { defineStore } from 'pinia'
import { type RemovableRef, useStorage } from '@vueuse/core'
import Fuse from 'fuse.js'
import { getSearchIndex } from '@/helpers/search/searchRegistry'
import type { SearchItem } from '@/types/global.d'

interface SearchState {
  searchQuery: string | RemovableRef<string>;
  searchResults: SearchItem[];
  loading: boolean;
  activeBar: string;
  searchContexts: string | RemovableRef<string>;
}


export const useSearchStore = defineStore({
  id: 'search',
  state: (): SearchState => ({
    searchQuery: useStorage('searchQuery', ''),
    searchResults: [],
    activeBar: 'messages',
    loading: false,
    searchContexts: useStorage('searchContexts', '')
  }),
  getters: {
    getSearchResults(): SearchItem[] {
      return this.searchResults
    },
    getSearchQuery(): string {
      return this.searchQuery
    },
    getSearchContexts(): string {
      return this.searchContexts
    }
  },
  actions: {
    setSearchContexts(contexts: string) {
      this.searchResults = []
      this.searchContexts = contexts
    },
    async search(query: string): Promise<void> {
      const fuse = new Fuse(getSearchIndex(), {
        keys: ['name', 'keywords'],
        threshold: 0.3
      })
      this.searchResults = fuse.search(query).map(r => r.item)
    },
    clearSearchResults() {
      this.searchResults = []
    }
  }

})
