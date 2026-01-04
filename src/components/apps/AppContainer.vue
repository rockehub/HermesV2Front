<template>
  <div class="is-scrollbar-hidden mt-3 flex space-x-4 overflow-x-auto px-3">
    <router-link :to="app" class="w-14 text-center" v-for="app in appList" :key="app.name">
      <div class="avatar h-12 w-12">
        <div class="is-initial rounded-full bg-success text-white">
          <span class="material-icons">{{app.icon}}</span>
        </div>
      </div>
      <p
          class="mt-1.5 overflow-hidden text-ellipsis whitespace-nowrap text-xs text-slate-700 dark:text-navy-100"
      >
        {{app.label}}
      </p>
    </router-link>
  </div>
</template>
<script lang="ts">
import {useSearchStore} from "@/stores/search";
import {defineComponent} from "vue";
import {MenuItem} from "@/types/global";

export default defineComponent({
  name: 'AppContainer',
  setup() {
    const searchStore = useSearchStore()
    return {

      searchStore
    }
  },
  data(){
    return {
      appList: this.$menu.slice(0, 5)
    }
  },
  watch: {
    "searchStore.searchQuery": function (val) {
      let plugins  = this.$menu
      this.appList = plugins.filter((plugin: MenuItem) => {
        return plugin.name.toLowerCase().includes(val.toLowerCase())
      })
    }
  }
})
</script>