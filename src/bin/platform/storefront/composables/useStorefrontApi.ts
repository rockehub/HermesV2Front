import { $axios } from '@/helpers/integration/integration'

export type StorefrontPageType = 'HOME' | 'CATEGORY' | 'PRODUCT' | 'CART' | 'CHECKOUT' | 'SEARCH' | 'CONTENT'

export interface StorefrontWidgetDraft {
  id?: string
  name: string
  configuration: Record<string, any>
  position: number
  supportedPageTypes?: StorefrontPageType[]
}

export interface StorefrontAreaDraft {
  name: string
  widgets: StorefrontWidgetDraft[]
}

export interface StorefrontLayoutDraft {
  areas: StorefrontAreaDraft[]
}

export interface StorefrontSeo {
  title?: string
  description?: string
  keywords?: string[]
}

export interface StorefrontPage {
  id: string
  code: string
  title: string
  path: string
  pageType: StorefrontPageType
  systemPage: boolean
  archived: boolean
  publishedVersion: number
  draftSeo?: StorefrontSeo | null
  publishedSeo?: StorefrontSeo | null
  draftLayout?: StorefrontLayoutDraft | null
  publishedLayout?: StorefrontLayoutDraft | null
}

export interface StorefrontConfig {
  tenantId?: string
  storeName?: string
  defaultLanguage?: string
  active?: boolean
  layoutTemplate?: StorefrontLayoutDraft | null
  hosts?: StorefrontHost[]
}

export interface StorefrontHost {
  id: string
  host: string
  primaryHost: boolean
}

export interface StorefrontPageCreatePayload {
  title: string
  path: string
}

export interface StorefrontPageMetadataPayload {
  title: string
  path: string
  seo?: StorefrontSeo | null
}

export function useStorefrontApi() {
  return {
    async getConfig(): Promise<StorefrontConfig> {
      const { data } = await $axios.get('/api/v1/admin/storefront/config')
      return data
    },

    async updateConfig(payload: Partial<StorefrontConfig>): Promise<StorefrontConfig> {
      const { data } = await $axios.put('/api/v1/admin/storefront/config', payload)
      return data
    },

    async addHost(host: string, primaryHost = false): Promise<StorefrontHost> {
      const { data } = await $axios.post('/api/v1/admin/storefront/hosts', { host, primaryHost })
      return data
    },

    async removeHost(hostId: string): Promise<void> {
      await $axios.delete(`/api/v1/admin/storefront/hosts/${hostId}`)
    },

    async getPages(): Promise<StorefrontPage[]> {
      const { data } = await $axios.get('/api/v1/admin/storefront/pages')
      return data
    },

    async createPage(payload: StorefrontPageCreatePayload): Promise<StorefrontPage> {
      const { data } = await $axios.post('/api/v1/admin/storefront/pages', payload)
      return data
    },

    async updatePageMetadata(pageId: string, payload: StorefrontPageMetadataPayload): Promise<StorefrontPage> {
      const { data } = await $axios.patch(`/api/v1/admin/storefront/pages/${pageId}/metadata`, payload)
      return data
    },

    async saveDraft(pageId: string, draftLayout: StorefrontLayoutDraft): Promise<StorefrontPage> {
      const { data } = await $axios.put(`/api/v1/admin/storefront/pages/${pageId}/draft`, {
        layout: draftLayout
      })
      return data
    },

    async publish(pageId: string): Promise<StorefrontPage> {
      const { data } = await $axios.post(`/api/v1/admin/storefront/pages/${pageId}/publish`)
      return data
    },

    async duplicate(pageId: string): Promise<StorefrontPage> {
      const { data } = await $axios.post(`/api/v1/admin/storefront/pages/${pageId}/duplicate`)
      return data
    },

    async archive(pageId: string): Promise<StorefrontPage> {
      const { data } = await $axios.post(`/api/v1/admin/storefront/pages/${pageId}/archive`)
      return data
    },

    async restore(pageId: string): Promise<StorefrontPage> {
      const { data } = await $axios.post(`/api/v1/admin/storefront/pages/${pageId}/restore`)
      return data
    },

    async preview(pageId: string): Promise<StorefrontPage> {
      const { data } = await $axios.get(`/api/v1/admin/storefront/pages/${pageId}/preview`)
      return data
    }
  }
}
