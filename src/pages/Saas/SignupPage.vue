<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useGlobalState } from '@/stores/stores'
import { $axios } from '@/helpers/integration/integration'
import notification from '@/helpers/utils/notification'

const route = useRoute()
const toast = notification
const plans = ref<any[]>([])
const loading = ref(false)
const form = ref({
  legalName: '',
  tradeName: '',
  cnpj: '',
  tenantSlug: '',
  ownerName: '',
  ownerEmail: '',
  ownerUsername: '',
  password: '',
  planSlug: String(route.query.plan ?? '')
})
const created = ref<any | null>(null)
const darkMode = useGlobalState()

onMounted(async () => {
  try {
    const response = await $axios.get('/api/v1/public/plans')
    plans.value = response.data.data ?? []
    if (!form.value.planSlug && plans.value.length) {
      form.value.planSlug = plans.value[0].slug
    }
  } catch {
    toast({ text: 'Erro ao carregar planos', variant: 'error' })
  }
})

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

async function submit() {
  if (!form.value.legalName || !form.value.tenantSlug || !form.value.ownerName ||
      !form.value.ownerEmail || !form.value.ownerUsername || !form.value.password) {
    toast({ text: 'Preencha todos os campos obrigatórios', variant: 'error' })
    return
  }
  loading.value = true
  try {
    const response = await $axios.post('/api/v1/public/onboarding/signup', form.value)
    created.value = response.data.data
  } catch (error: any) {
    const msg = error.response?.data?.message ?? 'Erro ao criar conta'
    toast({ text: msg, variant: 'error' })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-100vh flex grow flex-col bg-slate-50 dark:bg-navy-900">
    <header class="flex items-center justify-between px-6 py-5 lg:px-12">
      <a href="#" class="flex items-center gap-2">
        <img v-show="!darkMode.isDarkMode" class="w-10" src="@/assets/images/brand/logo-dark.png" alt="logo" />
        <img v-show="darkMode.isDarkMode" class="w-10" src="@/assets/images/brand/logo-light.png" alt="logo" />
        <span class="text-lg font-semibold uppercase text-slate-700 dark:text-navy-100">havix</span>
      </a>
      <div class="flex items-center gap-4 text-sm">
        <router-link
          to="/plans"
          class="text-slate-500 transition-colors hover:text-slate-900 dark:text-navy-300 dark:hover:text-navy-100"
        >
          Ver planos
        </router-link>
        <router-link
          to="/auth/login"
          class="text-slate-500 transition-colors hover:text-slate-900 dark:text-navy-300 dark:hover:text-navy-100"
        >
          Entrar
        </router-link>
      </div>
    </header>

    <main class="flex grow items-start justify-center px-6 py-10">
      <div class="w-full max-w-lg">
        <div
          v-if="created"
          class="rounded-3xl border border-emerald-200 bg-emerald-50 p-8 dark:border-emerald-800 dark:bg-emerald-900/20"
        >
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
            <svg class="h-6 w-6 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 class="mt-4 text-2xl font-semibold text-slate-900 dark:text-navy-100">Conta criada!</h2>
          <p class="mt-2 text-slate-600 dark:text-navy-300">
            Agora você pode entrar no Havix para concluir o onboarding.
          </p>
          <router-link
            to="/auth/login"
            class="btn mt-6 inline-flex bg-primary px-5 py-3 font-medium text-white hover:bg-primary-focus"
          >
            Ir para o login
          </router-link>
        </div>

        <template v-else>
          <p class="text-sm uppercase tracking-[0.3em] text-primary">Cadastro</p>
          <h1 class="mt-3 text-4xl font-semibold text-slate-900 dark:text-navy-100">Criar conta</h1>
          <p class="mt-3 text-slate-500 dark:text-navy-300">Cadastre sua empresa e comece a usar o Havix.</p>

          <form
            class="mt-10 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-navy-500 dark:bg-navy-700"
            @submit.prevent="submit"
          >
            <p class="mb-4 text-sm font-medium text-slate-700 dark:text-navy-100">Dados da empresa</p>
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
                <p class="mt-1 text-xs text-slate-400 dark:text-navy-300">Necessário para emissão de cobranças.</p>
              </div>
              <div>
                <label class="mb-1.5 block text-xs font-medium text-slate-700 dark:text-navy-100">
                  Identificador (slug) <span class="text-error">*</span>
                </label>
                <input
                  v-model="form.tenantSlug"
                  required
                  class="form-input w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:hover:border-navy-400 dark:focus:border-accent"
                  placeholder="Ex: minha-empresa"
                />
                <p class="mt-1 text-xs text-slate-400 dark:text-navy-300">Usado na URL da sua conta. Apenas letras, números e hífens.</p>
              </div>
            </div>

            <p class="mb-4 mt-8 text-sm font-medium text-slate-700 dark:text-navy-100">Responsável</p>
            <div class="grid gap-4">
              <div>
                <label class="mb-1.5 block text-xs font-medium text-slate-700 dark:text-navy-100">
                  Nome completo <span class="text-error">*</span>
                </label>
                <input
                  v-model="form.ownerName"
                  required
                  class="form-input w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:hover:border-navy-400 dark:focus:border-accent"
                  placeholder="Ex: João Silva"
                />
              </div>
              <div>
                <label class="mb-1.5 block text-xs font-medium text-slate-700 dark:text-navy-100">
                  Email <span class="text-error">*</span>
                </label>
                <input
                  v-model="form.ownerEmail"
                  type="email"
                  required
                  class="form-input w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:hover:border-navy-400 dark:focus:border-accent"
                  placeholder="Ex: joao@empresa.com"
                />
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="mb-1.5 block text-xs font-medium text-slate-700 dark:text-navy-100">
                    Usuário <span class="text-error">*</span>
                  </label>
                  <input
                    v-model="form.ownerUsername"
                    required
                    class="form-input w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:hover:border-navy-400 dark:focus:border-accent"
                    placeholder="Ex: joao"
                  />
                </div>
                <div>
                  <label class="mb-1.5 block text-xs font-medium text-slate-700 dark:text-navy-100">
                    Senha <span class="text-error">*</span>
                  </label>
                  <input
                    v-model="form.password"
                    type="password"
                    required
                    class="form-input w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:hover:border-navy-400 dark:focus:border-accent"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <p class="mb-4 mt-8 text-sm font-medium text-slate-700 dark:text-navy-100">Plano</p>
            <div>
              <label class="mb-1.5 block text-xs font-medium text-slate-700 dark:text-navy-100">Selecione o plano</label>
              <select
                v-model="form.planSlug"
                class="form-select w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:hover:border-navy-400 dark:focus:border-accent"
              >
                <option v-for="plan in plans" :key="plan.id" :value="plan.slug">
                  {{ plan.name }} — R$ {{ Number(plan.price).toFixed(2) }}/{{ plan.billingCycle }}
                  <template v-if="plan.trialDays"> · {{ plan.trialDays }} dias grátis</template>
                </option>
              </select>
            </div>

            <button
              type="submit"
              :disabled="loading"
              class="btn mt-8 w-full justify-center bg-primary py-3 font-medium text-white hover:bg-primary-focus disabled:opacity-60"
            >
              <span v-if="loading">Criando conta...</span>
              <span v-else>Criar conta</span>
            </button>
          </form>
        </template>
      </div>
    </main>
  </div>
</template>
