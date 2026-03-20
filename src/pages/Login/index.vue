<template>
  <div id="root" class="min-h-100vh flex grow bg-slate-50 dark:bg-navy-900">
    <div class="fixed top-0 hidden p-6 lg:block lg:px-12">
      <a href="#" class="flex items-center space-x-2">
        <img class="h-12 w-12" src="@/assets/images/brand/logo.png" alt="logo" />
        <p class="text-xl font-semibold uppercase text-slate-700 dark:text-navy-100">synom</p>
      </a>
    </div>
    <div class="hidden w-full place-items-center lg:grid">
      <div class="w-full max-w-lg p-6">
        <img
          class="w-full"
          v-show="!darkMode.isDarkMode"
          src="@/assets/images/illustrations/dashboard-check.svg"
          alt="image"
        />
        <img
          class="w-full"
          v-show="darkMode.isDarkMode"
          src="@/assets/images/illustrations/dashboard-check-dark.svg"
          alt="image"
        />
      </div>
    </div>
    <FormWrapperComponent />
  </div>
</template>

<script setup lang="ts">
import { useGlobalState } from '@/stores/stores'
import FormWrapperComponent from '@/components/login/FormWrapperComponent.vue'

const darkMode = useGlobalState()
const dark = darkMode
</script>
