import { $axios } from '@/helpers/integration/integration'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Product {
  id: string
  name: string
  slug: string
  shortDescription: string | null
  description: string | null
  isVirtual: boolean
  shippable: boolean
  weekOffer: boolean
  published: boolean
  available: boolean
  stock: number
  allowOutOfStockPurchases: boolean
  priority: number
  metaTitle: string | null
  metaDescription: string | null
  metaKeywords: string | null
  ncm: string | null
  icmsOrigem: number | null
  icmsTributeSituations: string | null
  pisTributeSituations: string | null
  cofinsTributeSituations: string | null
  _links?: Record<string, { href: string }>
}

export interface ProductCategory {
  id: string
  name: string
  _links?: Record<string, { href: string }>
}

export interface Brand {
  id: string
  name: string
  _links?: Record<string, { href: string }>
}

export interface Warehouse {
  id: string
  name: string
  _links?: Record<string, { href: string }>
}

export interface ProductPrice {
  id: string
  price: number
  field: string | null
  _links?: Record<string, { href: string }>
}

export interface Variant {
  id: string
  name: string
  optionValues: Record<string, string>
  stock: number
  published: boolean
  available: boolean
  _links?: Record<string, { href: string }>
}

export interface ElasticProductHit {
  id: string
  name: string
  price: number
  inStock: boolean
  hasVariants: boolean
}

export interface PosSummary {
  totalRevenue: number
  totalOrders: number
  [key: string]: any
}

export interface Vendor {
  id: string
  name: string
}

export interface Unit {
  id: string
  code: string
  name?: string
}

// ─── Helper ──────────────────────────────────────────────────────────────────

/** Extract UUID from a HAL self link like /api/v1/data/product/{id} */
export function extractIdFromLink(href: string): string {
  const parts = href.split('/')
  return parts[parts.length - 1]
}

/** Build a URI for use in text/uri-list associations */
export function buildUri(resource: string, id: string): string {
  return `/api/v1/data/${resource}/${id}`
}

// ─── Composable ──────────────────────────────────────────────────────────────

