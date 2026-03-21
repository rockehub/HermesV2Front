<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { $axios } from '@/helpers/integration/integration'
import notification from '@/helpers/utils/notification'

const toast = notification
const state = ref<any | null>(null)
const loading = ref(false)
const form = ref({ legalName: '', tradeName: '', cnpj: '' })

async function load() {
  try {
    const response = await $axios.get('/api/v1/account/onboarding')
    state.value = response.data.data
    form.value.legalName = state.value?.legalName ?? state.value?.tenantName ?? ''
    form.value.tradeName = state.value?.tradeName ?? state.value?.tenantName ?? ''
    form.value.cnpj = state.value?.cnpj ?? ''
  } catch (error: any) {
    const msg = error.response?.data?.message ?? 'Erro ao carregar dados'
    toast({ text: msg, variant: 'error' })
  }
}

function formatCnpj(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 14)
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

function onCnpjInput(e: Event) {
  form.value.cnpj = formatCnpj((e.target as HTMLInputElement).value)
}

async function save() {
  if (!form.value.legalName) {
    toast({ text: 'Razão social é obrigatória', variant: 'error' })
    return
  }
  loading.value = true
  try {
    const response = await $axios.post('/api/v1/account/onboarding', form.value)
    state.value = response.data.data
    toast({ text: 'Dados salvos com sucesso', variant: 'success' })
  } catch (error: any) {
    const msg = error.response?.data?.message ?? 'Erro ao salvar'
    toast({ text: msg, variant: 'error' })
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="flex min-h-screen grow flex-col items-center justify-center bg-slate-50 px-6 py-16 dark:bg-navy-900">
    <div class="w-full max-w-lg">
      <router-link :to="{ name: 'dashboard' }" class="mb-8 inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-slate-700 dark:text-navy-300 dark:hover:text-navy-100">
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        Voltar
      </router-link>

      <p class="text-sm uppercase tracking-[0.3em] text-primary">Onboarding</p>
      <h1 class="mt-3 text-4xl font-semibold text-slate-900 dark:text-navy-100">Configurar conta</h1>
      <p class="mt-3 text-slate-500 dark:text-navy-300">
        Finalize os dados básicos do tenant antes de seguir para a operação normal.
      </p>

      <div
        v-if="state"
        class="mt-8 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-5 dark:border-navy-500 dark:bg-navy-700"
      >
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <svg class="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </div>
        <div>
          <p class="text-xs text-slate-400 dark:text-navy-300">Status atual</p>
          <p class="text-sm font-semibold text-slate-900 dark:text-navy-100">{{ state.onboardingStatus }}</p>
        </div>
      </div>

      <form
        class="mt-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-navy-500 dark:bg-navy-700"
        @submit.prevent="save"
      >
        <div class="grid gap-4">
          <div>
            <label class="mb-1.5 block text-xs font-medium text-slate-700 dark:text-navy-100">
              Razão social <span class="text-error">*</span>
            </label>
            <input
              v-model="form.legalName"
              required
              class="form-input w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:hover:border-navy-400 dark:focus:border-accent"
              placeholder="Ex: Empresa LTDA"
            />
          </div>
          <div>
            <label class="mb-1.5 block text-xs font-medium text-slate-700 dark:text-navy-100">Nome fantasia</label>
            <input
              v-model="form.tradeName"
              class="form-input w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:hover:border-navy-400 dark:focus:border-accent"
              placeholder="Ex: Minha Empresa"
            />
          </div>
          <div>
            <label class="mb-1.5 block text-xs font-medium text-slate-700 dark:text-navy-100">CNPJ</label>
            <input
              :value="form.cnpj"
              @input="onCnpjInput"
              inputmode="numeric"
              class="form-input w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:hover:border-navy-400 dark:focus:border-accent"
              placeholder="00.000.000/0000-00"
            />
            <p class="mt-1 text-xs text-slate-400 dark:text-navy-300">Necessário para emissão de cobranças via Asaas.</p>
          </div>
        </div>
        <button
          type="submit"
          :disabled="loading"
          class="btn mt-6 w-full justify-center bg-primary py-3 font-medium text-white hover:bg-primary-focus disabled:opacity-60"
        >
          <span v-if="loading">Salvando...</span>
          <span v-else>Salvar e continuar</span>
        </button>
      </form>

      <div class="mt-6 text-center">
        <router-link
          to="/billing"
          class="text-sm text-slate-400 transition-colors hover:text-slate-700 dark:text-navy-300 dark:hover:text-navy-100"
        >
          Ver assinatura
        </router-link>
      </div>
    </div>
  </div>
</template>
