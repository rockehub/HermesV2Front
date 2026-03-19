<script lang="ts" setup>
import { onMounted, resolveComponent } from 'vue'

const props = defineProps<{ fields: any[] }>()

onMounted(() => {
  console.log(props.fields)
})

const fieldFinder = (type: string) => {
  switch (type) {
    case 'text':
    case 'options':
    case 'number':
    case 'search':
      return 'h-10'
    case 'file':
      return 'h-[90px]'
    case 'subform':
      return 'h-45'
    case 'layout':
      return 'h-20'
    case 'relation':
      return 'h-60'
    case 'textarea':
      return 'h-20'
    case 'dynamic':
      return 'h-45'
    case 'repeater':
      return 'h-65'
    default:
      return resolveComponent('form-fields-text')
  }
}
</script>

<template>
  <div class="space-y-4">
    <div class="grid grid-cols-12 gap-4">
      <div v-for="field in fields" :class="`col-span-${field.span}`">
        <div class="bg-gray-300 animate-pulse h-3 rounded w-[50%] mb-2"></div>
        <div :class="fieldFinder(field.fieldType)" class="bg-gray-300 animate-pulse"></div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
