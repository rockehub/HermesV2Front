import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  usePosApi,
  type PosPayment,
  type PosBillingAddressRequest,
  type PosShippingAddressRequest,
  type DeliveryShippingOptionsSplit,
  type SetDeliveryShippingRequest
} from '../composables/usePosApi'

export interface PosLine {
  id: string
  productId: string
  variantId?: string | null
  name: string
  variantName?: string | null
  propertiesDescription?: string | null
  quantity: number
  price: number
  pricePostTaxes: number
  totalPostTaxes: number
}

export interface PosProductVariant {
  id: string
  name: string
  optionValues?: Record<string, string>
  price: number
  inStock: boolean
  available: boolean
  stock: number
}

export interface PosSearchProduct {
  id: string
  name: string
  price: number
  inStock: boolean
  hasVariants?: boolean
  requiresVariantSelection?: boolean
  variants?: PosProductVariant[]
}

export interface PosShippingAddress {
  id: string
  name?: string | null
  street?: string | null
  number?: string | null
  complement?: string | null
  district?: string | null
  city?: string | null
  zip?: string | null
  latitude?: number | null
  longitude?: number | null
}

export interface PosCart {
  cartId: string
  customerId?: string | null
  entriesCount: number
  lines: PosLine[]
  totalPostTaxes: number
  totalDiscounts: number
  productGrossTotal: number
  productTotal: number
  appliedDiscounts: any[]
  shippingMethodId?: string | null
  shippingMethodName?: string | null
  shippingTotal?: number
  shippingAddress?: PosShippingAddress | null
}

export interface PosCustomer {
  id: string
  name: string
  surname: string
  email: string
  document?: string | null
  phone?: string | null
}

