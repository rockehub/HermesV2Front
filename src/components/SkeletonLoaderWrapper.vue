<script lang="ts">
import {defineComponent} from 'vue'


export default defineComponent({
  name: "SkeletonLoaderWrapper",
  props: {
    loading: {
      type: Boolean,
      default: false
    },
    quantity: {
      type: Number,
      default: 1
    },
    className: {
      type: String,
      default: ''
    }

  }
})
</script>

<template>
  <div class="div" v-if="loading" :class="className">
    <slot name="skeleton" v-for="n in quantity" :key="n"/>
  </div>
  <slot v-if="!loading"></slot>

</template>

<style scoped>

</style>