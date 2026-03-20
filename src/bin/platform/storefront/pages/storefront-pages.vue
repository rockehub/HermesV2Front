<template>
  <DefaultLayout :icon="{ type: 'fa', icon: 'fa-light fa-shop text-[1.2rem]' }" :menu-items="[]">
    <div class="min-h-screen bg-slate-100 px-6 py-6 dark:bg-navy-900">
      <div v-if="store.loading" class="flex min-h-[18rem] items-center justify-center">
        <em class="fa-duotone fa-spinner-third fa-spin text-2xl text-primary"></em>
      </div>

      <template v-else>
        <div class="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400 dark:text-navy-400">
              Storefront Builder
            </p>
            <h1 class="mt-2 text-2xl font-semibold text-slate-900 dark:text-navy-50">Pages</h1>
            <p class="mt-1 text-sm text-slate-500 dark:text-navy-300">
              Loja default com layout base reutilizavel, hosts e paginas customizadas.
            </p>
          </div>

          <button
            class="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 dark:bg-primary dark:hover:bg-primary/90"
            type="button"
            @click="createDialog = true"
          >
            <em class="fa-light fa-plus text-sm"></em>
            New Content Page
          </button>
        </div>

        <div v-if="errorMessage" class="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
          {{ errorMessage }}
        </div>

        <div class="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
          <section class="rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-navy-700 dark:bg-navy-800">
            <div class="border-b border-slate-100 px-6 py-5 dark:border-navy-700">
              <h2 class="text-lg font-semibold text-slate-900 dark:text-navy-50">Storefront Settings</h2>
              <p class="mt-1 text-sm text-slate-500 dark:text-navy-300">
                Configuracoes gerais da loja e layout base reutilizado pelas paginas.
              </p>
            </div>

            <div class="grid gap-6 px-6 py-5 md:grid-cols-2">
              <div class="space-y-4">
                <label class="block">
                  <span class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Store name</span>
                  <input v-model="configForm.storeName" type="text" class="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm outline-none transition focus:border-primary dark:border-navy-600 dark:bg-navy-700 dark:text-navy-100" />
                </label>

                <label class="block">
                  <span class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Default language</span>
                  <select v-model="configForm.defaultLanguage" class="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm outline-none transition focus:border-primary dark:border-navy-600 dark:bg-navy-700 dark:text-navy-100">
                    <option v-for="language in languageOptions" :key="language" :value="language">{{ language }}</option>
                  </select>
                </label>

                <label class="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-navy-600 dark:bg-navy-700/40">
                  <div>
                    <p class="text-sm font-medium text-slate-700 dark:text-navy-100">Store active</p>
                    <p class="mt-0.5 text-xs text-slate-500 dark:text-navy-300">Desabilite para bloquear a publicacao da storefront.</p>
                  </div>
                  <button class="relative inline-flex h-7 w-12 items-center rounded-full transition" :class="configForm.active ? 'bg-primary' : 'bg-slate-300 dark:bg-navy-500'" type="button" role="switch" :aria-checked="configForm.active" @click="configForm.active = !configForm.active">
                    <span class="inline-block h-5 w-5 rounded-full bg-white shadow transition" :class="configForm.active ? 'translate-x-6' : 'translate-x-1'"></span>
                  </button>
                </label>
              </div>

              <div class="flex h-full flex-col justify-between gap-4">
                <div class="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500 dark:border-navy-600 dark:bg-navy-700/30 dark:text-navy-300">
                  O layout base define areas reutilizaveis como header e footer. Cada pagina publica herda esse template antes do seu conteudo proprio.
                </div>
                <div class="flex justify-end">
                  <button class="rounded-xl bg-primary/10 px-4 py-2.5 text-sm font-medium text-primary transition hover:bg-primary/20" type="button" @click="saveConfig">
                    Save Settings
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section class="rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-navy-700 dark:bg-navy-800">
            <div class="border-b border-slate-100 px-6 py-5 dark:border-navy-700">
              <h2 class="text-lg font-semibold text-slate-900 dark:text-navy-50">Hosts</h2>
              <p class="mt-1 text-sm text-slate-500 dark:text-navy-300">Vincule dominios e subdominios da loja.</p>
            </div>

            <div class="space-y-4 px-6 py-5">
              <div class="flex flex-col gap-3 sm:flex-row">
                <input v-model="hostForm.host" type="text" placeholder="store.example.com" class="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm outline-none transition focus:border-primary dark:border-navy-600 dark:bg-navy-700 dark:text-navy-100" @keydown.enter.prevent="addHost" />
                <button class="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 dark:bg-primary dark:hover:bg-primary/90" type="button" @click="addHost">Add</button>
              </div>

              <div v-if="store.config?.hosts?.length" class="space-y-3">
                <div v-for="host in store.config?.hosts || []" :key="host.id" class="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 px-4 py-3 dark:border-navy-600">
                  <div class="min-w-0">
                    <p class="truncate text-sm font-medium text-slate-800 dark:text-navy-100">{{ host.host }}</p>
                    <p class="mt-0.5 text-xs text-slate-500 dark:text-navy-300">{{ host.primaryHost ? 'Primary host' : 'Secondary host' }}</p>
                  </div>
                  <button class="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/30" type="button" @click="removeHost(host.id)">Remove</button>
                </div>
              </div>

              <div v-else class="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-400 dark:border-navy-600 dark:text-navy-400">
                Nenhum host configurado.
              </div>
            </div>
          </section>
        </div>

        <section class="mt-6 rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-navy-700 dark:bg-navy-800">
          <div class="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 dark:border-navy-700 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 class="text-lg font-semibold text-slate-900 dark:text-navy-50">Base Layout Template</h2>
              <p class="mt-1 text-sm text-slate-500 dark:text-navy-300">Header, footer e outras areas herdadas por todas as paginas da storefront.</p>
            </div>
            <div class="flex flex-wrap items-center gap-3">
              <button class="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 dark:border-navy-600 dark:bg-navy-700 dark:text-navy-100" type="button" @click="templateAreaDialog = true">Add Area</button>
              <button class="rounded-xl bg-primary/10 px-4 py-2.5 text-sm font-medium text-primary transition hover:bg-primary/20" type="button" @click="saveBaseLayout">Save Base Layout</button>
            </div>
          </div>

          <div class="grid gap-6 px-6 py-5 xl:grid-cols-[minmax(0,1.2fr)_320px_320px]">
            <StorefrontWidgetCanvas
              :layout="layoutTemplate"
              :selected-widget-id="selectedTemplateWidgetId"
              @add-widget="openTemplateArea"
              @remove-widget="removeTemplateWidget"
              @move-up="moveTemplateWidgetUp"
              @move-down="moveTemplateWidgetDown"
              @select-widget="selectTemplateWidget"
              @remove-area="removeTemplateArea"
            />

            <StorefrontWidgetCatalog :page-type="'HOME'" @select="addTemplateWidget" />

            <section v-if="selectedTemplateWidget" class="rounded-[28px] border border-slate-200 bg-slate-50/70 p-5 dark:border-navy-700 dark:bg-navy-700/30">
              <h3 class="text-base font-semibold text-slate-900 dark:text-navy-50">Base Widget Settings</h3>
              <p class="mt-1 text-sm text-slate-500 dark:text-navy-300">{{ selectedTemplateWidget.name }}</p>
              <div class="mt-5">
                <StorefrontWidgetConfigForm :model-value="selectedTemplateWidget.configuration" :fields="selectedTemplateWidgetFields" @update:model-value="updateSelectedTemplateWidgetConfiguration" />
              </div>
            </section>

            <section v-else class="rounded-[28px] border border-dashed border-slate-200 bg-slate-50/70 p-6 text-center text-sm text-slate-400 dark:border-navy-700 dark:bg-navy-700/30 dark:text-navy-300">
              Selecione um widget do layout base para editar configuracoes.
            </section>
          </div>
        </section>

        <div class="mt-6 grid gap-6 xl:grid-cols-2">
          <section class="rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-navy-700 dark:bg-navy-800">
            <div class="border-b border-slate-100 px-6 py-5 dark:border-navy-700">
              <h2 class="text-lg font-semibold text-slate-900 dark:text-navy-50">System Pages</h2>
              <p class="mt-1 text-sm text-slate-500 dark:text-navy-300">Paginas reservadas do storefront.</p>
            </div>
            <div v-if="store.systemPages.length" class="divide-y divide-slate-100 dark:divide-navy-700">
              <div v-for="page in store.systemPages" :key="page.id" class="flex items-center justify-between gap-4 px-6 py-4">
                <div class="min-w-0">
                  <div class="flex items-center gap-3">
                    <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary dark:bg-primary/15">
                      <em class="fa-light fa-grid-2 text-base"></em>
                    </span>
                    <div class="min-w-0">
                      <p class="truncate text-sm font-semibold text-slate-800 dark:text-navy-100">{{ page.title }}</p>
                      <p class="mt-0.5 truncate text-xs text-slate-500 dark:text-navy-300">{{ page.path }} · {{ page.pageType }}</p>
                    </div>
                  </div>
                </div>
                <button class="shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium text-primary transition hover:bg-primary/10" type="button" @click="openEditor(page.id)">Edit</button>
              </div>
            </div>
            <div v-else class="px-6 py-10 text-center text-sm text-slate-400 dark:text-navy-400">Nenhuma pagina de sistema encontrada.</div>
          </section>

          <section class="rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-navy-700 dark:bg-navy-800">
            <div class="border-b border-slate-100 px-6 py-5 dark:border-navy-700">
              <h2 class="text-lg font-semibold text-slate-900 dark:text-navy-50">Custom Pages</h2>
              <p class="mt-1 text-sm text-slate-500 dark:text-navy-300">Conteudos criados manualmente para a loja.</p>
            </div>
            <div v-if="store.customPages.length" class="divide-y divide-slate-100 dark:divide-navy-700">
              <div v-for="page in store.customPages" :key="page.id" class="flex flex-col gap-4 px-6 py-4 xl:flex-row xl:items-center xl:justify-between">
                <div class="min-w-0">
                  <div class="flex items-center gap-3">
                    <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl" :class="page.archived ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300' : 'bg-slate-900/10 text-slate-700 dark:bg-primary/15 dark:text-primary'">
                      <em :class="page.archived ? 'fa-light fa-box-archive' : 'fa-light fa-file-lines'"></em>
                    </span>
                    <div class="min-w-0">
                      <p class="truncate text-sm font-semibold text-slate-800 dark:text-navy-100">{{ page.title }}</p>
                      <p class="mt-0.5 truncate text-xs text-slate-500 dark:text-navy-300">{{ page.path }} · v{{ page.publishedVersion || 0 }}</p>
                    </div>
                  </div>
                </div>
                <div class="flex flex-wrap gap-2">
                  <button class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-navy-200 dark:hover:bg-navy-700" type="button" @click="duplicatePage(page.id)">Duplicate</button>
                  <button v-if="!page.archived" class="rounded-lg px-3 py-1.5 text-sm font-medium text-amber-700 transition hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-950/30" type="button" @click="archivePage(page.id)">Archive</button>
                  <button v-else class="rounded-lg px-3 py-1.5 text-sm font-medium text-primary transition hover:bg-primary/10" type="button" @click="restorePage(page.id)">Restore</button>
                  <button class="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-slate-700 dark:bg-primary dark:hover:bg-primary/90" type="button" @click="openEditor(page.id)">Edit</button>
                </div>
              </div>
            </div>
            <div v-else class="px-6 py-10 text-center text-sm text-slate-400 dark:text-navy-400">Nenhuma pagina customizada criada.</div>
          </section>
        </div>

        <div v-if="createDialog" class="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 px-4" @click.self="createDialog = false">
          <div class="w-full max-w-md rounded-[28px] border border-slate-200 bg-white shadow-2xl dark:border-navy-600 dark:bg-navy-800">
            <div class="border-b border-slate-100 px-6 py-5 dark:border-navy-700"><h2 class="text-lg font-semibold text-slate-900 dark:text-navy-50">Create Content Page</h2></div>
            <div class="space-y-4 px-6 py-5">
              <label class="block"><span class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Title</span><input v-model="newPage.title" type="text" class="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm outline-none transition focus:border-primary dark:border-navy-600 dark:bg-navy-700 dark:text-navy-100" /></label>
              <label class="block"><span class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Path</span><input v-model="newPage.path" type="text" placeholder="/about-us" class="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm outline-none transition focus:border-primary dark:border-navy-600 dark:bg-navy-700 dark:text-navy-100" /><p class="mt-1.5 text-xs text-slate-400 dark:text-navy-400">Use o formato `/about-us`.</p></label>
            </div>
            <div class="flex justify-end gap-2 border-t border-slate-100 px-6 py-4 dark:border-navy-700">
              <button class="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-navy-200 dark:hover:bg-navy-700" type="button" @click="createDialog = false">Cancel</button>
              <button class="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-primary dark:hover:bg-primary/90" type="button" :disabled="creating" @click="submitCreate">{{ creating ? 'Creating...' : 'Create' }}</button>
            </div>
          </div>
        </div>

        <div v-if="templateAreaDialog" class="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 px-4" @click.self="templateAreaDialog = false">
          <div class="w-full max-w-md rounded-[28px] border border-slate-200 bg-white shadow-2xl dark:border-navy-600 dark:bg-navy-800">
            <div class="border-b border-slate-100 px-6 py-5 dark:border-navy-700"><h2 class="text-lg font-semibold text-slate-900 dark:text-navy-50">New Base Layout Area</h2></div>
            <div class="px-6 py-5">
              <label class="block"><span class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Area name</span><input v-model="newTemplateAreaName" type="text" placeholder="header, footer, announcement" class="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm outline-none transition focus:border-primary dark:border-navy-600 dark:bg-navy-700 dark:text-navy-100" /></label>
            </div>
            <div class="flex justify-end gap-2 border-t border-slate-100 px-6 py-4 dark:border-navy-700">
              <button class="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-navy-200 dark:hover:bg-navy-700" type="button" @click="templateAreaDialog = false">Cancel</button>
              <button class="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-primary dark:hover:bg-primary/90" type="button" :disabled="!newTemplateAreaName.trim()" @click="addTemplateArea">Create</button>
            </div>
          </div>
        </div>
      </template>
    </div>
  </DefaultLayout>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import DefaultLayout from '@/bin/platform/hermes/layouts/default.vue'
