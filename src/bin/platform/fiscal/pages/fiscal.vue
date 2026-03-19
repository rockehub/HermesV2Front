<script lang="ts" setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import DefaultLayout from '@/bin/platform/hermes/layouts/default.vue'
import type { HermesMenuItem } from '@/bin/platform/hermes/classes/MenuUtils'
import FiscalDocumentList from '../components/FiscalDocumentList.vue'
import NfEntradaForm from '../components/NfEntradaForm.vue'
import CteForm from '../components/CteForm.vue'

const route = useRoute()

const sub = computed(() => (route.params.sub as string) || 'list')

const menuItems: HermesMenuItem[] = [
  {
    name: 'fiscal',
    label: 'Lista de Notas',
    displayName: 'Lista de Notas',
    entityName: 'list',
    icon: { icon: 'fa-light fa-list-ul', type: 'fa' },
    params: { cockpit: 'fiscal', sub: 'list' },
    hasChildren: false
  },
  {
    name: 'fiscal',
    label: 'NF-e Entrada',
    displayName: 'NF-e Entrada',
    entityName: 'entrada',
    icon: { icon: 'fa-light fa-file-import', type: 'fa' },
    params: { cockpit: 'fiscal', sub: 'entrada' },
    hasChildren: false
  },
  {
    name: 'fiscal',
    label: 'CT-e',
    displayName: 'CT-e',
    entityName: 'cte',
    icon: { icon: 'fa-light fa-truck', type: 'fa' },
    params: { cockpit: 'fiscal', sub: 'cte' },
    hasChildren: false
  }
]
</script>

<template>
  <DefaultLayout
    :icon="{ type: 'fa', icon: 'fa-light fa-file-invoice text-[1.2rem]' }"
    :menu-items="menuItems"
  >
    <div class="p-6">
      <FiscalDocumentList v-if="sub === 'list'" />
      <NfEntradaForm     v-else-if="sub === 'entrada'" />
      <CteForm           v-else-if="sub === 'cte'" />
    </div>
  </DefaultLayout>
</template>
