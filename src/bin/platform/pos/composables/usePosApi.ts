import { $axios } from '@/helpers/integration/integration'

const BASE = '/api/v1/admin/pos'

export interface PosPayment {
  methodCode: string   // code sent to backend (e.g. "pix")
  methodName: string   // display name (e.g. "PIX")
  amountInCents: number
}

export interface PosAddItemRequest {
  productId: string
  variantId?: string | null
  quantity: number
  unitPriceOverride?: number | null
}

export interface PosUpdateItemRequest {
  quantity: number
  unitPriceOverride?: number | null
}

export interface PosBillingAddressRequest {
  name: string
  street: string
  number: string
  complement?: string | null
  district: string
  city: string
  zip: string
  company?: string | null
  document?: string | null
  uf?: string | null
}

export interface PosCheckoutRequest {
  customerId?: string | null
  adminNotes?: string | null
  payments: PosPayment[]
  paymentMethodId: string
  billingAddress: PosBillingAddressRequest
  discountCode?: string | null
  /** Quando true, emite NF-Ce para esta venda (PDV presencial) */
  nfce?: boolean | null
}

export interface PosCustomerRequest {
  name: string
  surname?: string | null
  email: string
  document?: string | null
  phone?: string | null
  companyName?: string | null
  inscricaoEstadual?: string | null
  indIEDest: number   // 1=contribuinte, 2=isento, 9=não contribuinte
}

export interface PosShippingAddressRequest {
  name: string
  street: string
  number: string
  complement?: string | null
  district: string
  city: string
  zip: string
  company?: string | null
  uf?: string | null
}

export interface ShippingOptionItem {
  provider: string
  serviceCode: string
  name: string
  company?: string | null
  priceInCents: number
  deliveryDays: number
  error?: string | null
  providerData?: string | null
}

export interface DeliveryShippingOptionsSplit {
  deliveryId: string | null
  warehouseId: string | null   // null = UNASSIGNED_KEY (00000000-0000-0000-0000-000000000000)
  warehouseName: string | null
  fromCep: string | null
  itemCount: number
  selectedProvider: string | null
  selectedServiceCode: string | null
  selectedDate?: string | null
  quotedDateToDelivery?: string | null
  deliveryIn?: string | null
  options: ShippingOptionItem[]
}

export interface SetDeliveryShippingRequest {
  provider: string
  serviceCode: string
  name: string
  company?: string | null
  priceInCents: number
  deliveryDays: number
  selectedDate?: string | null
  providerData?: string | null
}

export const usePosApi = () => {
  // Shipping
  const setShippingAddress = (cartId: string, req: PosShippingAddressRequest) =>
    $axios.post(`${BASE}/cart/${cartId}/shipping-address`, req)

  const getShippingMethods = (cartId: string) =>
    $axios.get(`${BASE}/cart/${cartId}/shipping-methods`)

  const setShippingMethod = (cartId: string, shippingMethodId: string | null) =>
    $axios.patch(`${BASE}/cart/${cartId}/shipping-method`, { shippingMethodId })

  const getCustomerAddresses = (cartId: string) =>
    $axios.get(`${BASE}/cart/${cartId}/customer/addresses`)

  const updateCustomerAddress = (cartId: string, addressId: string, req: PosShippingAddressRequest) =>
    $axios.patch(`${BASE}/cart/${cartId}/customer/addresses/${addressId}`, req)

  const getCustomerBillingAddress = (cartId: string) =>
    $axios.get(`${BASE}/cart/${cartId}/customer/billing-address`)

  const saveCustomerBillingAddress = (cartId: string, req: PosBillingAddressRequest) =>
    $axios.post(`${BASE}/cart/${cartId}/customer/billing-address`, req)

  const selectCustomerAddress = (cartId: string, addressId: string) =>
    $axios.post(`${BASE}/cart/${cartId}/shipping-address/from-customer`, { addressId })

  const listDeliveryShippingOptions = (cartId: string) =>
    $axios.get<{ data: DeliveryShippingOptionsSplit[] }>(`${BASE}/cart/${cartId}/delivery-shipping-options`)

  const setDeliveryShipping = (cartId: string, deliveryId: string, req: SetDeliveryShippingRequest) =>
    $axios.patch(`${BASE}/cart/${cartId}/deliveries/${deliveryId}/shipping`, req)

  // Cart
  const createCart = () =>
    $axios.post(`${BASE}/cart`)

  const getCart = (cartId: string) =>
    $axios.get(`${BASE}/cart/${cartId}`)

  const addItem = (cartId: string, req: PosAddItemRequest) =>
    $axios.post(`${BASE}/cart/${cartId}/items`, req)

  const updateItem = (cartId: string, entryId: string, req: PosUpdateItemRequest) =>
    $axios.patch(`${BASE}/cart/${cartId}/items/${entryId}`, req)

  const removeItem = (cartId: string, entryId: string) =>
    $axios.delete(`${BASE}/cart/${cartId}/items/${entryId}`)

  const setCustomer = (cartId: string, customerId: string) =>
    $axios.patch(`${BASE}/cart/${cartId}/customer`, { customerId })

  const applyDiscount = (cartId: string, code: string) =>
    $axios.patch(`${BASE}/cart/${cartId}/discount`, { code })

  const removeDiscount = (cartId: string, code: string) =>
    $axios.delete(`${BASE}/cart/${cartId}/discount`, { params: { code } })

  const checkout = (cartId: string, req: PosCheckoutRequest) =>
    $axios.post(`${BASE}/cart/${cartId}/checkout`, req)

  // Orders
  const listOrders = (page = 0, size = 20) =>
    $axios.get(`${BASE}/orders`, { params: { page, size } })

  const getOrder = (orderId: string) =>
    $axios.get(`${BASE}/orders/${orderId}`)

  const cancelOrder = (orderId: string, reason: string) =>
    $axios.patch(`${BASE}/orders/${orderId}/cancel`, { reason })

  // Customers
  const searchCustomers = (q: string) =>
    $axios.get(`${BASE}/customers`, { params: { q } })

  const createCustomer = (req: PosCustomerRequest) =>
    $axios.post(`${BASE}/customers`, req)

  // Payment methods
  const listPaymentMethods = () =>
    $axios.get(`${BASE}/payment-methods`)

  // Products (Elasticsearch)
  const searchProducts = (q: string, params?: Record<string, any>) =>
    $axios.get('/api/v1/commerce/products/search', {
      params: { q, inStock: true, size: 20, ...params }
    })

  // Reports
  const reportSummary = (from?: string, to?: string) =>
    $axios.get(`${BASE}/reports/summary`, { params: { from, to } })

  return {
    setShippingAddress,
    getShippingMethods,
    setShippingMethod,
    getCustomerAddresses,
    updateCustomerAddress,
    getCustomerBillingAddress,
    saveCustomerBillingAddress,
    selectCustomerAddress,
    listDeliveryShippingOptions,
    setDeliveryShipping,
    createCart,
    getCart,
    addItem,
    updateItem,
    removeItem,
    setCustomer,
    applyDiscount,
    removeDiscount,
    checkout,
    listOrders,
    getOrder,
    cancelOrder,
    searchCustomers,
    createCustomer,
    listPaymentMethods,
    searchProducts,
    reportSummary
  }
}
