<script lang="ts" setup>
import DefaultLayout from '@/bin/platform/hermes/layouts/default.vue'
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { $axios } from '@/helpers/integration/integration'
const route = useRoute()

const productId = computed(() => route.params.productId as string)

// ── State ──────────────────────────────────────────────────────────────────
type MediaItem = {
  id: string
  mediaType: string
  originalFilename: string
  mimeType: string
  fileSize: number
  originalWidth: number | null
  originalHeight: number | null
  description: string | null
  displayOrder: number
  originalUrl: string | null
  thumbnailUrl: string | null
  mediumUrl: string | null
  createdAt: string
}

const activeTab = ref<'images' | 'files'>('images')
const images = ref<MediaItem[]>([])
const files = ref<MediaItem[]>([])
const loading = ref(false)
const uploadingImages = ref(false)
const uploadingFiles = ref(false)
const uploadProgress = ref(0)
const deletingId = ref<string | null>(null)
const isDraggingImages = ref(false)
const isDraggingFiles = ref(false)
const imageInputRef = ref<HTMLInputElement | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const errorMsg = ref<string | null>(null)
const successMsg = ref<string | null>(null)

// ── API ─────────────────────────────────────────────────────────────────────
async function loadMedia() {
  loading.value = true
  try {
    const [imgRes, fileRes] = await Promise.all([
      $axios.get(`/api/v1/admin/products/${productId.value}/media`, {
        params: { type: 'GALLERY' }
      }),
      $axios.get(`/api/v1/admin/products/${productId.value}/media`, {
        params: { type: 'DOCUMENT' }
      })
    ])
    images.value = (imgRes.data ?? []).sort(
      (a: MediaItem, b: MediaItem) => a.displayOrder - b.displayOrder
    )
    files.value = (fileRes.data ?? []).sort(
      (a: MediaItem, b: MediaItem) => a.displayOrder - b.displayOrder
    )
  } catch (e) {
    showError('Erro ao carregar mídias')
  } finally {
    loading.value = false
  }
}

