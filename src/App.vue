<template>
  <div
      id="root"
      class="min-h-100vh flex grow bg-slate-50 dark:bg-navy-900"
      v-cloak
  >
    <preloader v-if="!componentsReady || !globalState.isReady"></preloader>
    <router-view/>
  </div>
</template>

<script lang="ts">
import {useGlobalState, useAuthStore} from "@/stores/stores";
import Preloader from "@/components/generic/Preloader.vue";
import {defineComponent} from "vue";


export default defineComponent({
  name: 'App',
  components: { Preloader},
  setup: () => ({globalState: useGlobalState(), auth: useAuthStore()}),
  data() {
    return {
      componentsReady: false
    }
  },
  watch: {
    globalState: {
      handler() {
        this.componentsReady = !!this.globalState.isReady;
      },
      immediate: true,
      deep: true
    },
    'globalState.isDarkMode': function() {
      this.updateTheme();
    },
    'globalState.isMonoChrome': function() {
      this.updateMonoChrome();
    }
  },
  methods: {
    updateTheme() {
      if (this.globalState.isDarkMode) {
        document.documentElement.classList.add('dark');
        document.body.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.body.setAttribute('data-theme', 'light');
      }
    },

    updateMonoChrome() {
      if (this.globalState.isMonoChrome) {
        document.body.classList.add('is-monochrome');
      } else {
        document.body.classList.remove('is-monochrome');
      }
    },
  },
  mounted() {
    this.$nextTick(() => {
      this.componentsReady = true
    });
    this.updateTheme();
    this.updateMonoChrome();
  }

})
</script>

<style>

</style>
