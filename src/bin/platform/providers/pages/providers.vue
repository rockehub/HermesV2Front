<template>
  <DefaultLayout
    :icon="{ type: 'fa', icon: 'fa-solid fa-plug-circle-bolt text-[1.2rem]' }"
    :menu-items="[]"
  >
    <div class="p-6">
      <div class="mb-6">
        <h1 class="text-2xl font-semibold text-slate-800 dark:text-navy-100">Provedores</h1>
        <p class="text-sm text-slate-500 dark:text-navy-400 mt-1">
          Configure as integrações de entrega, pagamento e fiscal
        </p>
      </div>

      <!-- Tabs -->
      <div class="flex gap-1 mb-6 border-b border-slate-200 dark:border-navy-700">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          :class="[
            'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
            currentTab === tab.key
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-navy-400 dark:hover:text-navy-200'
          ]"
          @click="currentTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Entrega tab -->
      <div v-if="currentTab === 'delivery'">
        <div v-if="loading" class="flex justify-center py-12">
          <em class="fa-solid fa-spinner fa-spin text-2xl text-primary"></em>
        </div>

        <div v-else class="grid gap-4 max-w-2xl">
          <ShippingProviderCard
            v-for="p in SHIPPING_PROVIDERS"
            :key="p.key"
            :provider="p.key"
            :config="configMap[p.key]"
            @disable="handleDisable"
          >
            <template #default="{ config }">
              <MelhorEnvioConfigForm
                v-if="p.key === 'melhorenvio'"
                :config="config"
                :saving="saving === p.key"
                @activate="(form) => handleActivate(p.key, form)"
                @disable="handleDisable(p.key)"
              />
              <div v-else class="text-sm text-slate-500 dark:text-navy-400 italic">
                Integração em breve
              </div>
            </template>
          </ShippingProviderCard>
        </div>
      </div>

      <!-- Pagamento tab -->
      <div v-else-if="currentTab === 'payment'" class="text-sm text-slate-500 dark:text-navy-400 italic py-8">
        Integrações de pagamento em breve
      </div>

      <!-- Fiscal tab -->
      <div v-else-if="currentTab === 'fiscal'">
        <div v-if="loadingFiscal" class="flex justify-center py-12">
          <em class="fa-solid fa-spinner fa-spin text-2xl text-primary"></em>
        </div>

        <div v-else class="grid gap-4 max-w-2xl">
          <ShippingProviderCard
            v-for="p in FISCAL_PROVIDERS"
            :key="p.key"
            :provider="p.key"
            :config="fiscalConfigMap[p.key]"
            @disable="handleFiscalDisable"
          >
            <template #default="{ config }">
              <FocusNfeConfigForm
                v-if="p.key === 'focusnfe'"
                :config="config"
                :saving="savingFiscal === p.key"
                @activate="(form) => handleFiscalActivate(p.key, form)"
                @disable="handleFiscalDisable(p.key)"
              />
            </template>
          </ShippingProviderCard>
        </div>
      </div>
    </div>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import DefaultLayout from '@/bin/platform/hermes/layouts/default.vue'
import notification from '@/helpers/utils/notification'
import { useProvidersApi } from '../composables/useProvidersApi'
import type { ShippingProviderConfigResponse, FiscalProviderConfigResponse } from '../composables/useProvidersApi'
import ShippingProviderCard from '../components/ShippingProviderCard.vue'
import MelhorEnvioConfigForm from '../components/MelhorEnvioConfigForm.vue'
import FocusNfeConfigForm from '../components/FocusNfeConfigForm.vue'

const toast = notification
const route  = useRoute()
const api    = useProvidersApi()

const tabs = [
  { key: 'delivery', label: 'Entrega' },
  { key: 'payment',  label: 'Pagamento' },
  { key: 'fiscal',   label: 'Fiscal' },
]

const SHIPPING_PROVIDERS = [
  { key: 'melhorenvio' },
  { key: 'correios' },
  { key: 'lalamove' },
]

const FISCAL_PROVIDERS = [
  { key: 'focusnfe' },
]

const currentTab   = ref((route.params.tab as string) || 'delivery')
const loading      = ref(false)
const saving       = ref<string | null>(null)
const configs      = ref<ShippingProviderConfigResponse[]>([])
const loadingFiscal = ref(false)
const savingFiscal  = ref<string | null>(null)
const fiscalConfigs = ref<FiscalProviderConfigResponse[]>([])

const configMap = computed(() => {
  const m: Record<string, ShippingProviderConfigResponse> = {}
  for (const c of configs.value) m[c.provider] = c
  return m
})

const fiscalConfigMap = computed(() => {
  const m: Record<string, FiscalProviderConfigResponse> = {}
  for (const c of fiscalConfigs.value) m[c.provider] = c
  return m
})

async function loadConfigs() {
  loading.value = true
  try {
    const res = await api.listShippingProviders()
    configs.value = res.data
  } catch {
    // not configured yet is OK
  } finally {
    loading.value = false
  }
}

async function loadFiscalConfigs() {
  loadingFiscal.value = true
  try {
    const res = await api.listFiscalProviders()
    fiscalConfigs.value = res.data
  } catch {
    // not configured yet is OK
  } finally {
    loadingFiscal.value = false
  }
}

async function handleActivate(provider: string, form: {
  clientId: string; clientSecret: string; sandbox: boolean; callbackBaseUrl: string
}) {
  saving.value = provider
  try {
    const res = await api.activateShippingProvider(provider, form)
    const result = res.data

    if (result.authorizationUrl) {
      window.location.href = result.authorizationUrl
    } else {
      toast({ text: 'Provider ativado com sucesso', variant: 'success' })
      await loadConfigs()
    }
  } catch (e: any) {
    toast({ text: e?.response?.data?.message ?? 'Erro ao ativar provider', variant: 'error' })
  } finally {
    saving.value = null
  }
}

async function handleDisable(provider: string) {
  try {
    await api.disableShippingProvider(provider)
    toast({ text: 'Provider desativado', variant: 'success' })
    await loadConfigs()
  } catch {
    toast({ text: 'Erro ao desativar provider', variant: 'error' })
  }
}

async function handleFiscalActivate(provider: string, form: { token: string; sandbox: boolean; extraConfig: string }) {
  savingFiscal.value = provider
  try {
    await api.activateFiscalProvider(provider, form)
    toast({ text: 'Provider fiscal ativado com sucesso', variant: 'success' })
    await loadFiscalConfigs()
  } catch (e: any) {
    toast({ text: e?.response?.data?.message ?? 'Erro ao ativar provider fiscal', variant: 'error' })
  } finally {
    savingFiscal.value = null
  }
}

async function handleFiscalDisable(provider: string) {
  try {
    await api.disableFiscalProvider(provider)
    toast({ text: 'Provider fiscal desativado', variant: 'success' })
    await loadFiscalConfigs()
  } catch {
    toast({ text: 'Erro ao desativar provider fiscal', variant: 'error' })
  }
}

onMounted(async () => {
  await Promise.all([loadConfigs(), loadFiscalConfigs()])

  if (route.query.activated) {
    const provider = route.query.activated as string
    toast({ text: `${provider} autorizado com sucesso!`, variant: 'success' })
  }
})
</script>
