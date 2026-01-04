<template>
  <div class="flex pt-4">
    <a href="/public">
      <img
          class="h-11 w-11 transition-transform duration-500 ease-in-out hover:rotate-[360deg]"
          src="@/assets/images/brand/logo.png"
          alt="logo"
      />
    </a>
  </div>
</template>
<script lang="ts">
import {defineComponent} from "vue";
export default defineComponent({
  name: 'ApplicationLogo'
})
</script>