export const useProductCustomizerApi = () => {
  // ── Product ──────────────────────────────────────────────────────────────

  const getProduct = (id: string) =>
    $axios.get<Product>(`/api/v1/data/product/${id}`)

  const patchProduct = (id: string, data: Partial<Product>) =>
    $axios.patch<Product>(`/api/v1/data/product/${id}`, data)

  // ── Relations ─────────────────────────────────────────────────────────────

  const getProductCategories = (id: string) =>
    $axios.get<{ _embedded: { productcategory: ProductCategory[] } }>(
      `/api/v1/data/product/${id}/categories`
    )

  const getProductBrands = (id: string) =>
    $axios.get<{ _embedded: { brand: Brand[] } }>(
      `/api/v1/data/product/${id}/brands`
    )

  const getProductWarehouses = (id: string) =>
    $axios.get<{ _embedded: { warehouse: Warehouse[] } }>(
      `/api/v1/data/product/${id}/warehouses`
    )

  /** PUT with Content-Type: text/uri-list (newline-joined URIs) */
  const putProductCategories = (id: string, categoryIds: string[]) => {
    const body = categoryIds.map((cid) => buildUri('productcategory', cid)).join('\n')
    return $axios.put(`/api/v1/data/product/${id}/categories`, body, {
      headers: { 'Content-Type': 'text/uri-list' }
    })
  }

  const putProductBrands = (id: string, brandIds: string[]) => {
    const body = brandIds.map((bid) => buildUri('brand', bid)).join('\n')
    return $axios.put(`/api/v1/data/product/${id}/brands`, body, {
      headers: { 'Content-Type': 'text/uri-list' }
    })
  }

  const putProductWarehouses = (id: string, warehouseIds: string[]) => {
    const body = warehouseIds.map((wid) => buildUri('warehouse', wid)).join('\n')
    return $axios.put(`/api/v1/data/product/${id}/warehouses`, body, {
      headers: { 'Content-Type': 'text/uri-list' }
    })
  }

  // ── Prices ────────────────────────────────────────────────────────────────

  const getProductPrices = (id: string) =>
    $axios.get<{ _embedded: { productprice: ProductPrice[] } }>(
      `/api/v1/data/product/${id}/prices`
    )

  const patchPrice = (priceId: string, data: { price: number }) =>
    $axios.patch<ProductPrice>(`/api/v1/data/productprice/${priceId}`, data)

  const createProductPrice = (data: {
    price: number
    field?: string | null
    product: string
  }) => $axios.post<ProductPrice>(`/api/v1/data/productprice`, data)

  const createVariantPrice = (data: { price: number; variant: string }) =>
    $axios.post<ProductPrice>(`/api/v1/data/productprice`, data)

  // ── Variants ──────────────────────────────────────────────────────────────

  const getProductVariants = (id: string) =>
    $axios.get<{ _embedded: { variant: Variant[] } }>(
      `/api/v1/data/product/${id}/variants`
    )

  const patchVariant = (variantId: string, data: Partial<Variant>) =>
    $axios.patch<Variant>(`/api/v1/data/variant/${variantId}`, data)

  const createVariant = (data: Partial<Variant> & { product: string }) =>
    $axios.post<Variant>(`/api/v1/data/variant`, data)

  const deleteVariant = (variantId: string) =>
    $axios.delete(`/api/v1/data/variant/${variantId}`)

  const getVariantPrices = (variantId: string) =>
    $axios.get<{ _embedded: { productprice: ProductPrice[] } }>(
      `/api/v1/data/variant/${variantId}/prices`
    )

  // ── Reference data ────────────────────────────────────────────────────────

  const getAllCategories = () =>
    $axios.get<{ _embedded: { productcategory: ProductCategory[] } }>(
      `/api/v1/data/productcategory?size=200&sort=name,asc`
    )

  const getAllBrands = () =>
    $axios.get<{ _embedded: { brand: Brand[] } }>(
      `/api/v1/data/brand?size=200&sort=name,asc`
    )

  const getAllVendors = () =>
    $axios.get<{ _embedded: { vendor: Vendor[] } }>(
      `/api/v1/data/vendor?size=200&sort=name,asc`
    )

  const getAllUnits = () =>
    $axios.get<{ _embedded: { unit: Unit[] } }>(
      `/api/v1/data/unit?size=200&sort=code,asc`
    )

  const getAllWarehouses = () =>
    $axios.get<{ _embedded: { warehouse: Warehouse[] } }>(
      `/api/v1/data/warehouse?size=200&sort=name,asc`
    )

  // ── Elasticsearch ─────────────────────────────────────────────────────────

  const searchProducts = (
    q: string,
    params?: { size?: number; inStock?: boolean; page?: number }
  ) =>
    $axios.get<{ hits: ElasticProductHit[]; total?: number }>(`/api/v1/commerce/products/search`, {
      params: { q, size: 20, ...params }
    })

  const getProductTotal = () =>
    $axios.get<{ page: { totalElements: number } }>(`/api/v1/data/product?size=1`)

  // ── POS summary ───────────────────────────────────────────────────────────

  const getPosSummary = () =>
    $axios.get<{ data: PosSummary }>(`/api/v1/admin/pos/reports/summary`)

  return {
    // product
    getProduct,
    patchProduct,
    // relations
    getProductCategories,
    getProductBrands,
    getProductWarehouses,
    putProductCategories,
    putProductBrands,
    putProductWarehouses,
    // prices
    getProductPrices,
    patchPrice,
    createProductPrice,
    createVariantPrice,
    // variants
    getProductVariants,
    patchVariant,
    createVariant,
    deleteVariant,
    getVariantPrices,
    // reference
    getAllCategories,
    getAllBrands,
    getAllVendors,
    getAllUnits,
    getAllWarehouses,
    // elastic
    searchProducts,
    getProductTotal,
    // pos
    getPosSummary,
    // helpers
    extractIdFromLink,
    buildUri
  }
}
