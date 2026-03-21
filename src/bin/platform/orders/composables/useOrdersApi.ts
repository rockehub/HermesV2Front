import { $axios } from '@/helpers/integration/integration'

const BASE = '/api/v1/admin/orders'

export interface OrderHeaderBlock {
  statusCode: string
  statusLabel: string
  statusTone: string
  totalInCents: number
  customerName: string
  customerTags: string[]
  createdAt: string | null
  createdAtRelative: string | null
  channelCode: string | null
  channelLabel: string | null
}

export interface OrderInsight {
  code: string
  label: string
  tone: string
}

export interface OrderCustomerSummary {
  id: string | null
  name: string
  documentType: string | null
  ordersLast30Days: number
  averageTicketInCents: number | null
  lastPurchaseAt: string | null
  tags: string[]
}

export interface OrderFinanceSummary {
  totalInCents: number | null
  paymentStatusCode: string | null
  paymentStatusLabel: string | null
  paymentMethodName: string | null
}

export interface OrderListItem {
  id: string
  number: number
  header: OrderHeaderBlock
  customer: OrderCustomerSummary
  finance: OrderFinanceSummary
  insights: OrderInsight[]
}

export interface OrderCustomerDetail {
  id: string | null
  name: string
  email: string | null
  phone: string | null
  document: string | null
  documentType: string | null
  totalOrders: number | null
  ordersLast30Days: number
  averageTicketInCents: number | null
  lastPurchaseAt: string | null
  customerSince: string | null
  tags: string[]
}

export interface OrderDeliveryBlock {
  id: string | null
  statusCode: string
  statusLabel: string
  shippingType: string
  shippingLabel: string
  addressLabel: string | null
  estimatedAt: string | null
  warehouseName: string | null
  vendorName: string | null
  shippingPriceInCents: number | null
}

export interface OrderProductItem {
  id: string
  name: string
  variantName: string | null
  variationSummary: string | null
  quantity: number | null
  unitPriceInCents: number | null
  subtotalInCents: number | null
  tags: string[]
  imageUrl: string | null
}

export interface OrderProductGroup {
  groupKey: string
  title: string
  items: OrderProductItem[]
}

export interface OrderFinanceDetail {
  subtotalInCents: number | null
  discountsInCents: number | null
  shippingInCents: number | null
  totalInCents: number | null
  paymentMethodName: string | null
  paymentStatusCode: string | null
  paymentStatusLabel: string | null
}

export interface OrderPoints {
  accumulated: number
  available: number
  possibleRedeem: number
}

export interface OrderTimelineEvent {
  code: string
  label: string
  happenedAt: string | null
  description: string | null
}

export interface OrderDetail {
  id: string
  number: number
  header: OrderHeaderBlock
  customer: OrderCustomerDetail
  deliveries: OrderDeliveryBlock[]
  productGroups: OrderProductGroup[]
  finance: OrderFinanceDetail
  points: OrderPoints
  insights: OrderInsight[]
  timeline: OrderTimelineEvent[]
}

export interface DeliveryStatusOption {
  code: string
  label: string
}

export interface DeliveryItemSummary {
  id: string
  name: string
  quantity: number | null
}

export interface OrderDeliveryAdmin {
  id: string
  title: string
  statusCode: string
  statusLabel: string
  shippingType: string
  shippingLabel: string
  addressLabel: string | null
  warehouseName: string | null
  vendorName: string | null
  provider: string | null
  trackingNumber: string | null
  trackingUrl: string | null
  shareLink: string | null
  labelUrl: string | null
  providerStatus: string | null
  providerStatusDetail: string | null
  externalReference: string | null
  pickupReference: string | null
  driverId: string | null
  driverName: string | null
  driverPhone: string | null
  driverPlateNumber: string | null
  selectedShippingName: string | null
  selectedShippingProvider: string | null
  selectedShippingCode: string | null
  shippingPriceInCents: number | null
  selectedDeliveryDate: string | null
  deliveryEstimateAt: string | null
  quotedDeliveryAt: string | null
  promisedDeliveryAt: string | null
  sentAt: string | null
  deliveredAt: string | null
  confirmed: boolean
  nfeState: string | null
  nfeRef: string | null
  nfeDocumentType: string | null
  review: string | null
  items: DeliveryItemSummary[]
}

export interface OrderDeliveriesDetail {
  orderId: string
  orderNumber: number
  customerName: string
  orderStatusCode: string
  orderStatusLabel: string
  trackingNumber: string | null
  trackingUrl: string | null
  statusOptions: DeliveryStatusOption[]
  deliveries: OrderDeliveryAdmin[]
}

export interface UpdateDeliveryStatusPayload {
  statusCode: string
  happenedAt?: string | null
  review?: string | null
}

export interface DeliveryShippingActionDefinition {
  code: string
  label: string
  enabled: boolean
  description: string | null
}

export interface DeliveryShippingActionHistoryItem {
  id: string
  provider: string
  actionType: string
  status: string
  externalRef: string | null
  errorMessage: string | null
  executedAt: string | null
  finishedAt: string | null
  requestPayload: string | null
  responsePayload: string | null
}

export interface DeliveryShippingActionsDetail {
  orderId: string
  deliveryId: string
  provider: string | null
  deliveryStatusCode: string
  providerStatus: string | null
  trackingNumber: string | null
  trackingUrl: string | null
  shareLink: string | null
  labelUrl: string | null
  providerStatusDetail: string | null
  externalReference: string | null
  pickupReference: string | null
  driverId: string | null
  driverName: string | null
  driverPhone: string | null
  driverPlateNumber: string | null
  actions: DeliveryShippingActionDefinition[]
  history: DeliveryShippingActionHistoryItem[]
}

export interface ExecuteDeliveryShippingActionPayload {
  idempotencyKey?: string | null
  payload?: Record<string, any> | null
}

export interface PageResponse<T> {
  content: T[]
  number: number
  size: number
  totalElements: number
  totalPages: number
}

export const useOrdersApi = () => {
  const listOrders = (params: { page?: number; size?: number; q?: string; status?: string; channel?: string }) =>
    $axios.get<{ data: PageResponse<OrderListItem> }>(BASE, { params })

  const getOrder = (orderId: string) =>
    $axios.get<{ data: OrderDetail }>(`${BASE}/${orderId}`)

  const getOrderDeliveries = (orderId: string) =>
    $axios.get<{ data: OrderDeliveriesDetail }>(`${BASE}/${orderId}/deliveries`)

  const updateDeliveryStatus = (orderId: string, deliveryId: string, payload: UpdateDeliveryStatusPayload) =>
    $axios.patch<{ data: OrderDeliveryAdmin }>(`${BASE}/${orderId}/deliveries/${deliveryId}/status`, payload)

  const getDeliveryShippingActions = (orderId: string, deliveryId: string) =>
    $axios.get<{ data: DeliveryShippingActionsDetail }>(`${BASE}/${orderId}/deliveries/${deliveryId}/shipping-actions`)

  const executeDeliveryShippingAction = (
    orderId: string,
    deliveryId: string,
    actionType: string,
    payload?: ExecuteDeliveryShippingActionPayload
  ) => $axios.post<{ data: DeliveryShippingActionsDetail }>(`${BASE}/${orderId}/deliveries/${deliveryId}/shipping-actions/${actionType}`, payload ?? {})

  return {
    listOrders,
    getOrder,
    getOrderDeliveries,
    updateDeliveryStatus,
    getDeliveryShippingActions,
    executeDeliveryShippingAction,
  }
}
