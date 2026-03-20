<template>
  <DefaultLayout :icon="{ type: 'fa', icon: 'fa-light fa-shop text-[1.2rem]' }" :menu-items="[]">
    <div class="min-h-screen bg-slate-100 px-6 py-6 dark:bg-navy-900">
      <div v-if="loadingPage" class="flex min-h-[18rem] items-center justify-center">
        <em class="fa-duotone fa-spinner-third fa-spin text-2xl text-primary"></em>
      </div>

      <template v-else-if="page">
        <div class="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p
              class="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400 dark:text-navy-400"
            >
              Storefront Editor
            </p>
            <h1 class="mt-2 text-2xl font-semibold text-slate-900 dark:text-navy-50">
              {{ page.title }}
            </h1>
            <p class="mt-1 text-sm text-slate-500 dark:text-navy-300">
              {{ page.pageType }} · {{ page.path }}
            </p>
          </div>

          <div class="flex flex-wrap gap-2">
            <button
              class="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 dark:border-navy-600 dark:bg-navy-700 dark:text-navy-100 dark:hover:border-navy-500"
              type="button"
              @click="areaDialog = true"
            >
              Add Area
            </button>
            <button
              class="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-60 dark:border-navy-600 dark:bg-navy-700 dark:text-navy-100 dark:hover:border-navy-500"
              type="button"
              :disabled="store.saving"
              @click="saveDraft"
            >
              {{ store.saving ? 'Saving...' : 'Save Draft' }}
            </button>
            <button
              class="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-primary dark:hover:bg-primary/90"
              type="button"
              :disabled="store.saving"
              @click="publish"
            >
              Publish
            </button>
          </div>
        </div>

        <div
          v-if="errorMessage"
          class="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300"
        >
          {{ errorMessage }}
        </div>

        <div class="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)_340px]">
          <div class="space-y-6">
            <section
              class="rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-navy-700 dark:bg-navy-800"
            >
              <div class="border-b border-slate-100 px-6 py-5 dark:border-navy-700">
                <h2 class="text-lg font-semibold text-slate-900 dark:text-navy-50">Metadata</h2>
              </div>

              <div class="space-y-4 px-6 py-5">
                <label class="block">
                  <span
                    class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400"
                  >
                    Title
                  </span>
                  <input
                    v-model="metadata.title"
                    type="text"
                    class="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm outline-none transition focus:border-primary dark:border-navy-600 dark:bg-navy-700 dark:text-navy-100"
                  />
                </label>

                <label class="block">
                  <span
                    class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400"
                  >
                    Path
                  </span>
                  <input
                    v-model="metadata.path"
                    type="text"
                    :disabled="page.systemPage"
                    class="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm outline-none transition focus:border-primary disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-navy-600 dark:bg-navy-700 dark:text-navy-100 dark:disabled:bg-navy-900/40"
                  />
                </label>

                <label class="block">
                  <span
                    class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400"
                  >
                    SEO title
                  </span>
                  <input
                    v-model="metadata.seoTitle"
                    type="text"
                    class="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm outline-none transition focus:border-primary dark:border-navy-600 dark:bg-navy-700 dark:text-navy-100"
                  />
                </label>

                <label class="block">
                  <span
                    class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400"
                  >
                    SEO description
                  </span>
                  <textarea
                    v-model="metadata.seoDescription"
                    rows="4"
                    class="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm outline-none transition focus:border-primary dark:border-navy-600 dark:bg-navy-700 dark:text-navy-100"
                  ></textarea>
                </label>

                <button
                  class="w-full rounded-xl bg-primary/10 px-4 py-2.5 text-sm font-medium text-primary transition hover:bg-primary/20"
                  type="button"
                  @click="saveMetadata"
                >
                  Save Metadata
                </button>
              </div>
            </section>

            <StorefrontWidgetCatalog :page-type="page.pageType" @select="addWidget" />
          </div>

          <div>
            <StorefrontWidgetCanvas
              :layout="layout"
              :selected-widget-id="selectedWidgetId"
              @add-widget="openCatalogArea"
              @remove-widget="removeWidget"
              @move-up="moveWidgetUp"
              @move-down="moveWidgetDown"
              @select-widget="selectWidget"
              @remove-area="removeArea"
            />
          </div>

          <div>
            <section
              v-if="selectedWidget"
              class="rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-navy-700 dark:bg-navy-800"
            >
              <div class="border-b border-slate-100 px-6 py-5 dark:border-navy-700">
                <h2 class="text-lg font-semibold text-slate-900 dark:text-navy-50">
                  Widget Settings
                </h2>
                <p class="mt-1 text-sm text-slate-500 dark:text-navy-300">
                  {{ selectedWidget.name }}
                </p>
              </div>

              <div class="px-6 py-5">
                <StorefrontWidgetConfigForm
                  :model-value="selectedWidget.configuration"
                  :fields="selectedWidgetFields"
                  @update:model-value="updateSelectedWidgetConfiguration"
                />
              </div>
            </section>

            <section
              v-else
              class="rounded-[28px] border border-dashed border-slate-200 bg-white/60 px-6 py-12 text-center shadow-sm dark:border-navy-700 dark:bg-navy-800/60"
            >
              <em class="fa-light fa-sliders text-3xl text-slate-300 dark:text-navy-500"></em>
              <p class="mt-4 text-sm text-slate-500 dark:text-navy-300">
                Selecione um widget no canvas para editar sua configuração.
              </p>
            </section>
          </div>
        </div>
      </template>

      <div v-else class="flex min-h-[18rem] items-center justify-center">
        <div class="text-center">
          <em
            class="fa-light fa-file-circle-question text-3xl text-slate-300 dark:text-navy-500"
          ></em>
          <p class="mt-4 text-sm text-slate-500 dark:text-navy-300">Página não encontrada.</p>
        </div>
      </div>

      <div
        v-if="areaDialog"
        class="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 px-4"
        @click.self="areaDialog = false"
      >
        <div
          class="w-full max-w-md rounded-[28px] border border-slate-200 bg-white shadow-2xl dark:border-navy-600 dark:bg-navy-800"
        >
          <div class="border-b border-slate-100 px-6 py-5 dark:border-navy-700">
            <h2 class="text-lg font-semibold text-slate-900 dark:text-navy-50">New Area</h2>
          </div>

          <div class="px-6 py-5">
            <label class="block">
              <span
                class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400"
              >
                Area name
              </span>
              <input
                v-model="newAreaName"
                type="text"
                placeholder="sidebar, hero, footer-top"
                class="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm outline-none transition focus:border-primary dark:border-navy-600 dark:bg-navy-700 dark:text-navy-100"
              />
            </label>
          </div>

          <div
            class="flex justify-end gap-2 border-t border-slate-100 px-6 py-4 dark:border-navy-700"
          >
            <button
              class="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-navy-200 dark:hover:bg-navy-700"
              type="button"
              @click="areaDialog = false"
            >
              Cancel
            </button>
            <button
              class="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-primary dark:hover:bg-primary/90"
              type="button"
              :disabled="!newAreaName.trim()"
              @click="addArea"
            >
              Create
            </button>
          </div>
        </div>
      </div>
    </div>
  </DefaultLayout>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import DefaultLayout from '@/bin/platform/hermes/layouts/default.vue'
