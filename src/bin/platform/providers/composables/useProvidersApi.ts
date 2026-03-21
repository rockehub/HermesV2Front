import { $axios } from '@/helpers/integration/integration'

export interface FiscalProviderConfigResponse {
  id?: string
  provider: string
  status: string
  sandbox: boolean
  hasToken: boolean
  extraConfig?: string
}

export interface FiscalProviderConfigRequest {
  token: string
  sandbox: boolean
  extraConfig: string
}

export interface ShippingProviderConfigResponse {
  id?: string
  provider: string
  status: string
  sandbox: boolean
  callbackBaseUrl?: string
  hasToken: boolean
  tokenExpiresAt?: string
  clientId?: string
  extraConfig?: string
}

export interface ShippingProviderConfigRequest {
  clientId: string
  clientSecret: string
  sandbox: boolean
  callbackBaseUrl?: string
  extraConfig?: string
}

export interface ShippingProviderCatalogSpecialRequest {
  name: string
  label: string
  parentType?: string | null
  maxSelection?: number | null
}

export interface ShippingProviderCatalogServiceType {
  code: string
  label: string
  specialRequests?: ShippingProviderCatalogSpecialRequest[]
}

export interface ShippingProviderCatalogCity {
  locode: string
  name: string
  serviceTypes: ShippingProviderCatalogServiceType[]
}

export interface ShippingProviderCatalogResponse {
  cities: ShippingProviderCatalogCity[]
  serviceTypes: ShippingProviderCatalogServiceType[]
  specialRequests: ShippingProviderCatalogSpecialRequest[]
}

export interface ActivationResult {
  status: string
  authorizationUrl?: string
}

export function useProvidersApi() {
  const listShippingProviders = () =>
    $axios.get<ShippingProviderConfigResponse[]>('/api/v1/admin/providers/shipping')

  const getShippingProvider = (provider: string) =>
    $axios.get<ShippingProviderConfigResponse>(`/api/v1/admin/providers/shipping/${provider}`)

  const previewShippingProviderCatalog = (provider: string, config: ShippingProviderConfigRequest) =>
    $axios.post<ShippingProviderCatalogResponse>(`/api/v1/admin/providers/shipping/${provider}/catalog`, config)

  const activateShippingProvider = (provider: string, config: ShippingProviderConfigRequest) =>
    $axios.put<ActivationResult>(`/api/v1/admin/providers/shipping/${provider}/activate`, config)

  const disableShippingProvider = (provider: string) =>
    $axios.delete(`/api/v1/admin/providers/shipping/${provider}`)

  const getMelhorEnvioStatus = () =>
    $axios.get('/api/v1/admin/providers/shipping/melhorenvio/status')

  const listFiscalProviders = () =>
    $axios.get<FiscalProviderConfigResponse[]>('/api/v1/admin/providers/fiscal')

  const getFiscalProvider = (provider: string) =>
    $axios.get<FiscalProviderConfigResponse>(`/api/v1/admin/providers/fiscal/${provider}`)

  const activateFiscalProvider = (provider: string, config: FiscalProviderConfigRequest) =>
    $axios.put<FiscalProviderConfigResponse>(`/api/v1/admin/providers/fiscal/${provider}/activate`, config)

  const disableFiscalProvider = (provider: string) =>
    $axios.delete(`/api/v1/admin/providers/fiscal/${provider}`)

  return {
    listShippingProviders,
    getShippingProvider,
    previewShippingProviderCatalog,
    activateShippingProvider,
    disableShippingProvider,
    getMelhorEnvioStatus,
    listFiscalProviders,
    getFiscalProvider,
    activateFiscalProvider,
    disableFiscalProvider,
  }
}