import notification from '@/helpers/utils/notification'
import StorefrontWidgetCanvas from '../components/StorefrontWidgetCanvas.vue'
import StorefrontWidgetCatalog from '../components/StorefrontWidgetCatalog.vue'
import StorefrontWidgetConfigForm from '../components/StorefrontWidgetConfigForm.vue'
import { findStorefrontWidget } from '../widgets'
import { cloneLayout, deepClone, normalizeLayout, useStorefrontBuilderStore } from '../store/useStorefrontBuilderStore'
import type { StorefrontLayoutDraft, StorefrontWidgetDraft } from '../composables/useStorefrontApi'

const router = useRouter()
const store = useStorefrontBuilderStore()
const toast = notification

const createDialog = ref(false)
const creating = ref(false)
const errorMessage = ref('')
const templateAreaDialog = ref(false)
const newTemplateAreaName = ref('')
const activeTemplateAreaName = ref('header')
const selectedTemplateWidgetId = ref<string | null>(null)

const newPage = reactive({ title: '', path: '' })
const hostForm = reactive({ host: '' })
const languageOptions = ['pt-BR', 'en-US', 'es-ES']
const configForm = reactive<{ storeName: string; defaultLanguage: string; active: boolean; layoutTemplate: StorefrontLayoutDraft }>({
  storeName: '',
  defaultLanguage: 'pt-BR',
  active: true,
  layoutTemplate: normalizeLayout({
    areas: [
      { name: 'header', widgets: [] },
      { name: 'footer', widgets: [] }
    ]
  })
})

