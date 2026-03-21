<template>
  <div class="space-y-4">
    <div>
      <label class="block text-sm font-medium text-slate-700 dark:text-navy-200 mb-1">API Key</label>
      <input v-model="form.clientId" type="text" placeholder="Sua API Key da Lalamove"
        class="form-input w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:hover:border-navy-400 dark:focus:border-accent" />
    </div>

    <div>
      <label class="block text-sm font-medium text-slate-700 dark:text-navy-200 mb-1">API Secret</label>
      <input v-model="form.clientSecret" type="password" :placeholder="hasExistingSecret ? '????????????' : 'Seu API Secret'"
        class="form-input w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:hover:border-navy-400 dark:focus:border-accent" />
      <p v-if="hasExistingSecret && !form.clientSecret" class="text-xs text-slate-400 mt-1">Deixe em branco para manter o secret atual</p>
    </div>

    <div>
      <label class="block text-sm font-medium text-slate-700 dark:text-navy-200 mb-1">Callback Base URL</label>
      <input v-model="form.callbackBaseUrl" type="url" placeholder="https://sua-url-publica.com"
        class="form-input w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:hover:border-navy-400 dark:focus:border-accent" />
      <p class="text-xs text-slate-400 mt-1">Usada para registrar automaticamente o webhook em <code>/api/v1/public/webhooks/shipping</code>.</p>
    </div>

    <div>
      <label class="block text-sm font-medium text-slate-700 dark:text-navy-200 mb-1">Market</label>
      <input v-model="form.market" type="text" maxlength="8" placeholder="BR"
        class="form-input w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 uppercase placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:hover:border-navy-400 dark:focus:border-accent" />
      <p class="text-xs text-slate-400 mt-1">UN/LOCODE do mercado. Para Brasil, use <code>BR</code>.</p>
    </div>

    <div>
      <label class="block text-sm font-medium text-slate-700 dark:text-navy-200 mb-1">Language</label>
      <input v-model="form.language" type="text" placeholder="pt_BR"
        class="form-input w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:hover:border-navy-400 dark:focus:border-accent" />
    </div>

    <div class="rounded-lg border border-slate-200 dark:border-navy-700 p-4 space-y-4">
      <div class="flex items-center justify-between gap-3">
        <div>
          <div class="text-sm font-medium text-slate-700 dark:text-navy-200">Catalogo Lalamove</div>
          <p class="text-xs text-slate-400 mt-1">Carrega as cidades, servicos e special requests disponiveis direto da API.</p>
        </div>
        <button type="button" :disabled="loadingCatalog || !canLoadCatalog" class="btn btn-sm btn-outline" @click="loadCatalog">
          <em v-if="loadingCatalog" class="fa-solid fa-spinner fa-spin mr-1"></em>
          {{ loadingCatalog ? 'Carregando...' : 'Buscar catalogo' }}
        </button>
      </div>

      <p v-if="catalogError" class="text-xs text-rose-500">{{ catalogError }}</p>

      <div>
        <label class="block text-sm font-medium text-slate-700 dark:text-navy-200 mb-1">Cidade</label>
        <select v-model="selectedCityLocode"
          class="form-select w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:hover:border-navy-400 dark:focus:border-accent">
          <option value="">Selecione uma cidade</option>
          <option v-for="city in catalog.cities" :key="city.locode" :value="city.locode">
            {{ city.name }} ({{ city.locode }})
          </option>
        </select>
      </div>

      <div>
        <label class="block text-sm font-medium text-slate-700 dark:text-navy-200 mb-2">Tipos de servico</label>
        <div v-if="selectedCityServices.length" class="grid gap-2 max-h-72 overflow-auto pr-1">
          <label v-for="item in selectedCityServices" :key="item.code" class="flex items-start gap-3 rounded-lg border border-slate-200 dark:border-navy-700 px-3 py-2 cursor-pointer">
            <input v-model="selectedServiceTypes" :value="item.code" type="checkbox" class="mt-1 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary" />
            <div>
              <div class="text-sm text-slate-700 dark:text-navy-100">{{ item.code }}</div>
              <div v-if="item.label && item.label !== item.code" class="text-xs text-slate-400">{{ item.label }}</div>
            </div>
          </label>
        </div>
        <p v-else class="text-xs text-slate-400">Selecione uma cidade para ver os servicos disponiveis nela.</p>
      </div>

      <div>
        <label class="block text-sm font-medium text-slate-700 dark:text-navy-200 mb-2">Special requests</label>
        <div v-if="filteredSpecialRequests.length" class="grid gap-2 max-h-72 overflow-auto pr-1">
          <label v-for="request in filteredSpecialRequests" :key="request.name" class="flex items-start gap-3 rounded-lg border border-slate-200 dark:border-navy-700 px-3 py-2 cursor-pointer">
            <input v-model="selectedSpecialRequests" :value="request.name" type="checkbox" class="mt-1 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary" />
            <div>
              <div class="text-sm text-slate-700 dark:text-navy-100">{{ request.name }}</div>
              <div v-if="request.label && request.label !== request.name" class="text-xs text-slate-400">{{ request.label }}</div>
              <div v-if="request.parentType" class="text-[11px] text-slate-400">Grupo: {{ request.parentType }}</div>
            </div>
          </label>
        </div>
        <p v-else class="text-xs text-slate-400">Nenhum special request disponivel para os servicos selecionados nesta cidade.</p>
      </div>
    </div>

    <div>
      <label class="block text-sm font-medium text-slate-700 dark:text-navy-200 mb-1">Telefone do remetente</label>
      <input v-model="form.senderPhone" type="text" placeholder="Telefone usado no sender.phone"
        class="form-input w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:hover:border-navy-400 dark:focus:border-accent" />
    </div>

    <div>
      <label class="block text-sm font-medium text-slate-700 dark:text-navy-200 mb-1">Nome do remetente</label>
      <input v-model="form.senderName" type="text" placeholder="Opcional, fallback para o warehouse"
        class="form-input w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary dark:border-navy-450 dark:hover:border-navy-400 dark:focus:border-accent" />
    </div>

    <label class="flex items-center gap-3 text-sm text-slate-700 dark:text-navy-200">
      <input v-model="form.isPODEnabled" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary" />
      Habilitar POD por padrao
    </label>

    <div class="flex items-center gap-3">
      <button type="button" :class="['relative inline-flex h-6 w-11 items-center rounded-full transition-colors', form.sandbox ? 'bg-amber-400' : 'bg-slate-200 dark:bg-navy-600']" @click="form.sandbox = !form.sandbox">
        <span :class="['inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform', form.sandbox ? 'translate-x-6' : 'translate-x-1']" />
      </button>
      <span>{{ form.sandbox ? 'Homologacao (sandbox)' : 'Producao' }}</span>
    </div>

    <div class="flex items-center gap-3 pt-2">
      <button type="button" :disabled="saving || !isFormValid" class="btn btn-primary text-sm" @click="handleActivate">
        <em v-if="saving" class="fa-solid fa-spinner fa-spin mr-1"></em>
        {{ saving ? 'Salvando...' : 'Ativar Lalamove' }}
      </button>

      <button v-if="currentStatus === 'ACTIVE'" type="button" :disabled="saving" class="btn btn-error btn-outline text-sm" @click="emit('disable')">
        Desativar
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import {
  useProvidersApi,
  type ShippingProviderCatalogCity,
  type ShippingProviderCatalogResponse,
  type ShippingProviderCatalogServiceType,
  type ShippingProviderCatalogSpecialRequest,
  type ShippingProviderConfigResponse,
} from '../composables/useProvidersApi'

