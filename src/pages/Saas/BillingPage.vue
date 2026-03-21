<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { $axios } from '@/helpers/integration/integration'
import notification from '@/helpers/utils/notification'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const toast = notification
const state = ref<any | null>(null)
const loadingCancel = ref(false)
const loadingReactivate = ref(false)

const isActive = computed(
  () =>
    state.value &&
    ['ACTIVE', 'TRIALING'].includes(state.value.subscriptionStatus) &&
    !state.value.cancelAtPeriodEnd
)
const isCanceled = computed(
  () =>
    state.value && (state.value.subscriptionStatus === 'CANCELED' || state.value.cancelAtPeriodEnd)
)

function formatDate(value: string | null): string {
  if (!value) return '—'
  const d = new Date(value)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

async function load() {
  try {
    const response = await $axios.get('/api/v1/account/subscription')
    state.value = response.data.data
  } catch (error: any) {
    const msg = error.response?.data?.message ?? 'Erro ao carregar assinatura'
    toast({ text: msg, variant: 'error' })
  }
}

async function cancelSubscription() {
  loadingCancel.value = true
  try {
    const response = await $axios.post('/api/v1/account/subscription/cancel')
    state.value = response.data.data
    toast({ text: 'Assinatura cancelada ao fim do ciclo', variant: 'success' })
  } catch (error: any) {
    const msg = error.response?.data?.message ?? 'Erro ao cancelar assinatura'
    toast({ text: msg, variant: 'error' })
  } finally {
    loadingCancel.value = false
  }
}

async function reactivateSubscription() {
  loadingReactivate.value = true
  try {
    const response = await $axios.post('/api/v1/account/subscription/reactivate')
    state.value = response.data.data
    toast({ text: 'Assinatura reativada com sucesso', variant: 'success' })
  } catch (error: any) {
    const msg = error.response?.data?.message ?? 'Erro ao reativar assinatura'
    toast({ text: msg, variant: 'error' })
  } finally {
    loadingReactivate.value = false
  }
}
const auth = useAuthStore()
const router = useRouter()
const logout = (): void => {
  auth.logout().then(() => {
    router.push({ name: 'login' })
  })
}
onMounted(load)
</script>

<template>
  <div class="flex min-h-screen grow flex-col items-center bg-slate-50 px-6 py-16 dark:bg-navy-900">
    <div class="w-full max-w-2xl">
      <div class="flex items-start justify-between gap-6">
        <div>
          <p class="text-sm uppercase tracking-[0.3em] text-primary">Billing</p>
          <h1 class="mt-3 text-4xl font-semibold text-slate-900 dark:text-navy-100">Assinatura</h1>
          <p class="mt-3 text-slate-500 dark:text-navy-300">
            Gerencie seu plano e acompanhe o status da conta.
          </p>
        </div>
        <router-link
          to="/onboarding"
          class="mt-2 shrink-0 text-sm text-slate-400 transition-colors hover:text-slate-700 dark:text-navy-300 dark:hover:text-navy-100"
        >
          Onboarding
        </router-link>
      </div>

      <section
        v-if="state"
        class="mt-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-navy-500 dark:bg-navy-700"
      >
        <div class="grid gap-6 md:grid-cols-2">
          <div>
            <p class="text-xs uppercase tracking-wide text-slate-400 dark:text-navy-300">Plano</p>
            <p class="mt-1 text-xl font-semibold text-slate-900 dark:text-navy-100">
              {{ state.planName }}
            </p>
          </div>
          <div>
            <p class="text-xs uppercase tracking-wide text-slate-400 dark:text-navy-300">Status</p>
            <p
              class="mt-1 text-xl font-semibold"
              :class="{
                'text-emerald-600 dark:text-emerald-400': isActive,
                'text-amber-600 dark:text-amber-400': state.subscriptionStatus === 'PAST_DUE',
                'text-slate-500 dark:text-navy-300': isCanceled
              }"
            >
              {{ state.subscriptionStatus }}
              <span v-if="state.cancelAtPeriodEnd" class="ml-1 text-xs font-normal text-amber-500"
                >(cancela no fim do ciclo)</span
              >
            </p>
          </div>
          <div>
            <p class="text-xs uppercase tracking-wide text-slate-400 dark:text-navy-300">
              Ciclo de cobrança
            </p>
            <p class="mt-1 text-slate-900 dark:text-navy-100">{{ state.billingCycle }}</p>
          </div>
          <div>
            <p class="text-xs uppercase tracking-wide text-slate-400 dark:text-navy-300">
              Próximo vencimento
            </p>
            <p class="mt-1 text-slate-900 dark:text-navy-100">
              {{ formatDate(state.currentPeriodEnd) }}
            </p>
          </div>
          <div v-if="state.trialEndsAt">
            <p class="text-xs uppercase tracking-wide text-slate-400 dark:text-navy-300">
              Trial até
            </p>
            <p class="mt-1 text-slate-900 dark:text-navy-100">
              {{ formatDate(state.trialEndsAt) }}
            </p>
          </div>
          <div>
            <p class="text-xs uppercase tracking-wide text-slate-400 dark:text-navy-300">Valor</p>
            <p class="mt-1 text-slate-900 dark:text-navy-100">
              R$ {{ Number(state.amount).toFixed(2) }}
            </p>
          </div>
        </div>

        <div
          v-if="state.blockedReason"
          class="mt-6 rounded-2xl bg-amber-50 px-4 py-3 dark:bg-amber-900/20"
        >
          <p class="text-sm text-amber-800 dark:text-amber-300">{{ state.blockedReason }}</p>
        </div>

        <div class="mt-8 flex flex-wrap gap-3">
          <button
            v-if="isCanceled"
            :disabled="loadingReactivate"
            class="btn bg-primary px-5 py-2.5 font-medium text-white hover:bg-primary-focus disabled:opacity-60"
            @click="reactivateSubscription"
          >
            <span v-if="loadingReactivate">Reativando...</span>
            <span v-else>Reativar assinatura</span>
          </button>
          <button
            v-if="isActive"
            :disabled="loadingCancel"
            class="btn border border-slate-300 px-5 py-2.5 font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60 dark:border-navy-400 dark:text-navy-100 dark:hover:bg-navy-600"
            @click="cancelSubscription"
          >
            <span v-if="loadingCancel">Cancelando...</span>
            <span v-else>Cancelar no fim do ciclo</span>
          </button>

          <button
            class="btn border border-slate-300 px-5 py-2.5 font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60 dark:border-navy-400 dark:text-navy-100 dark:hover:bg-navy-600"
            @click="logout"
          >
            <span >Sair</span>
          </button>
        </div>
      </section>

      <div
        v-else
        class="mt-8 flex items-center justify-center py-16 text-slate-400 dark:text-navy-400"
      >
        Carregando...
      </div>
    </div>
  </div>
</template>