const layoutTemplate = computed(() => configForm.layoutTemplate)
const selectedTemplateWidget = computed<StorefrontWidgetDraft | null>(() => {
  if (!selectedTemplateWidgetId.value) return null
  for (const area of layoutTemplate.value.areas) {
    const widget = area.widgets.find((item) => item.id === selectedTemplateWidgetId.value)
    if (widget) return widget
  }
  return null
})
const selectedTemplateWidgetFields = computed(() => {
  if (!selectedTemplateWidget.value) return []
  return findStorefrontWidget(selectedTemplateWidget.value.name)?.fields ?? []
})

onMounted(async () => {
  await runAction(async () => {
    await store.initialize()
  }, 'Falha ao carregar a configuracao da storefront.')
})

watch(
  () => store.config,
  () => {
    configForm.storeName = store.config?.storeName ?? ''
    configForm.defaultLanguage = store.config?.defaultLanguage ?? 'pt-BR'
    configForm.active = store.config?.active ?? true
    configForm.layoutTemplate = normalizeLayout(store.config?.layoutTemplate ?? {
      areas: [
        { name: 'header', widgets: [] },
        { name: 'footer', widgets: [] }
      ]
    })
    activeTemplateAreaName.value = configForm.layoutTemplate.areas[0]?.name ?? 'header'
    selectedTemplateWidgetId.value = null
  },
  { immediate: true, deep: true }
)