export const usePosStore = defineStore('pos', () => {
  const api = usePosApi()

  const cartId = ref<string | null>(null)
  const cart = ref<PosCart | null>(null)
  const customer = ref<PosCustomer | null>(null)
  const payments = ref<PosPayment[]>([])
  const isLoading = ref(false)
  const isCheckingOut = ref(false)
  const lastOrder = ref<any | null>(null)
  const error = ref<string | null>(null)
  const deliveryMode = ref<'pickup' | 'delivery'>('delivery')
  const shippingMethods = ref<any[]>([])
  const deliveryShippingOptions = ref<DeliveryShippingOptionsSplit[]>([])
  const customerAddresses = ref<any[]>([])

  // Computed
  const cartTotal = computed(() => cart.value?.totalPostTaxes ?? 0)
  const paid = computed(() => payments.value.reduce((s, p) => s + p.amountInCents, 0))
  const remaining = computed(() => cartTotal.value - paid.value)
  const change = computed(() => Math.max(0, paid.value - cartTotal.value))
  const canCheckout = computed(
    () => (cart.value?.entriesCount ?? 0) > 0 && remaining.value <= 0
  )
  const hasItems = computed(() => (cart.value?.entriesCount ?? 0) > 0)

  function deliverySplitKey(split: DeliveryShippingOptionsSplit, index = -1): string {
    return split.deliveryId ?? `${split.warehouseId ?? 'unassigned'}-${index}`
  }

  function optionItemKey(option: { provider: string; serviceCode: string }): string {
    return `${option.provider}-${option.serviceCode}`
  }

  function mapDeliveryShippingOptions(
    data: DeliveryShippingOptionsSplit[] = [],
    previousSplits: DeliveryShippingOptionsSplit[] = []
  ): DeliveryShippingOptionsSplit[] {
    const previousSplitOrder = new Map(previousSplits.map((split, index) => [deliverySplitKey(split, index), index]))
    const previousOptionOrders = new Map(
      previousSplits.map((split, splitIndex) => [
        deliverySplitKey(split, splitIndex),
        new Map((split.options ?? []).map((option, optionIndex) => [optionItemKey(option), optionIndex]))
      ])
    )

    const rawSplits = (data ?? []).map((split, splitIndex) => {
      const splitKey = deliverySplitKey(split, splitIndex)
      const previousOptionOrder = previousOptionOrders.get(splitKey)
      const options = [...(split.options ?? [])].sort((a, b) => {
        const aIndex = previousOptionOrder?.get(optionItemKey(a))
        const bIndex = previousOptionOrder?.get(optionItemKey(b))
        if (aIndex != null && bIndex != null) return aIndex - bIndex
        if (aIndex != null) return -1
        if (bIndex != null) return 1
        return optionItemKey(a).localeCompare(optionItemKey(b))
      })
      return { ...split, options }
    })

    return rawSplits.sort((a, b) => {
      const aKey = deliverySplitKey(a)
      const bKey = deliverySplitKey(b)
      const aIndex = previousSplitOrder.get(aKey)
      const bIndex = previousSplitOrder.get(bKey)
      if (aIndex != null && bIndex != null) return aIndex - bIndex
      if (aIndex != null) return -1
      if (bIndex != null) return 1
      return aKey.localeCompare(bKey)
    })
  }

  function mapCart(data: any, previousLines: PosLine[] = []): PosCart {
    const rawLines: PosLine[] = (data.lines ?? []).map((l: any) => ({
      id: l.entryId ?? l.id,
      productId: l.productId,
      variantId: l.variantId,
      name: l.name,
      variantName: l.variantName,
      propertiesDescription: l.propertiesDescription,
      quantity: l.quantity,
      price: l.unitPrice,
      pricePostTaxes: l.unitPostTaxes,
      totalPostTaxes: l.totalPostTaxes
    }))
    const previousOrder = new Map(previousLines.map((line, index) => [line.id, index]))
    const lines = rawLines.slice().sort((a, b) => {
      const aIndex = previousOrder.get(a.id)
      const bIndex = previousOrder.get(b.id)
      if (aIndex != null && bIndex != null) return aIndex - bIndex
      if (aIndex != null) return -1
      if (bIndex != null) return 1
      return a.id.localeCompare(b.id)
    })

    return {
      cartId: data.cartId,
      customerId: data.customerId,
      entriesCount: data.entriesCount,
      lines,
      totalPostTaxes: Number(data.totalPostTaxes ?? 0),
      totalDiscounts: Number(data.totalDiscounts ?? 0),
      productGrossTotal: Number(data.productGrossTotal ?? 0),
      productTotal: Number(data.productTotal ?? 0),
      appliedDiscounts: data.appliedDiscounts ?? [],
      shippingMethodId: data.shippingMethodId ?? null,
      shippingMethodName: data.shippingMethodName ?? null,
      shippingTotal: Number(data.shippingTotal ?? 0),
      shippingAddress: data.shippingAddress
        ? {
            id: data.shippingAddress.id,
            name: data.shippingAddress.name,
            street: data.shippingAddress.street,
            number: data.shippingAddress.number,
            complement: data.shippingAddress.complement,
            district: data.shippingAddress.district,
            city: data.shippingAddress.city,
            zip: data.shippingAddress.zip,
            latitude: data.shippingAddress.latitude ?? null,
            longitude: data.shippingAddress.longitude ?? null
          }
        : null
    }
  }

  async function init() {
    if (cartId.value) {
      try {
        const res = await api.getCart(cartId.value)
        cart.value = mapCart(res.data.data, cart.value?.lines ?? [])
      } catch {
        // Cart may have been cleared after checkout — create a new one
        await newSale()
      }
      return
    }
    await newSale()
  }

  async function newSale() {
    payments.value = []
    customer.value = null
    lastOrder.value = null
    error.value = null
    deliveryMode.value = 'delivery'
    shippingMethods.value = []
    deliveryShippingOptions.value = []
    customerAddresses.value = []
    try {
      isLoading.value = true
      const res = await api.createCart()
      cartId.value = res.data.data.cartId
      cart.value = mapCart(res.data.data, cart.value?.lines ?? [])
    } finally {
      isLoading.value = false
    }
  }

  async function addItem(productId: string, variantId?: string | null, quantity = 1, unitPriceOverride?: number | null) {
    if (!cartId.value) await newSale()
    try {
      isLoading.value = true
      const res = await api.addItem(cartId.value!, { productId, variantId, quantity, unitPriceOverride })
      cart.value = mapCart(res.data.data, cart.value?.lines ?? [])
    } catch (e: any) {
      error.value = e?.response?.data?.message ?? 'Erro ao adicionar item'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  async function updateItem(entryId: string, quantity: number, unitPriceOverride?: number | null) {
    if (!cartId.value) return
    try {
      isLoading.value = true
      const res = await api.updateItem(cartId.value, entryId, { quantity, unitPriceOverride })
      cart.value = mapCart(res.data.data, cart.value?.lines ?? [])
    } finally {
      isLoading.value = false
    }
  }

  async function removeItem(entryId: string) {
    if (!cartId.value) return
    try {
      isLoading.value = true
      const res = await api.removeItem(cartId.value, entryId)
      cart.value = mapCart(res.data.data, cart.value?.lines ?? [])
    } finally {
      isLoading.value = false
    }
  }

  async function setCustomer(c: PosCustomer) {
    if (!cartId.value) return
    customer.value = c
    try {
      const res = await api.setCustomer(cartId.value, c.id)
      cart.value = mapCart(res.data.data, cart.value?.lines ?? [])
    } catch {
      // non-critical — customer is stored locally even if backend fails
    }
  }

  async function applyDiscountCode(code: string) {
    if (!cartId.value) return
    const res = await api.applyDiscount(cartId.value, code)
    cart.value = mapCart(res.data.data, cart.value?.lines ?? [])
  }

  async function setShippingAddress(req: PosShippingAddressRequest) {
    if (!cartId.value) return
    const res = await api.setShippingAddress(cartId.value, req)
    cart.value = mapCart(res.data.data, cart.value?.lines ?? [])
    // Load per-split options after address is confirmed
    await loadDeliveryShippingOptions()
  }

  async function loadShippingMethods() {
    if (!cartId.value) return
    try {
      const res = await api.getShippingMethods(cartId.value)
      shippingMethods.value = res.data.data ?? []
    } catch {
      shippingMethods.value = []
    }
  }

  async function loadDeliveryShippingOptions() {
    if (!cartId.value) return
    try {
      const res = await api.listDeliveryShippingOptions(cartId.value)
      deliveryShippingOptions.value = mapDeliveryShippingOptions(res.data.data ?? [], deliveryShippingOptions.value)
    } catch {
      deliveryShippingOptions.value = []
    }
  }

  async function setDeliveryShipping(deliveryId: string, req: SetDeliveryShippingRequest) {
    if (!cartId.value) return
    const res = await api.setDeliveryShipping(cartId.value, deliveryId, req)
    cart.value = mapCart(res.data.data, cart.value?.lines ?? [])
    // Refresh options so selectedProvider/selectedServiceCode update
    await loadDeliveryShippingOptions()
  }

  async function loadCustomerAddresses() {
    if (!cartId.value) return
    try {
      const res = await api.getCustomerAddresses(cartId.value)
      customerAddresses.value = res.data.data ?? []
    } catch {
      customerAddresses.value = []
    }
  }

  async function selectCustomerAddress(addressId: string) {
    if (!cartId.value) return
    const res = await api.selectCustomerAddress(cartId.value, addressId)
    cart.value = mapCart(res.data.data, cart.value?.lines ?? [])
    await loadDeliveryShippingOptions()
  }

  async function setShippingMethod(methodId: string | null) {
    if (!cartId.value) return
    const res = await api.setShippingMethod(cartId.value, methodId)
    cart.value = mapCart(res.data.data, cart.value?.lines ?? [])
  }

  function addPayment(methodCode: string, methodName: string, amountInCents: number) {
    payments.value.push({ methodCode, methodName, amountInCents })
  }

  function removePayment(index: number) {
    payments.value.splice(index, 1)
  }

  async function finalizeSale(paymentMethodId: string, billingAddress: PosBillingAddressRequest, adminNotes?: string, nfce?: boolean) {
    if (!cartId.value || !canCheckout.value) return
    try {
      isCheckingOut.value = true
      const res = await api.checkout(cartId.value, {
        customerId: customer.value?.id ?? null,
        adminNotes: adminNotes ?? null,
        payments: payments.value.map(p => ({
          methodCode: p.methodCode,
          methodName: p.methodName,
          amountInCents: p.amountInCents
        })),
        paymentMethodId,
        billingAddress,
        nfce: nfce ?? null
      })
      lastOrder.value = res.data.data
      cartId.value = null
      cart.value = null
      payments.value = []
      customer.value = null
    } finally {
      isCheckingOut.value = false
    }
    // Auto-create new cart for next sale
    await newSale()
  }

  return {
    cartId,
    cart,
    customer,
    payments,
    isLoading,
    isCheckingOut,
    lastOrder,
    error,
    deliveryMode,
    shippingMethods,
    deliveryShippingOptions,
    customerAddresses,
    cartTotal,
    paid,
    remaining,
    change,
    canCheckout,
    hasItems,
    init,
    newSale,
    addItem,
    updateItem,
    removeItem,
    setCustomer,
    applyDiscountCode,
    setShippingAddress,
    loadShippingMethods,
    loadDeliveryShippingOptions,
    loadCustomerAddresses,
    selectCustomerAddress,
    setShippingMethod,
    setDeliveryShipping,
    addPayment,
    removePayment,
    finalizeSale
  }
})
