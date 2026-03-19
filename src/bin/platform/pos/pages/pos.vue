<script lang="ts" setup>
import HeaderComponent from '@/components/header/header.vue'
import WidgetArea from '@/components/globalWidgets/WidgetArea.vue'
import { usePosStore } from '../store/usePosStore'
import { onMounted } from 'vue'
import DefaultLayout from '@/bin/platform/hermes/layouts/default.vue'

const posStore = usePosStore()

onMounted(() => {
  posStore.init()
})
</script>

<template>
  <DefaultLayout
    :icon="{ type: 'fa', icon: 'fa-light fa-diagram-project text-[1.2rem]' }"
    :menu-items="[]"
  >
    <WidgetArea name="pos-main" :size="12" />
  </DefaultLayout>
</template>