watch(selectedTemplateWidget, (value) => {
  if (!value) return
  const area = layoutTemplate.value.areas.find((item) => item.widgets.some((widget) => widget.id === value.id))
  if (area) activeTemplateAreaName.value = area.name
})

function openEditor(pageId: string) {
  router.push({ name: 'storefront-editor', params: { pageId } })
}

async function runAction<T>(action: () => Promise<T>, fallbackMessage: string): Promise<T | null> {
  errorMessage.value = ''
  try {
    return await action()
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message ?? fallbackMessage
    toast({ text: errorMessage.value, variant: 'error' })
    return null
  }
}

async function submitCreate() {
  if (!newPage.title.trim() || !newPage.path.trim()) return
  creating.value = true
  try {
    const page = await runAction(async () => store.createPage(newPage.title.trim(), newPage.path.trim()), 'Falha ao criar a pagina.')
    if (!page) return
    createDialog.value = false
    newPage.title = ''
    newPage.path = ''
    toast({ text: 'Pagina criada com sucesso.', variant: 'success' })
    openEditor(page.id)
  } finally {
    creating.value = false
  }
}

async function duplicatePage(pageId: string) {
  await runAction(async () => {
    await store.duplicate(pageId)
    toast({ text: 'Pagina duplicada.', variant: 'success' })
  }, 'Falha ao duplicar a pagina.')
}

