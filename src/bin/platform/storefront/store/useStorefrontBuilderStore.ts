import { defineStore } from 'pinia'
import {
  useStorefrontApi,
  type StorefrontConfig,
  type StorefrontLayoutDraft,
  type StorefrontPage,
  type StorefrontPageMetadataPayload
} from '../composables/useStorefrontApi'

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value ?? {}))
}

function cloneLayout(layout?: StorefrontLayoutDraft | null): StorefrontLayoutDraft {
  if (!layout?.areas?.length) {
    return {
      areas: [{ name: 'main', widgets: [] }]
    }
  }

  return {
    areas: layout.areas.map((area) => ({
      name: area.name,
      widgets: [...area.widgets]
        .sort((a, b) => a.position - b.position)
        .map((widget) => ({
          id: widget.id,
          name: widget.name,
          configuration: deepClone(widget.configuration ?? {}),
          position: widget.position,
          supportedPageTypes: widget.supportedPageTypes ? [...widget.supportedPageTypes] : undefined
        }))
    }))
  }
}

function normalizeLayout(layout?: StorefrontLayoutDraft | null): StorefrontLayoutDraft {
  return cloneLayout(layout)
}

export { cloneLayout, normalizeLayout, deepClone }

export const useStorefrontBuilderStore = defineStore('storefrontBuilder', {
  state: () => ({
    config: null as StorefrontConfig | null,
    pages: [] as StorefrontPage[],
    currentPage: null as StorefrontPage | null,
    draftLayout: normalizeLayout(),
    loading: false,
    saving: false
  }),

  getters: {
    systemPages(state): StorefrontPage[] {
      return state.pages.filter((page) => page.systemPage)
    },

    customPages(state): StorefrontPage[] {
      return state.pages.filter((page) => !page.systemPage)
    }
  },

  actions: {
    async loadConfig() {
      const api = useStorefrontApi()
      this.config = await api.getConfig()
    },

    async updateConfig(payload: Partial<StorefrontConfig>) {
      const api = useStorefrontApi()
      this.config = await api.updateConfig(payload)
      return this.config
    },

    async addHost(host: string, primaryHost = false) {
      const api = useStorefrontApi()
      await api.addHost(host, primaryHost)
      await this.loadConfig()
      return this.config
    },

    async removeHost(hostId: string) {
      const api = useStorefrontApi()
      await api.removeHost(hostId)
      await this.loadConfig()
    },

    async loadPages() {
      const api = useStorefrontApi()
      this.pages = await api.getPages()
    },

    async initialize() {
      this.loading = true
      try {
        await Promise.all([this.loadConfig(), this.loadPages()])
      } finally {
        this.loading = false
      }
    },

    async selectPage(pageId: string) {
      if (!this.pages.length) {
        await this.loadPages()
      }

      const page = this.pages.find((item) => item.id === pageId)
      this.currentPage = page ?? null
      this.draftLayout = normalizeLayout(page?.draftLayout ?? page?.publishedLayout)
    },

    async createPage(title: string, path: string) {
      const api = useStorefrontApi()
      const page = await api.createPage({ title, path })
      this.pages = [...this.pages, page]
      return page
    },

    async updateMetadata(pageId: string, payload: StorefrontPageMetadataPayload) {
      const api = useStorefrontApi()
      const page = await api.updatePageMetadata(pageId, payload)
      this.upsertPage(page)
      return page
    },

    async saveDraft(pageId: string) {
      const api = useStorefrontApi()
      this.saving = true
      try {
        const payload = cloneLayout(this.draftLayout)
        const page = await api.saveDraft(pageId, payload)
        this.upsertPage(page)
        this.currentPage = page
        this.draftLayout = normalizeLayout(page.draftLayout ?? page.publishedLayout)
      } finally {
        this.saving = false
      }
    },

    async publish(pageId: string) {
      const api = useStorefrontApi()
      this.saving = true
      try {
        const payload = cloneLayout(this.draftLayout)
        const draftPage = await api.saveDraft(pageId, payload)
        this.upsertPage(draftPage)
        this.currentPage = draftPage
        this.draftLayout = normalizeLayout(draftPage.draftLayout ?? draftPage.publishedLayout)

        const page = await api.publish(pageId)
        this.upsertPage(page)
        this.currentPage = page
        this.draftLayout = normalizeLayout(page.draftLayout ?? page.publishedLayout)
      } finally {
        this.saving = false
      }
    },

    async duplicate(pageId: string) {
      const api = useStorefrontApi()
      const page = await api.duplicate(pageId)
      this.pages = [...this.pages, page]
      return page
    },

    async archive(pageId: string) {
      const api = useStorefrontApi()
      const page = await api.archive(pageId)
      this.upsertPage(page)
      if (this.currentPage?.id === pageId) {
        this.currentPage = page
      }
      return page
    },

    async restore(pageId: string) {
      const api = useStorefrontApi()
      const page = await api.restore(pageId)
      this.upsertPage(page)
      if (this.currentPage?.id === pageId) {
        this.currentPage = page
      }
      return page
    },

    async refreshPreview(pageId: string) {
      const api = useStorefrontApi()
      const page = await api.preview(pageId)
      this.upsertPage(page)
      if (this.currentPage?.id === pageId) {
        this.currentPage = page
      }
      return page
    },

    setDraftLayout(layout: StorefrontLayoutDraft) {
      this.draftLayout = normalizeLayout(layout)
    },

    upsertPage(page: StorefrontPage) {
      const index = this.pages.findIndex((item) => item.id === page.id)
      if (index === -1) {
        this.pages = [...this.pages, page]
        return
      }

      const next = [...this.pages]
      next.splice(index, 1, page)
      this.pages = next
    }
  }
})
