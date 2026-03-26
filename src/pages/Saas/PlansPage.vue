<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { $axios } from '@/helpers/integration/integration'
import { useGlobalState } from '@/stores/stores'

const plans = ref<any[]>([])
const darkMode = useGlobalState()

onMounted(async () => {
  const response = await $axios.get('/api/v1/public/plans')
  plans.value = response.data.data ?? []
})
</script>

<template>
  <div class="min-h-100vh flex grow flex-col bg-slate-50 dark:bg-navy-900">
    <header class="flex items-center justify-between px-6 py-5 lg:px-12">
      <a href="#" class="flex items-center gap-2">
        <img v-show="!darkMode.isDarkMode" class="w-10" src="@/assets/images/brand/logo-dark.png" alt="logo" />
        <img v-show="darkMode.isDarkMode" class="w-10" src="@/assets/images/brand/logo-light.png" alt="logo" />
        <span class="text-lg font-semibold uppercase text-slate-700 dark:text-navy-100">havix</span>
      </a>
      <router-link
        to="/auth/login"
        class="text-sm text-slate-500 transition-colors hover:text-slate-900 dark:text-navy-300 dark:hover:text-navy-100"
      >
        Já tenho conta
      </router-link>
    </header>

    <main class="flex grow flex-col items-center px-6 py-10">
      <div class="w-full max-w-5xl">
        <div class="mb-12 text-center">
          <p class="text-sm uppercase tracking-[0.3em] text-primary">Havix</p>
          <h1 class="mt-3 text-4xl font-semibold text-slate-900 dark:text-navy-100">Planos de assinatura</h1>
          <p class="mt-3 text-slate-500 dark:text-navy-300">Escolha o plano ideal para sua operação de delivery.</p>
        </div>

        <div class="grid gap-6 md:grid-cols-2">
          <article
            v-for="plan in plans"
            :key="plan.id"
            class="flex flex-col rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition-shadow hover:shadow-md dark:border-navy-500 dark:bg-navy-700"
          >
            <p class="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-navy-300">{{ plan.billingCycle }}</p>
            <h2 class="mt-3 text-2xl font-semibold text-slate-900 dark:text-navy-100">{{ plan.name }}</h2>
            <p class="mt-4 text-4xl font-bold text-slate-900 dark:text-navy-100">
              R$ {{ Number(plan.price).toFixed(2) }}
            </p>
            <p class="mt-2 grow text-sm text-slate-500 dark:text-navy-300">{{ plan.description }}</p>
            <p class="mt-4 inline-flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {{ plan.trialDays }} dias grátis para testar
            </p>
            <router-link
              :to="{ name: 'signup', query: { plan: plan.slug } }"
              class="btn mt-8 w-full justify-center bg-primary py-3 font-medium text-white hover:bg-primary-focus"
            >
              Assinar este plano
            </router-link>
          </article>
        </div>
      </div>
    </main>
  </div>
</template>