async function archivePage(pageId: string) {
  await runAction(async () => {
    await store.archive(pageId)
    toast({ text: 'Pagina arquivada.', variant: 'success' })
  }, 'Falha ao arquivar a pagina.')
}

async function restorePage(pageId: string) {
  await runAction(async () => {
    await store.restore(pageId)
    toast({ text: 'Pagina restaurada.', variant: 'success' })
  }, 'Falha ao restaurar a pagina.')
}

async function saveConfig() {
  await runAction(async () => {
    await store.updateConfig({
      storeName: configForm.storeName,
      defaultLanguage: configForm.defaultLanguage,
      active: configForm.active,
      layoutTemplate: cloneLayout(configForm.layoutTemplate)
    })
    toast({ text: 'Configuracao e layout base salvos.', variant: 'success' })
  }, 'Falha ao salvar a configuracao.')
}

async function saveBaseLayout() {
  await runAction(async () => {
    await store.updateConfig({
      storeName: configForm.storeName,
      defaultLanguage: configForm.defaultLanguage,
      active: configForm.active,
      layoutTemplate: cloneLayout(configForm.layoutTemplate)
    })
    toast({ text: 'Layout base salvo.', variant: 'success' })
  }, 'Falha ao salvar o layout base.')
}

async function addHost() {
  const host = hostForm.host.trim()
  if (!host) return
  await runAction(async () => {
    await store.addHost(host)
    hostForm.host = ''
    toast({ text: 'Host adicionado.', variant: 'success' })
  }, 'Falha ao adicionar o host.')
}