import notification from '@/helpers/utils/notification'
import StorefrontWidgetCanvas from '../components/StorefrontWidgetCanvas.vue'
import StorefrontWidgetCatalog from '../components/StorefrontWidgetCatalog.vue'
import StorefrontWidgetConfigForm from '../components/StorefrontWidgetConfigForm.vue'
import { findStorefrontWidget } from '../widgets'
import { useStorefrontBuilderStore } from '../store/useStorefrontBuilderStore'
import type { StorefrontLayoutDraft, StorefrontWidgetDraft } from '../composables/useStorefrontApi'

const route = useRoute()
const store = useStorefrontBuilderStore()
const toast = notification

const activeAreaName = ref('main')
const selectedWidgetId = ref<string | undefined | null>(null)
const areaDialog = ref(false)
const newAreaName = ref('')
const errorMessage = ref('')
const loadingPage = ref(true)

const metadata = reactive({
  title: '',
  path: '',
  seoTitle: '',
  seoDescription: ''
})

const pageId = computed(() => String(route.params.pageId ?? ''))
const page = computed(() => store.currentPage)
const layout = computed<StorefrontLayoutDraft>(() => store.draftLayout)

const selectedWidget = computed<StorefrontWidgetDraft | null>(() => {
  if (!selectedWidgetId.value) {
    return null
  }

  for (const area of layout.value.areas) {
    const widget = area.widgets.find((item) => item.id === selectedWidgetId.value)
    if (widget) return widget
  }

  return null
})