async function uploadFiles(fileList: FileList, mediaType: 'GALLERY' | 'DOCUMENT') {
  const isImage = mediaType === 'GALLERY'
  if (isImage) uploadingImages.value = true
  else uploadingFiles.value = true
  uploadProgress.value = 0
  errorMsg.value = null

  const total = fileList.length
  let done = 0

  for (const file of Array.from(fileList)) {
    const form = new FormData()
    form.append('file', file)
    form.append('mediaType', mediaType)
    try {
      const res = await $axios.post(`/api/v1/admin/products/${productId.value}/media`, form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      if (isImage) images.value.push(res.data)
      else files.value.push(res.data)
    } catch (e: any) {
      showError(`Falha ao enviar "${file.name}"`)
    }
    done++
    uploadProgress.value = Math.round((done / total) * 100)
  }

  if (isImage) uploadingImages.value = false
  else uploadingFiles.value = false
  uploadProgress.value = 0
  showSuccess(`${done} arquivo(s) enviado(s) com sucesso`)
}

async function deleteMedia(item: MediaItem) {
  if (!confirm(`Remover "${item.originalFilename}"?`)) return
  deletingId.value = item.id
  try {
    await $axios.delete(`/api/v1/admin/products/${productId.value}/media/${item.id}`)
    images.value = images.value.filter((i) => i.id !== item.id)
    files.value = files.value.filter((i) => i.id !== item.id)
    showSuccess('Mídia removida')
  } catch {
    showError('Erro ao remover mídia')
  } finally {
    deletingId.value = null
  }
}

async function moveMedia(item: MediaItem, direction: -1 | 1, list: MediaItem[]) {
  const idx = list.findIndex((i) => i.id === item.id)
  const newIdx = idx + direction
  if (newIdx < 0 || newIdx >= list.length) return
  // Swap display orders
  const neighbor = list[newIdx]
  const tmpOrder = item.displayOrder
  item.displayOrder = neighbor.displayOrder
  neighbor.displayOrder = tmpOrder
  list.splice(idx, 1)
  list.splice(newIdx, 0, item)
  // Persist both
  await Promise.all([
    $axios.patch(`/api/v1/admin/products/${productId.value}/media/${item.id}`, {
      displayOrder: item.displayOrder
    }),
    $axios.patch(`/api/v1/admin/products/${productId.value}/media/${neighbor.id}`, {
      displayOrder: neighbor.displayOrder
    })
  ])
}

// ── Drag & Drop ─────────────────────────────────────────────────────────────
function onDrop(event: DragEvent, mediaType: 'GALLERY' | 'DOCUMENT') {
  if (mediaType === 'GALLERY') isDraggingImages.value = false
  else isDraggingFiles.value = false
  const files = event.dataTransfer?.files
  if (files?.length) uploadFiles(files, mediaType)
}

function onFileInputChange(event: Event, mediaType: 'GALLERY' | 'DOCUMENT') {
  const input = event.target as HTMLInputElement
  if (input.files?.length) uploadFiles(input.files, mediaType)
  input.value = ''
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fileIcon(mimeType: string): string {
  if (!mimeType) return '📄'
  if (mimeType.startsWith('video/')) return '🎥'
  if (mimeType === 'application/pdf') return '📋'
  if (mimeType.includes('word')) return '📝'
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊'
  return '📄'
}

function showError(msg: string) {
  errorMsg.value = msg
  setTimeout(() => {
    errorMsg.value = null
  }, 4000)
}
function showSuccess(msg: string) {
  successMsg.value = msg
  setTimeout(() => {
    successMsg.value = null
  }, 3000)
}

onMounted(() => {
  document.body.classList.remove('has-min-sidebar', 'is-header-blur')

  loadMedia()
})
</script>

<template>
  <DefaultLayout :icon="{ type: 'material', icon: 'image' }" :menu-items="[]">
    <div class="mx-auto max-w-5xl space-y-5 p-4 md:p-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-lg font-semibold text-slate-800 dark:text-navy-50">Mídias do produto</h1>
          <p class="mt-0.5 text-xs text-slate-500 dark:text-navy-300 font-mono">{{ productId }}</p>
        </div>
        <button
          class="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:border-slate-400 dark:border-navy-500 dark:bg-navy-600 dark:text-navy-100"
          :disabled="loading"
          @click="loadMedia"
        >
          <svg
            class="h-3.5 w-3.5"
            :class="loading ? 'animate-spin' : ''"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Atualizar
        </button>
      </div>

      <!-- Toast messages -->
      <transition name="fade">
        <div
          v-if="errorMsg"
          class="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300"
        >
          {{ errorMsg }}
        </div>
      </transition>
      <transition name="fade">
        <div
          v-if="successMsg"
          class="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300"
        >
          {{ successMsg }}
        </div>
      </transition>

      <!-- Tabs -->
      <div
        class="flex gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-navy-600 dark:bg-navy-800"
      >
        <button
          class="flex-1 rounded-lg px-4 py-2 text-sm font-medium transition"
          :class="
            activeTab === 'images'
              ? 'bg-white text-slate-800 shadow-sm dark:bg-navy-600 dark:text-navy-50'
              : 'text-slate-500 hover:text-slate-700 dark:text-navy-300 dark:hover:text-navy-100'
          "
          @click="activeTab = 'images'"
        >
          🖼️ Imagens
          <span
            class="ml-1.5 rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300"
            >{{ images.length }}</span
          >
        </button>
        <button
          class="flex-1 rounded-lg px-4 py-2 text-sm font-medium transition"
          :class="
            activeTab === 'files'
              ? 'bg-white text-slate-800 shadow-sm dark:bg-navy-600 dark:text-navy-50'
              : 'text-slate-500 hover:text-slate-700 dark:text-navy-300 dark:hover:text-navy-100'
          "
          @click="activeTab = 'files'"
        >
          📁 Arquivos
          <span
            class="ml-1.5 rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300"
            >{{ files.length }}</span
          >
        </button>
      </div>

      <!-- ── IMAGES TAB ── -->
      <div v-if="activeTab === 'images'" class="space-y-4">
        <!-- Upload zone -->
        <div
          class="relative flex min-h-[140px] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed transition"
          :class="
            isDraggingImages
              ? 'border-indigo-400 bg-indigo-50 dark:border-indigo-500 dark:bg-indigo-900/20'
              : 'border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50/50 dark:border-navy-500 dark:bg-navy-800/40 dark:hover:border-indigo-500'
          "
          @dragover.prevent="isDraggingImages = true"
          @dragleave.prevent="isDraggingImages = false"
          @drop.prevent="onDrop($event, 'GALLERY')"
          @click="imageInputRef?.click()"
        >
          <input
            ref="imageInputRef"
            type="file"
            accept="image/*"
            multiple
            class="hidden"
            @change="onFileInputChange($event, 'GALLERY')"
          />
          <div v-if="uploadingImages" class="flex flex-col items-center gap-2">
            <svg class="h-8 w-8 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24">
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              />
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <div class="h-1.5 w-48 rounded-full bg-slate-200 dark:bg-navy-600">
              <div
                class="h-1.5 rounded-full bg-indigo-500 transition-all"
                :style="{ width: `${uploadProgress}%` }"
              ></div>
            </div>
            <span class="text-xs text-slate-500">Enviando... {{ uploadProgress }}%</span>
          </div>
          <template v-else>
            <div
              class="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30"
            >
              <svg
                class="h-6 w-6 text-indigo-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.5"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div class="text-center">
              <p class="text-sm font-medium text-slate-600 dark:text-navy-200">
                Arraste imagens ou clique para selecionar
              </p>
              <p class="mt-0.5 text-xs text-slate-400 dark:text-navy-400">
                PNG, JPG, WebP · máx 10 MB cada
              </p>
            </div>
          </template>
        </div>

        <!-- Loading skeleton -->
        <div v-if="loading" class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          <div
            v-for="n in 4"
            :key="n"
            class="aspect-square animate-pulse rounded-xl bg-slate-200 dark:bg-navy-600"
          ></div>
        </div>

        <!-- Empty state -->
        <div
          v-else-if="!images.length"
          class="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center dark:border-navy-600 dark:bg-navy-800/30"
        >
          <p class="text-sm text-slate-400 dark:text-navy-400">Nenhuma imagem adicionada ainda.</p>
        </div>

        <!-- Image grid -->
        <div v-else class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          <div
            v-for="(img, idx) in images"
            :key="img.id"
            class="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-sm dark:border-navy-600 dark:bg-navy-700"
          >
            <!-- Thumbnail -->
            <img
              v-if="img.thumbnailUrl"
              :src="img.thumbnailUrl"
              :alt="img.originalFilename"
              class="h-full w-full object-cover"
            />
            <div v-else class="flex h-full items-center justify-center text-slate-400">
              <svg class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>

            <!-- Primary badge -->
            <div
              v-if="idx === 0"
              class="absolute left-2 top-2 rounded-full bg-indigo-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow"
            >
              Principal
            </div>

            <!-- Hover overlay -->
            <div
              class="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
            >
              <!-- Reorder -->
              <div class="flex gap-1">
                <button
                  class="rounded-md bg-white/20 p-1.5 text-white transition hover:bg-white/40"
                  :disabled="idx === 0"
                  title="Mover para esquerda"
                  @click.stop="moveMedia(img, -1, images)"
                >
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <button
                  class="rounded-md bg-white/20 p-1.5 text-white transition hover:bg-white/40"
                  :disabled="idx === images.length - 1"
                  title="Mover para direita"
                  @click.stop="moveMedia(img, 1, images)"
                >
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
              <!-- Open original -->
              <a
                v-if="img.originalUrl"
                :href="img.originalUrl"
                target="_blank"
                class="rounded-md bg-white/20 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/40"
                @click.stop
                >Ver original</a
              >
              <!-- Delete -->
              <button
                class="rounded-md bg-red-500/80 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-500"
                :disabled="deletingId === img.id"
                @click.stop="deleteMedia(img)"
              >
                <span v-if="deletingId === img.id">Removendo...</span>
                <span v-else>Remover</span>
              </button>
            </div>

            <!-- Filename caption -->
            <div
              class="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5"
            >
              <p class="truncate text-[10px] text-white/90">{{ img.originalFilename }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- ── FILES TAB ── -->
      <div v-else-if="activeTab === 'files'" class="space-y-4">
        <!-- Upload zone -->
        <div
          class="relative flex min-h-[140px] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed transition"
          :class="
            isDraggingFiles
              ? 'border-indigo-400 bg-indigo-50 dark:border-indigo-500 dark:bg-indigo-900/20'
              : 'border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50/50 dark:border-navy-500 dark:bg-navy-800/40 dark:hover:border-indigo-500'
          "
          @dragover.prevent="isDraggingFiles = true"
          @dragleave.prevent="isDraggingFiles = false"
          @drop.prevent="onDrop($event, 'DOCUMENT')"
          @click="fileInputRef?.click()"
        >
          <input
            ref="fileInputRef"
            type="file"
            multiple
            class="hidden"
            @change="onFileInputChange($event, 'DOCUMENT')"
          />
          <div v-if="uploadingFiles" class="flex flex-col items-center gap-2">
            <svg class="h-8 w-8 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24">
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              />
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <div class="h-1.5 w-48 rounded-full bg-slate-200 dark:bg-navy-600">
              <div
                class="h-1.5 rounded-full bg-indigo-500 transition-all"
                :style="{ width: `${uploadProgress}%` }"
              ></div>
            </div>
            <span class="text-xs text-slate-500">Enviando... {{ uploadProgress }}%</span>
          </div>
          <template v-else>
            <div
              class="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30"
            >
              <svg
                class="h-6 w-6 text-indigo-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.5"
                  d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div class="text-center">
              <p class="text-sm font-medium text-slate-600 dark:text-navy-200">
                Arraste arquivos ou clique para selecionar
              </p>
              <p class="mt-0.5 text-xs text-slate-400 dark:text-navy-400">
                PDF, vídeos, documentos · máx 10 MB cada
              </p>
            </div>
          </template>
        </div>

        <!-- Loading skeleton -->
        <div v-if="loading" class="space-y-2">
          <div
            v-for="n in 3"
            :key="n"
            class="h-14 animate-pulse rounded-xl bg-slate-200 dark:bg-navy-600"
          ></div>
        </div>

        <!-- Empty state -->
        <div
          v-else-if="!files.length"
          class="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center dark:border-navy-600 dark:bg-navy-800/30"
        >
          <p class="text-sm text-slate-400 dark:text-navy-400">Nenhum arquivo adicionado ainda.</p>
        </div>

        <!-- File list -->
        <div v-else class="space-y-2">
          <div
            v-for="(file, idx) in files"
            :key="file.id"
            class="flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-navy-600 dark:bg-navy-700"
          >
            <!-- Icon -->
            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xl dark:bg-navy-600"
            >
              {{ fileIcon(file.mimeType) }}
            </div>

            <!-- Info -->
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-slate-700 dark:text-navy-100">
                {{ file.originalFilename }}
              </p>
              <p class="text-[11px] text-slate-400 dark:text-navy-400">
                {{ file.mimeType }} · {{ formatBytes(file.fileSize) }}
              </p>
            </div>

            <!-- Actions -->
            <div class="flex shrink-0 items-center gap-1">
              <!-- Reorder -->
              <button
                class="rounded p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30 dark:hover:bg-navy-600 dark:hover:text-navy-200"
                :disabled="idx === 0"
                title="Mover para cima"
                @click="moveMedia(file, -1, files)"
              >
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 15l7-7 7 7"
                  />
                </svg>
              </button>
              <button
                class="rounded p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30 dark:hover:bg-navy-600 dark:hover:text-navy-200"
                :disabled="idx === files.length - 1"
                title="Mover para baixo"
                @click="moveMedia(file, 1, files)"
              >
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              <!-- Open -->
              <a
                v-if="file.originalUrl"
                :href="file.originalUrl"
                target="_blank"
                class="rounded p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-navy-600 dark:hover:text-navy-200"
                title="Baixar / Ver"
              >
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
              <!-- Delete -->
              <button
                class="rounded p-1.5 text-red-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40 dark:hover:bg-red-900/30"
                :disabled="deletingId === file.id"
                title="Remover"
                @click="deleteMedia(file)"
              >
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </DefaultLayout>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
