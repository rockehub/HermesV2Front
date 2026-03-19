<template>
  <div v-show="isActive">
    <slot />
  </div>
</template>

<script lang="ts" setup>
import { computed, inject, onMounted, onUnmounted, type Ref } from 'vue'

const props = defineProps({
  name: {
    type: String,
    required: true
  },
  label: {
    type: String,
    required: true
  }
})

const activeTab = inject('activeTab') as Ref<string>
const registerTab = inject('registerTab') as (tab: {
  name: String | undefined
  label: String | undefined
}) => void

const unregisterTab = inject('unregisterTab') as (tabName: String | undefined) => void

const isActive = computed(() => activeTab.value === props.name)

onMounted(() => {
  registerTab({ name: props.name, label: props.label })
})

onUnmounted(() => {
  unregisterTab(props.name)
})
</script>
