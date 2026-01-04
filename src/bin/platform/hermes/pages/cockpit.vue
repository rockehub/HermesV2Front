<script lang="ts" setup>
import DefaultLayout from '@/bin/platform/hermes/layouts/default.vue'
import { useRoute } from 'vue-router'
import { findMenu } from '@/bin/platform/hermes/classes/MenuUtils'
import { computed, ref, watch } from 'vue'

const route = useRoute()
let menu = ref([])

watch(() => route.params.cockpit, () => {
  findMenu(route.params.cockpit as string).then((response) => {
    menu.value = response
  })
}, { immediate: true })

const resource  = computed(()=>{
  return (route.params.sub ?? route.params.cockpit) as string
})
</script>

<template>
  <DefaultLayout :icon="{ type: 'material',icon: 'group'}" :menu-items="menu">
    <resource-builder :resource="resource"/>
  </DefaultLayout>
</template>

<style scoped>

</style>