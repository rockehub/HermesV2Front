<script lang="ts" setup>
import DefaultLayout from '@/bin/platform/hermes/layouts/default.vue'
import { useRoute } from 'vue-router'
import { findMenu } from '@/bin/platform/hermes/classes/MenuUtils'
import { computed, ref, watchEffect } from 'vue'

const route = useRoute()
const menu = ref([])

const resource = computed(() => {
  const sub = route.params.sub as string | undefined
  return sub && sub.length > 0 ? sub : (route.params.cockpit as string | undefined)
})

watchEffect(async () => {
  if (!route.params.cockpit) return
  menu.value = await findMenu(route.params.cockpit as string)
})
</script>

<template>
  <DefaultLayout :icon="{ type: 'material', icon: 'group' }" :menu-items="menu">
    <resource-form v-if="resource" :key="resource" :resource="resource" />
  </DefaultLayout>
</template>

<style scoped></style>
