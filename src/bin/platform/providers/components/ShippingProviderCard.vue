<template>
  <div class="card p-5">
    <div class="flex items-start justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-lg bg-slate-100 dark:bg-navy-700 flex items-center justify-center shrink-0">
          <em :class="['text-lg', providerMeta.icon]"></em>
        </div>
        <div>
          <h3 class="font-semibold text-slate-800 dark:text-navy-100">{{ providerMeta.label }}</h3>
          <p class="text-xs text-slate-500 dark:text-navy-400">{{ providerMeta.description }}</p>
        </div>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        <!-- Status badge -->
        <span :class="['badge text-xs', statusBadgeClass]">{{ statusLabel }}</span>

        <!-- Toggle active/inactive (only when ACTIVE) -->
        <button
          v-if="config?.status === 'ACTIVE'"
          type="button"
          class="relative inline-flex h-5 w-9 items-center rounded-full bg-primary transition-colors"
          title="Desativar provider"
          @click="emit('disable', provider)"
        >
          <span class="inline-block h-3.5 w-3.5 transform translate-x-5 rounded-full bg-white shadow"></span>
        </button>
      </div>
    </div>

    <!-- Expand/collapse config -->
    <div class="mt-4">
      <button
        type="button"
        class="text-sm text-primary hover:underline flex items-center gap-1"
        @click="expanded = !expanded"
      >
        <em :class="['fa-solid fa-chevron-right text-xs transition-transform', expanded ? 'rotate-90' : '']"></em>
        {{ expanded ? 'Fechar configuração' : 'Configurar' }}
      </button>

      <div v-if="expanded" class="mt-4 border-t border-slate-100 dark:border-navy-700 pt-4">
        <slot :config="config" />
      </div>
    </div>

    <!-- Polling spinner for PENDING_AUTH -->
    <div v-if="config?.status === 'PENDING_AUTH'" class="mt-3 flex items-center gap-2 text-amber-600 text-sm">
      <em class="fa-solid fa-spinner fa-spin"></em>
      Aguardando autorização OAuth2...
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type {
  FiscalProviderConfigResponse,
  ShippingProviderConfigResponse
} from '../composables/useProvidersApi'

type ProviderConfig = ShippingProviderConfigResponse | FiscalProviderConfigResponse

const props = defineProps<{
  provider: string
  config?: ProviderConfig | null
}>()

const emit = defineEmits<{
  disable: [provider: string]
}>()

const expanded = ref(false)

interface ProviderMeta {
  label: string
  description: string
  icon: string
}

const PROVIDER_META: Record<string, ProviderMeta> = {
  melhorenvio: {
    label: 'Melhor Envio',
    description: 'Cotação e envio via Melhor Envio (PAC, SEDEX, Jadlog e outros)',
    icon: 'fa-light fa-truck-fast text-primary',
  },
  correios: {
    label: 'Correios',
    description: 'Envios via PAC e SEDEX pelos Correios',
    icon: 'fa-light fa-mailbox text-slate-500',
  },
  lalamove: {
    label: 'Lalamove',
    description: 'Entregas expressas via Lalamove',
    icon: 'fa-light fa-motorcycle text-slate-500',
  },
  focusnfe: {
    label: 'Focus NF-e',
    description: 'Emissão de NF-e, NF-e de entrada e NFS-e via Focus NF-e',
    icon: 'fa-light fa-file-invoice text-primary',
  },
}

const providerMeta = computed(() => PROVIDER_META[props.provider] ?? {
  label: props.provider,
  description: '',
  icon: 'fa-light fa-plug',
})

const STATUS_LABELS: Record<string, string> = {
  NOT_CONFIGURED: 'Não configurado',
  PENDING_AUTH:   'Aguardando autorização',
  ACTIVE:         'Ativo',
  DISABLED:       'Desativado',
}

const STATUS_BADGE_CLASSES: Record<string, string> = {
  NOT_CONFIGURED: 'bg-slate-100 text-slate-500 dark:bg-navy-700 dark:text-navy-400',
  PENDING_AUTH:   'bg-amber-100 text-amber-700',
  ACTIVE:         'bg-emerald-100 text-emerald-700',
  DISABLED:       'bg-slate-200 text-slate-600 dark:bg-navy-700 dark:text-navy-300',
}

const currentStatus = computed(() => props.config?.status ?? 'NOT_CONFIGURED')
const statusLabel     = computed(() => STATUS_LABELS[currentStatus.value] ?? currentStatus.value)
const statusBadgeClass = computed(() => STATUS_BADGE_CLASSES[currentStatus.value] ?? STATUS_BADGE_CLASSES['NOT_CONFIGURED'])
</script>
