<template>
  <div class="space-y-4">
    <div>
      <label class="block text-sm font-medium text-slate-700 dark:text-navy-200 mb-1">Client ID</label>
      <input
        v-model="form.clientId"
        type="text"
        placeholder="Seu Client ID do Melhor Envio"
        class="form-input w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:hover:border-navy-400 dark:focus:border-accent"
      />
    </div>

    <div>
      <label class="block text-sm font-medium text-slate-700 dark:text-navy-200 mb-1">Client Secret</label>
      <input
        v-model="form.clientSecret"
        type="password"
        :placeholder="hasExistingSecret ? '••••••••••••' : 'Seu Client Secret'"
        class="form-input w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:hover:border-navy-400 dark:focus:border-accent"
      />
      <p v-if="hasExistingSecret && !form.clientSecret" class="text-xs text-slate-400 mt-1">
        Deixe em branco para manter o secret atual
      </p>
    </div>

    <div>
      <label class="block text-sm font-medium text-slate-700 dark:text-navy-200 mb-1">Callback Base URL</label>
      <input
        v-model="form.callbackBaseUrl"
        type="url"
        placeholder="https://sua-url-publica.com"
        class="form-input w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:hover:border-navy-400 dark:focus:border-accent"
      />
      <p class="text-xs text-slate-400 mt-1">
        URL pública registrada no painel do Melhor Envio como Redirect URI
      </p>
    </div>

    <div class="flex items-center gap-3">
      <button
        type="button"
        :class="[
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
          form.sandbox ? 'bg-amber-400' : 'bg-slate-200 dark:bg-navy-600'
        ]"
        @click="form.sandbox = !form.sandbox"
      >
        <span
          :class="[
            'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
            form.sandbox ? 'translate-x-6' : 'translate-x-1'
          ]"
        />
      </button>
      <span class="text-sm text-slate-700 dark:text-navy-200">
        {{ form.sandbox ? 'Homologação (sandbox)' : 'Produção' }}
      </span>
    </div>

    <div class="flex items-center gap-3 pt-2">
      <button
        type="button"
        :disabled="saving || !isFormValid"
        class="btn btn-primary text-sm"
        @click="handleActivate"
      >
        <em v-if="saving" class="fa-solid fa-spinner fa-spin mr-1"></em>
        {{ saving ? 'Salvando...' : 'Ativar e Autorizar via OAuth2' }}
      </button>

      <button
        v-if="currentStatus === 'ACTIVE'"
        type="button"
        :disabled="saving"
        class="btn btn-error btn-outline text-sm"
        @click="emit('disable')"
      >
        Desativar
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, watch } from 'vue'
import type { ShippingProviderConfigResponse } from '../composables/useProvidersApi'

const props = defineProps<{
  config?: ShippingProviderConfigResponse | null
  saving?: boolean
}>()

const emit = defineEmits<{
  activate: [form: { clientId: string; clientSecret: string; sandbox: boolean; callbackBaseUrl: string }]
  disable: []
}>()

const form = reactive({
  clientId: '',
  clientSecret: '',
  sandbox: true,
  callbackBaseUrl: '',
})

const currentStatus = computed(() => props.config?.status ?? 'NOT_CONFIGURED')
const hasExistingSecret = computed(() => !!props.config?.clientId)

const isFormValid = computed(() =>
  form.clientId.trim().length > 0 &&
  (form.clientSecret.trim().length > 0 || hasExistingSecret.value)
)

watch(() => props.config, (c) => {
  if (c) {
    form.clientId = c.clientId ?? ''
    form.sandbox = c.sandbox ?? true
    form.callbackBaseUrl = c.callbackBaseUrl ?? ''
    form.clientSecret = ''
  }
}, { immediate: true })

function handleActivate() {
  emit('activate', { ...form })
}
</script>