async function removeHost(hostId: string) {
  await runAction(async () => {
    await store.removeHost(hostId)
    toast({ text: 'Host removido.', variant: 'success' })
  }, 'Falha ao remover o host.')
}

function addTemplateArea() {
  const normalized = newTemplateAreaName.value.trim()
  if (!normalized) return
  const next = cloneLayout(layoutTemplate.value)
  if (next.areas.some((area) => area.name === normalized)) return
  next.areas.push({ name: normalized, widgets: [] })
  configForm.layoutTemplate = next
  activeTemplateAreaName.value = normalized
  selectedTemplateWidgetId.value = null
  newTemplateAreaName.value = ''
  templateAreaDialog.value = false
}

function removeTemplateArea(areaName: string) {
  if (layoutTemplate.value.areas.length <= 1) return
  const next = cloneLayout(layoutTemplate.value)
  next.areas = next.areas.filter((area) => area.name !== areaName)
  configForm.layoutTemplate = next
  if (activeTemplateAreaName.value === areaName) activeTemplateAreaName.value = next.areas[0]?.name ?? 'header'
  if (selectedTemplateWidget.value && !next.areas.some((area) => area.widgets.some((widget) => widget.id === selectedTemplateWidget.value?.id))) {
    selectedTemplateWidgetId.value = null
  }
}

function openTemplateArea(areaName: string) {
  activeTemplateAreaName.value = areaName
}

function addTemplateWidget(widgetName: string) {
  const definition = findStorefrontWidget(widgetName)
  if (!definition) return
  const next = cloneLayout(layoutTemplate.value)
  const area = next.areas.find((item) => item.name === activeTemplateAreaName.value) || next.areas[0]
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
  configForm.layoutTemplate = next
  selectedTemplateWidgetId.value = widget.id || null
}

function selectTemplateWidget(widgetId: string) {
  selectedTemplateWidgetId.value = widgetId
}

function updateSelectedTemplateWidgetConfiguration(configuration: Record<string, any>) {
  if (!selectedTemplateWidget.value) return
  const next = cloneLayout(layoutTemplate.value)
  for (const area of next.areas) {
    const widget = area.widgets.find((item) => item.id === selectedTemplateWidget.value?.id)
    if (!widget) continue
    widget.configuration = deepClone(configuration)
    configForm.layoutTemplate = next
    return
  }
}

function removeTemplateWidget(areaName: string, widgetId: string) {
  const next = cloneLayout(layoutTemplate.value)
  const area = next.areas.find((item) => item.name === areaName)
  if (!area) return
  area.widgets = area.widgets.filter((item) => item.id !== widgetId).map((item, index) => ({ ...item, position: index }))
  configForm.layoutTemplate = next
  if (selectedTemplateWidgetId.value === widgetId) selectedTemplateWidgetId.value = null
}

function moveTemplateWidgetUp(areaName: string, widgetId: string) {
  moveTemplateWidget(areaName, widgetId, -1)
}

function moveTemplateWidgetDown(areaName: string, widgetId: string) {
  moveTemplateWidget(areaName, widgetId, 1)
}

function moveTemplateWidget(areaName: string, widgetId: string, delta: number) {
  const next = cloneLayout(layoutTemplate.value)
  const area = next.areas.find((item) => item.name === areaName)
  if (!area) return
  const sorted = [...area.widgets].sort((a, b) => a.position - b.position)
  const index = sorted.findIndex((item) => item.id === widgetId)
  const targetIndex = index + delta
  if (index === -1 || targetIndex < 0 || targetIndex >= sorted.length) return
  const [widget] = sorted.splice(index, 1)
  sorted.splice(targetIndex, 0, widget)
  area.widgets = sorted.map((item, idx) => ({ ...item, position: idx }))
  configForm.layoutTemplate = next
}
</script>

