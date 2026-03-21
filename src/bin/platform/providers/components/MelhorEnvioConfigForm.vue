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

    <div>
      <label class="block text-sm font-medium text-slate-700 dark:text-navy-200 mb-1">Agencia Melhor Envio</label>
      <input
        v-model="form.agency"
        type="number"
        min="1"
        placeholder="Ex: 49"
        class="form-input w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:hover:border-navy-400 dark:focus:border-accent"
      />
      <p class="text-xs text-slate-400 mt-1">
        Agencia usada automaticamente nas actions de compra de etiqueta do Melhor Envio.
      </p>
    </div>


    <div>
      <label class="block text-sm font-medium text-slate-700 dark:text-navy-200 mb-1">Documento do remetente</label>
      <input
        v-model="form.senderDocument"
        type="text"
        placeholder="CPF ou CNPJ do remetente"
        class="form-input w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:hover:border-navy-400 dark:focus:border-accent"
      />
      <p class="text-xs text-slate-400 mt-1">
        Obrigatorio para compra de etiqueta. Pode ser CPF ou CNPJ.
      </p>
    </div>

    <div>
      <label class="block text-sm font-medium text-slate-700 dark:text-navy-200 mb-1">Telefone do remetente</label>
      <input
        v-model="form.senderPhone"
        type="text"
        placeholder="Telefone do remetente"
        class="form-input w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:hover:border-navy-400 dark:focus:border-accent"
      />
      <p class="text-xs text-slate-400 mt-1">
        Usado no campo from.phone quando o servico exigir.
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
  activate: [form: { clientId: string; clientSecret: string; sandbox: boolean; callbackBaseUrl: string; extraConfig: string }]
  disable: []
}>()

const form = reactive({
  clientId: '',
  clientSecret: '',
  sandbox: true,
  callbackBaseUrl: '',
  agency: '',
  senderDocument: '',
  senderPhone: '',
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
    form.agency = readAgency(c.extraConfig)
    form.senderDocument = readSenderDocument(c.extraConfig)
    form.senderPhone = readSenderPhone(c.extraConfig)
  }
}, { immediate: true })

function readAgency(extraConfig?: string | null) {
  if (!extraConfig) return ''
  try {
    const parsed = JSON.parse(extraConfig)
    const agency = parsed?.agency ?? parsed?.melhorenvio?.agency ?? parsed?.defaults?.agency ?? parsed?.defaults?.melhorenvio?.agency
    return agency == null ? '' : String(agency)
  } catch {
    return ''
  }
}

function readSenderDocument(extraConfig?: string | null) {
  if (!extraConfig) return ''
  try {
    const parsed = JSON.parse(extraConfig)
    return String(parsed?.senderDocument ?? parsed?.document ?? parsed?.from?.document ?? '')
  } catch {
    return ''
  }
}

function readSenderPhone(extraConfig?: string | null) {
  if (!extraConfig) return ''
  try {
    const parsed = JSON.parse(extraConfig)
    return String(parsed?.senderPhone ?? parsed?.phone ?? parsed?.from?.phone ?? '')
  } catch {
    return ''
  }
}

function buildExtraConfig() {
  const payload: Record<string, any> = {}
  const agency = Number(form.agency)
  if (Number.isFinite(agency) && agency > 0) {
    payload.agency = agency
  }
  if (form.senderDocument.trim()) {
    payload.senderDocument = form.senderDocument.trim()
  }
  if (form.senderPhone.trim()) {
    payload.senderPhone = form.senderPhone.trim()
  }
  return Object.keys(payload).length ? JSON.stringify(payload) : ''
}

function handleActivate() {
  emit('activate', {
    clientId: form.clientId,
    clientSecret: form.clientSecret,
    sandbox: form.sandbox,
    callbackBaseUrl: form.callbackBaseUrl,
    extraConfig: buildExtraConfig(),
  })
}
</script>
