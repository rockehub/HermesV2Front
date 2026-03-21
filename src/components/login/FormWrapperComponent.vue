<template>
  <main class="flex w-full flex-col items-center bg-white dark:bg-navy-700 lg:max-w-md">
    <div class="flex w-full max-w-sm grow flex-col justify-center p-5">
      <div class="text-center">
        <img class="mx-auto  w-48 lg:hidden" src="@/assets/images/brand/logo.png" alt="logo" />
        <div class="mt-4">
          <h2 class="text-2xl font-semibold text-slate-600 dark:text-navy-100">
            {{ $t('login.welcome') }}
          </h2>
          <p class="text-slate-400 dark:text-navy-300">
            {{ $t('login.subtitle') }}
          </p>
        </div>
      </div>
      <router-view name="form" />
    </div>
    <div class="my-5 flex justify-center text-xs text-slate-400 dark:text-navy-300">
      <a href="#">Privacy Notice</a>
      <div class="mx-3 my-1 w-px bg-slate-200 dark:bg-navy-500"></div>
      <a href="#">Term of service</a>

      <button @click="darkMode.toggleDarkMode()">darkmode</button>

      <button @click="darkMode.toggleMonochrome()">monochrome</button>
    </div>
  </main>
</template>

<script setup lang="ts">
import { useGlobalState } from '@/stores/stores'

const darkMode = useGlobalState()
</script>

<style scoped></style>