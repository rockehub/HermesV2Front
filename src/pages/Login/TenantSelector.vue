<script lang="ts" setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useTenantStore } from '@/stores/tenantStore'
import { useAuthStore, useGlobalState } from '@/stores/stores'

const router = useRouter()
const tenantStore = useTenantStore()
const authStore = useAuthStore()
const globalState = useGlobalState()

const tenants = computed(() => tenantStore.availableTenants)

async function choose(tenantId: string) {
  globalState.setReady(false)
  try {
    await authStore.selectTenant(tenantId)
    await router.push({ name: 'dashboard' })
  } finally {
    globalState.setReady(true)
  }
}

function cancel() {
  authStore.clearAuth()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="min-h-100vh flex grow items-center justify-center bg-slate-50 dark:bg-navy-900 px-4">
    <div class="w-full max-w-md">
      <!-- Header -->
      <div class="mb-8 text-center">
        <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
          <em class="fa-solid fa-building-user text-2xl text-primary"></em>
        </div>
        <h2 class="text-xl font-semibold text-slate-700 dark:text-navy-100">Selecionar Empresa</h2>
        <p class="mt-1 text-sm text-slate-400 dark:text-navy-300">
          Você possui acesso a múltiplas empresas. Escolha uma para continuar.
        </p>
      </div>

      <!-- Tenant list -->
      <div class="space-y-2">
        <button
          v-for="tenant in tenants"
          :key="tenant.id"
          class="group flex w-full items-center gap-4 rounded-xl border border-slate-200 dark:border-navy-600 bg-white dark:bg-navy-750 px-4 py-3.5 text-left transition-all hover:border-primary/50 hover:bg-primary/5 dark:hover:bg-navy-700"
          @click="choose(tenant.id)"
        >
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary dark:bg-accent-light/10 dark:text-accent-light">
            <em class="fa-solid fa-building text-sm"></em>
          </div>
          <div class="flex-1 min-w-0">
            <p class="truncate font-medium text-slate-700 dark:text-navy-100 group-hover:text-primary dark:group-hover:text-accent-light">
              {{ tenant.name }}
            </p>
            <p v-if="tenant.slug" class="text-xs text-slate-400 dark:text-navy-300">{{ tenant.slug }}</p>
          </div>
          <em class="fa-solid fa-chevron-right text-xs text-slate-300 group-hover:text-primary dark:text-navy-400 dark:group-hover:text-accent-light transition-colors"></em>
        </button>
      </div>

      <!-- Cancel -->
      <button
        class="mt-6 w-full text-center text-sm text-slate-400 hover:text-slate-600 dark:text-navy-300 dark:hover:text-navy-100 transition-colors"
        @click="cancel"
      >
        Cancelar e voltar ao login
      </button>
    </div>
  </div>
</template>
