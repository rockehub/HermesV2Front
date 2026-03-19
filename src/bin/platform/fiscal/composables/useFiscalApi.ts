import { $axios } from '@/helpers/integration/integration'

export type FiscalDocumentType = 'NF_E' | 'NF_CE' | 'CT_E' | 'NF_E_ENTRADA'
export type FiscalDocumentStatus = 'PENDING' | 'ISSUED' | 'FAILED' | 'CANCELLED'

export interface FiscalDocument {
  id: string
  type: FiscalDocumentType
  provider: string
  ref: string
  status: FiscalDocumentStatus
  chaveNfe?: string
  numero?: string
  serie?: string
  caminhoXml?: string
  caminhoDanfe?: string
  mensagem?: string
  orderId?: string
  deliveryId?: string
  emittedAt?: string
  cancelledAt?: string
  createdAt?: string
}

export interface FiscalListParams {
  type?: FiscalDocumentType
  status?: FiscalDocumentStatus
  page?: number
  size?: number
}

export interface EntradaItem {
  descricao: string
  ncm?: string
  cfop?: string
  quantidade: number
  valorUnitario: number
}

export interface EntradaRequest {
  cnpjFornecedor: string
  nomeFornecedor?: string
  chaveNfeOrigem?: string
  naturezaOperacao?: string
  itens: EntradaItem[]
  extra?: Record<string, unknown>
}

export interface CteRequest {
  modal?: string
  tomadorCnpj: string
  tomadorNome?: string
  valorPrestacao: number
  naturezaPrestacao?: string
  extra?: Record<string, unknown>
}

export function useFiscalApi() {
  const list = (params: FiscalListParams = {}) =>
    $axios.get<{ content: FiscalDocument[]; totalElements: number; totalPages: number }>(
      '/api/v1/admin/fiscal/documents',
      { params }
    )

  const getById = (id: string) =>
    $axios.get<FiscalDocument>(`/api/v1/admin/fiscal/documents/${id}`)

  const emitEntrada = (req: EntradaRequest) =>
    $axios.post<FiscalDocument>('/api/v1/admin/fiscal/documents/entrada', req)

  const emitCte = (req: CteRequest) =>
    $axios.post<FiscalDocument>('/api/v1/admin/fiscal/documents/cte', req)

  const cancel = (id: string, justificativa: string) =>
    $axios.delete<FiscalDocument>(`/api/v1/admin/fiscal/documents/${id}`, {
      data: { justificativa }
    })

  return { list, getById, emitEntrada, emitCte, cancel }
}
