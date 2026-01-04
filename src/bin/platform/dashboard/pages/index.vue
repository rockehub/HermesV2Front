<script lang="ts" setup>
import SidebarComponent from "@/components/sidebar/sidebar.vue";
import HeaderComponent from "@/components/header/header.vue";
import WidgetArea from "@/components/globalWidgets/WidgetArea.vue";
import {vAutoAnimate} from '@formkit/auto-animate'

</script>

<template>
  <sidebar-component/>
  <main class="main-content w-full pb-8" v-auto-animate>
    <header-component/>
    <WidgetArea :initial-widgets="[]" name="dashboard" :size="12"/>
  </main>

  <div class="col-span-1"></div>
  <div class="col-span-2"></div>
  <div class="col-span-3"></div>
  <div class="col-span-4"></div>
  <div class="col-span-5"></div>
  <div class="col-span-6"></div>
  <div class="col-span-7"></div>
  <div class="col-span-8"></div>
  <div class="col-span-9"></div>
  <div class="col-span-10"></div>
  <div class="col-span-11"></div>
  <div class="col-span-12"></div>
</template>

<style scoped>

</style>