const selectedWidgetFields = computed(() => {
  if (!selectedWidget.value) return []
  return findStorefrontWidget(selectedWidget.value.name)?.fields ?? []
})

watch(
  page,
  (value) => {
    metadata.title = value?.title ?? ''
    metadata.path = value?.path ?? ''
    metadata.seoTitle = value?.draftSeo?.title ?? value?.publishedSeo?.title ?? ''
    metadata.seoDescription = value?.draftSeo?.description ?? value?.publishedSeo?.description ?? ''
  },
  { immediate: true }
)

watch(
  selectedWidget,
  (value) => {
    if (!value) return
    const area = layout.value.areas.find((item) =>
      item.widgets.some((widget) => widget.id === value.id)
    )
    if (area) activeAreaName.value = area.name
  },
  { immediate: true }
)

watch(
  pageId,
  async (nextPageId) => {
    if (!nextPageId) return
    await loadPage(nextPageId)
  },
  { immediate: true }
)

onMounted(async () => {
  if (!store.pages.length) {
    await runAction(async () => {
      await store.loadPages()
    }, 'Falha ao carregar as páginas da storefront.')
  }
})

async function runAction(action: () => Promise<void>, fallbackMessage: string) {
  errorMessage.value = ''
  try {
    await action()
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message ?? fallbackMessage
    toast({ text: errorMessage.value, variant: 'error' })
  }
}

async function loadPage(nextPageId: string) {
  loadingPage.value = true
  await runAction(async () => {
    if (!store.pages.length) {
      await store.loadPages()
    }
    await store.selectPage(nextPageId)
    ensureMainArea()
    activeAreaName.value = store.draftLayout.areas[0]?.name ?? 'main'
    selectedWidgetId.value = null
  }, 'Falha ao carregar a página para edição.')
  loadingPage.value = false
}

function ensureMainArea() {
  if (!layout.value.areas.length) {
    store.setDraftLayout({ areas: [{ name: 'main', widgets: [] }] })
  }
}

function cloneLayout(source: StorefrontLayoutDraft): StorefrontLayoutDraft {
  return {
    areas: source.areas.map((area) => ({
      name: area.name,
      widgets: area.widgets.map((widget) => ({
        id: widget.id,
        name: widget.name,
        configuration: { ...(widget.configuration ?? {}) },
        position: widget.position,
        supportedPageTypes: widget.supportedPageTypes ? [...widget.supportedPageTypes] : undefined
      }))
    }))
  }
}

function addArea() {
  const normalized = newAreaName.value.trim()
  if (!normalized) return

  const next = cloneLayout(layout.value)
  if (next.areas.some((area) => area.name === normalized)) return

  next.areas.push({ name: normalized, widgets: [] })
  activeAreaName.value = normalized
  newAreaName.value = ''
  areaDialog.value = false
  store.setDraftLayout(next)
}