const props = defineProps<{
  config?: ShippingProviderConfigResponse | null
  saving?: boolean
}>()

const emit = defineEmits<{
  activate: [form: { clientId: string; clientSecret: string; sandbox: boolean; callbackBaseUrl: string; extraConfig: string }]
  disable: []
}>()

const api = useProvidersApi()

const form = reactive({
  clientId: '',
  clientSecret: '',
  sandbox: true,
  callbackBaseUrl: '',
  market: 'BR',
  language: 'pt_BR',
  senderPhone: '',
  senderName: '',
  isPODEnabled: true,
})

const catalog = reactive<ShippingProviderCatalogResponse>({
  cities: [],
  serviceTypes: [],
  specialRequests: [],
})
const selectedCityLocode = ref('')
const selectedServiceTypes = ref<string[]>([])
const selectedSpecialRequests = ref<string[]>([])
const loadingCatalog = ref(false)
const catalogError = ref('')

const currentStatus = computed(() => props.config?.status ?? 'NOT_CONFIGURED')
const hasExistingSecret = computed(() => !!props.config?.clientId)
const canLoadCatalog = computed(() =>
  form.clientId.trim().length > 0 &&
  (form.clientSecret.trim().length > 0 || hasExistingSecret.value) &&
  form.market.trim().length > 0
)
const selectedCity = computed(() => catalog.cities.find((item) => item.locode === selectedCityLocode.value) ?? null)
const selectedCityServices = computed(() => selectedCity.value?.serviceTypes ?? [])
const filteredSpecialRequests = computed(() => {
  const map = new Map<string, ShippingProviderCatalogSpecialRequest>()
  const services = selectedCityServices.value
  const selectedCodes = new Set(selectedServiceTypes.value)
  for (const service of services) {
    if (selectedCodes.size > 0 && !selectedCodes.has(service.code)) {
      continue
    }
    for (const request of service.specialRequests ?? []) {
      if (!map.has(request.name)) {
        map.set(request.name, request)
      }
    }
  }
  return Array.from(map.values())
})
const isFormValid = computed(() =>
  canLoadCatalog.value &&
  selectedCityLocode.value.trim().length > 0 &&
  selectedServiceTypes.value.length > 0
)

