<script lang="ts" setup>
import DefaultLayout from '@/bin/platform/hermes/layouts/default.vue'
import { useRoute, useRouter } from 'vue-router'
import { findMenu, type HermesMenuItem } from '@/bin/platform/hermes/classes/MenuUtils'
import { computed, onMounted, ref, watchEffect } from 'vue'
import { useMenuStore } from '@/stores/menuStore'

const route = useRoute()
const router = useRouter()
const menuStore = useMenuStore()
const menu = ref<HermesMenuItem[]>([])
const allEntities = ref<HermesMenuItem[]>([])

const resource = computed(() => {
  const sub = route.params.sub as string | undefined
  return sub && sub.length > 0 ? sub : (route.params.cockpit as string | undefined)
})

// Rótulo do entity atual para o breadcrumb (ex: "product" → label do menu)
const currentEntityLabel = computed(() => {
  if (!route.params.cockpit) return null
  const found = allEntities.value.find(
    item => item.params?.cockpit === route.params.cockpit
  )
  return found?.label ?? (route.params.cockpit as string)
})

// Rota de retorno: presente apenas quando um entity está selecionado
const backRoute = computed(() =>
  route.params.cockpit ? { name: 'cockpit' } : null
)

onMounted(async () => {
  allEntities.value = await findMenu()
})

watchEffect(async () => {
  void menuStore.menuRevision  // cria dependência reativa

  if (!route.params.cockpit) {
    menu.value = await findMenu()
    return
  }
  menu.value = await findMenu(route.params.cockpit as string)
})
</script>

<template>
  <DefaultLayout
    :icon="{ type: 'fa', icon: 'fa-light fa-store text-[1.2rem]' }"
    :menu-items="menu"
    :back="backRoute"
    :section-label="currentEntityLabel"
  >
    <div v-if="!resource" class="flex flex-col items-center justify-center h-64 text-slate-400 dark:text-navy-400">
      <em class="fa-light fa-store text-4xl mb-3 opacity-40"></em>
      <p class="text-sm">Selecione um item no menu lateral</p>
    </div>
    <resource-builder v-else :key="resource" :resource="resource" />
  </DefaultLayout>
</template>