function removeArea(areaName: string) {
  if (layout.value.areas.length <= 1) return

  const next = cloneLayout(layout.value)
  next.areas = next.areas.filter((area) => area.name !== areaName)

  if (activeAreaName.value === areaName) {
    activeAreaName.value = next.areas[0]?.name ?? 'main'
  }

  if (
    selectedWidget.value &&
    !next.areas.some((area) =>
      area.widgets.some((widget) => widget.id === selectedWidget.value?.id)
    )
  ) {
    selectedWidgetId.value = null
  }

  store.setDraftLayout(next)
}

function addWidget(widgetName: string) {
  ensureMainArea()
  const definition = findStorefrontWidget(widgetName)
  if (!definition) return

  const next = cloneLayout(layout.value)
  const area = next.areas.find((item) => item.name === activeAreaName.value) || next.areas[0]
  const duplicateCount = area.widgets.filter((item) => item.name === widgetName).length
  if (!definition.allowMultiple && duplicateCount > 0) return

  const widget: StorefrontWidgetDraft = {
    id: crypto.randomUUID(),
    name: widgetName,
    configuration: definition.buildDefaultConfiguration(),
    position: area.widgets.length,
    supportedPageTypes: [...definition.supportedPageTypes]
  }

  area.widgets.push(widget)
  selectedWidgetId.value = widget.id
  store.setDraftLayout(next)
}

function openCatalogArea(areaName: string) {
  activeAreaName.value = areaName
}

function selectWidget(widgetId: string) {
  selectedWidgetId.value = widgetId
}

function updateSelectedWidgetConfiguration(configuration: Record<string, any>) {
  if (!selectedWidget.value) return

  const next = cloneLayout(layout.value)

  for (const area of next.areas) {
    const widget = area.widgets.find((item) => item.id === selectedWidget.value?.id)
    if (!widget) continue

    widget.configuration = { ...configuration }
    store.setDraftLayout(next)
    return
  }
}

function removeWidget(areaName: string, widgetId: string) {
  const next = cloneLayout(layout.value)
  const area = next.areas.find((item) => item.name === areaName)
  if (!area) return

  area.widgets = area.widgets
    .filter((item) => item.id !== widgetId)
    .map((item, index) => ({ ...item, position: index }))

  if (selectedWidgetId.value === widgetId) {
    selectedWidgetId.value = null
  }

  store.setDraftLayout(next)
}

function moveWidgetUp(areaName: string, widgetId: string) {
  moveWidget(areaName, widgetId, -1)
}

function moveWidgetDown(areaName: string, widgetId: string) {
  moveWidget(areaName, widgetId, 1)
}

function moveWidget(areaName: string, widgetId: string, delta: number) {
  const next = cloneLayout(layout.value)
  const area = next.areas.find((item) => item.name === areaName)
  if (!area) return

  const sorted = [...area.widgets].sort((a, b) => a.position - b.position)
  const index = sorted.findIndex((item) => item.id === widgetId)
  const targetIndex = index + delta
  if (index === -1 || targetIndex < 0 || targetIndex >= sorted.length) return

  const [widget] = sorted.splice(index, 1)
  sorted.splice(targetIndex, 0, widget)
  area.widgets = sorted.map((item, idx) => ({ ...item, position: idx }))
  store.setDraftLayout(next)
}

async function saveMetadata() {
  if (!page.value) return
  await runAction(async () => {
    const updated = await store.updateMetadata(page.value!.id, {
      title: metadata.title,
      path: metadata.path,
      seo: {
        title: metadata.seoTitle,
        description: metadata.seoDescription
      }
    })
    store.currentPage = updated
    toast({ text: 'Metadados salvos.', variant: 'success' })
  }, 'Falha ao salvar os metadados.')
}

async function saveDraft() {
  if (!page.value) return
  await runAction(async () => {
    await store.saveDraft(page.value!.id)
    toast({ text: 'Draft salvo.', variant: 'success' })
  }, 'Falha ao salvar o draft.')
}

async function publish() {
  if (!page.value) return
  await runAction(async () => {
    await store.publish(page.value!.id)
    toast({ text: 'Página publicada.', variant: 'success' })
  }, 'Falha ao publicar a página.')
}
</script>
