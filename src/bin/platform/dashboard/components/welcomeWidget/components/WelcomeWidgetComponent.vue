<script setup lang="ts">

import {useAuthStore} from "@/stores/stores";

const auth = useAuthStore()
</script>

<template>
  <div
      :class="{'via-purple-300': $breakpoints.smAndUp}"
      class="card mt-12 bg-gradient-to-l from-pink-300 to-indigo-400 p-5 sm:mt-0 sm:flex-row"
  >
    <div class="flex justify-center sm:order-last">
      <img
          class="-mt-16 h-40 sm:mt-0"
          src="@/assets/images/illustrations/teacher.svg"
          alt=""
      />
    </div>
    <div
        class="mt-2 flex-1 pt-2 text-center text-white sm:mt-0 sm:text-left"
    >
      <h3 class="text-xl">
        {{ $t('welcome_widget.welcomeBack', { name: auth.user?.name ?? '' }) }}
      </h3>
    </div>
  </div>
</template>

<style scoped>

</style>