watch(() => props.config, (c) => {
  form.clientId = c?.clientId ?? ''
  form.clientSecret = ''
  form.sandbox = c?.sandbox ?? true
  form.callbackBaseUrl = c?.callbackBaseUrl ?? ''

  const extra = parseExtra(c?.extraConfig)
  form.market = String(extra.market ?? 'BR')
  form.language = String(extra.language ?? 'pt_BR')
  form.senderPhone = String(extra.senderPhone ?? '')
  form.senderName = String(extra.senderName ?? '')
  form.isPODEnabled = extra.isPODEnabled == null ? true : !!extra.isPODEnabled

  seedCatalog(extra)
  selectedCityLocode.value = String(extra.selectedCityLocode ?? extra.cityLocode ?? catalog.cities[0]?.locode ?? '')
  selectedServiceTypes.value = extractSelectedServiceTypes(extra)
  selectedSpecialRequests.value = extractSelectedSpecialRequests(extra)
  normalizeSelections()
}, { immediate: true })

watch(selectedCityLocode, () => {
  normalizeSelections()
})

watch(selectedServiceTypes, () => {
  const allowed = new Set(filteredSpecialRequests.value.map((item) => item.name))
  selectedSpecialRequests.value = selectedSpecialRequests.value.filter((item) => allowed.has(item))
}, { deep: true })

function parseExtra(extraConfig?: string | null) {
  if (!extraConfig) return {}
  try {
    return JSON.parse(extraConfig)
  } catch {
    return {}
  }
}

function seedCatalog(extra: any) {
  const cities = Array.isArray(extra.catalogCities)
    ? extra.catalogCities.map(mapCity).filter(Boolean)
    : []
  catalog.cities = cities as ShippingProviderCatalogCity[]
  catalog.serviceTypes = flattenServices(catalog.cities)
  catalog.specialRequests = flattenRequests(catalog.cities)
}

function mapCity(item: any) {
  const locode = String(item?.locode ?? '').trim()
  const name = String(item?.name ?? locode).trim()
  const serviceTypes = Array.isArray(item?.serviceTypes)
    ? item.serviceTypes.map(mapServiceType).filter(Boolean)
    : []
  if (!locode && !name && !serviceTypes.length) return null
  return { locode, name, serviceTypes }
}

function mapServiceType(item: any) {
  if (typeof item === 'string') {
    return { code: item, label: item, specialRequests: [] }
  }
  const code = String(item?.code ?? item?.serviceType ?? item?.key ?? '').trim()
  if (!code) return null
  const specialRequests = Array.isArray(item?.specialRequests)
    ? item.specialRequests.map(mapSpecialRequest).filter(Boolean)
    : []
  return {
    code,
    label: String(item?.label ?? item?.description ?? code),
    specialRequests,
  }
}

function mapSpecialRequest(item: any) {
  if (typeof item === 'string') {
    return { name: item, label: item }
  }
  const name = String(item?.name ?? '').trim()
  if (!name) return null
  return {
    name,
    label: String(item?.label ?? item?.description ?? name),
    parentType: item?.parentType ?? item?.parent_type ?? null,
    maxSelection: typeof item?.maxSelection === 'number' ? item.maxSelection : (typeof item?.max_selection === 'number' ? item.max_selection : null),
  }
}

