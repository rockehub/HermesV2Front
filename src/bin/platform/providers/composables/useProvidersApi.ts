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
}

export interface ShippingProviderConfigRequest {
  clientId: string
  clientSecret: string
  sandbox: boolean
  callbackBaseUrl?: string
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
    activateShippingProvider,
    disableShippingProvider,
    getMelhorEnvioStatus,
    listFiscalProviders,
    getFiscalProvider,
    activateFiscalProvider,
    disableFiscalProvider,
  }
}