function flattenServices(cities: ShippingProviderCatalogCity[]) {
  const map = new Map<string, ShippingProviderCatalogServiceType>()
  for (const city of cities) {
    for (const service of city.serviceTypes) {
      if (!map.has(service.code)) {
        map.set(service.code, service)
      }
    }
  }
  return Array.from(map.values())
}

function flattenRequests(cities: ShippingProviderCatalogCity[]) {
  const map = new Map<string, ShippingProviderCatalogSpecialRequest>()
  for (const city of cities) {
    for (const service of city.serviceTypes) {
      for (const request of service.specialRequests ?? []) {
        if (!map.has(request.name)) {
          map.set(request.name, request)
        }
      }
    }
  }
  return Array.from(map.values())
}

function extractSelectedServiceTypes(extra: any) {
  if (!Array.isArray(extra.serviceTypes)) return []
  return extra.serviceTypes
    .map((item: any) => typeof item === 'string' ? item : item?.code ?? item?.serviceType ?? item?.key ?? '')
    .map((item: string) => String(item).trim())
    .filter(Boolean)
}

function extractSelectedSpecialRequests(extra: any) {
  if (!Array.isArray(extra.specialRequests)) return []
  return extra.specialRequests
    .map((item: any) => typeof item === 'string' ? item : item?.name ?? '')
    .map((item: string) => String(item).trim())
    .filter(Boolean)
}

function normalizeSelections() {
  if (!selectedCityLocode.value && catalog.cities.length) {
    selectedCityLocode.value = catalog.cities[0].locode
  }
  const availableServiceCodes = new Set(selectedCityServices.value.map((item) => item.code))
  selectedServiceTypes.value = selectedServiceTypes.value.filter((code) => availableServiceCodes.has(code))
  if (!selectedServiceTypes.value.length && selectedCityServices.value.length) {
    selectedServiceTypes.value = selectedCityServices.value.map((item) => item.code)
  }
  const allowedRequestNames = new Set(filteredSpecialRequests.value.map((item) => item.name))
  selectedSpecialRequests.value = selectedSpecialRequests.value.filter((name) => allowedRequestNames.has(name))
}

function buildExtraConfig() {
  const serviceMap = new Map(selectedCityServices.value.map((item) => [item.code, item]))
  const requestMap = new Map(filteredSpecialRequests.value.map((item) => [item.name, item]))
  return JSON.stringify({
    market: form.market.trim().toUpperCase(),
    language: form.language.trim() || 'pt_BR',
    selectedCityLocode: selectedCityLocode.value || undefined,
    catalogCities: catalog.cities,
    serviceTypes: selectedServiceTypes.value.map((code) => {
      const meta = serviceMap.get(code)
      return {
        code,
        label: meta?.label ?? code,
        specialRequests: (meta?.specialRequests ?? []).map((item) => ({
          name: item.name,
          label: item.label,
          parentType: item.parentType ?? undefined,
          maxSelection: item.maxSelection ?? undefined,
        })),
      }
    }),
    specialRequests: selectedSpecialRequests.value.map((name) => {
      const meta = requestMap.get(name)
      return {
        name,
        label: meta?.label ?? name,
        parentType: meta?.parentType ?? undefined,
        maxSelection: meta?.maxSelection ?? undefined,
      }
    }),
    senderPhone: form.senderPhone.trim() || undefined,
    senderName: form.senderName.trim() || undefined,
    isPODEnabled: form.isPODEnabled,
  })
}

async function loadCatalog() {
  if (!canLoadCatalog.value) return
  loadingCatalog.value = true
  catalogError.value = ''
  try {
    const response = await api.previewShippingProviderCatalog('lalamove', {
      clientId: form.clientId.trim(),
      clientSecret: form.clientSecret.trim(),
      sandbox: form.sandbox,
      callbackBaseUrl: form.callbackBaseUrl.trim(),
      extraConfig: buildExtraConfig(),
    })
    catalog.cities = response.data.cities ?? []
    catalog.serviceTypes = response.data.serviceTypes ?? []
    catalog.specialRequests = response.data.specialRequests ?? []
    if (!selectedCityLocode.value || !catalog.cities.some((item) => item.locode === selectedCityLocode.value)) {
      selectedCityLocode.value = catalog.cities[0]?.locode ?? ''
    }
    normalizeSelections()
  } catch (error: any) {
    catalogError.value = error?.response?.data?.message ?? 'Nao foi possivel carregar o catalogo da Lalamove'
  } finally {
    loadingCatalog.value = false
  }
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
