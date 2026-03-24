<script setup lang="ts">
import { ref, computed } from 'vue'
import { $axios } from '@/helpers/integration/integration'
import notification from '@/helpers/utils/notification'
import DefaultLayout from '@/bin/platform/hermes/layouts/default.vue'

interface ImportResult {
  row: number
  code: string | null
  name: string | null
  success: boolean
  message: string
  productId: string | null
  created: boolean
}

const fileInput = ref<HTMLInputElement | null>(null)
const dragging = ref(false)
const selectedFile = ref<File | null>(null)
const preview = ref<string[][]>([])
const previewHeaders = ref<string[]>([])
const importing = ref(false)
const results = ref<ImportResult[] | null>(null)

const EXPECTED_HEADERS = [
  'Código do Produto',
  'Produto',
  'URL',
  'Categorias',
  'Descrição curta',
  'Descrição',
  'É virtual?',
  'Estoque',
  'Preço',
  'Permitir comprar mesmo sem estoque',
  'Peso',
  'Altura',
  'Comprimento',
  'Largura',
  'offline.mall::lang.product.ncm'
]

const summaryCreated = computed(
  () => results.value?.filter((r) => r.success && r.created).length ?? 0
)
const summaryUpdated = computed(
  () => results.value?.filter((r) => r.success && !r.created).length ?? 0
)
const summaryErrors = computed(() => results.value?.filter((r) => !r.success).length ?? 0)

function parseCsvLine(line: string): string[] {
  const fields: string[] = []
  let sb = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        sb += '"'
        i++
      } else inQuotes = !inQuotes
    } else if (c === ',' && !inQuotes) {
      fields.push(sb)
      sb = ''
    } else {
      sb += c
    }
  }
  fields.push(sb)
  return fields
}

function handleFile(file: File) {
  if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
    notification({ text: 'Apenas arquivos CSV são aceitos', variant: 'error' })
    return
  }
  selectedFile.value = file
  results.value = null
  const reader = new FileReader()
  reader.onload = (e) => {
    let text = (e.target?.result as string) ?? ''
    if (text.startsWith('\uFEFF')) text = text.slice(1)
    const lines = text.split(/\r?\n/).filter((l) => l.trim())
    if (lines.length < 2) return
    previewHeaders.value = parseCsvLine(lines[0])
    preview.value = lines.slice(1, 11).map((l) => parseCsvLine(l))
  }
  reader.readAsText(file, 'UTF-8')
}

function onDrop(e: DragEvent) {
  dragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) handleFile(file)
}

function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) handleFile(file)
}

function clearFile() {
  selectedFile.value = null
  preview.value = []
  previewHeaders.value = []
  results.value = null
  if (fileInput.value) fileInput.value.value = ''
}

async function doImport() {
  if (!selectedFile.value) return
  importing.value = true
  try {
    const form = new FormData()
    form.append('file', selectedFile.value)
    const response = await $axios.post('/api/v1/admin/products/import', form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    results.value = response.data.data as ImportResult[]
    notification({ text: response.data.message, variant: 'success' })
  } catch (err: any) {
    notification({ text: err.response?.data?.message ?? 'Erro na importação', variant: 'error' })
  } finally {
    importing.value = false
  }
}
</script>

<template>
  <DefaultLayout :icon="{ type: 'fa', icon: 'fa-light fa-paper text-[1.2rem]' }" :menu-items="[]">
    <div class="min-h-screen bg-slate-50 dark:bg-navy-900 p-6">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-slate-800 dark:text-navy-50">Importar Produtos</h1>
        <p class="mt-1 text-sm text-slate-500 dark:text-navy-300">
          Importe produtos em massa via arquivo CSV. Produtos existentes (mesmo código ou slug)
          serão atualizados.
        </p>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <!-- Left column: upload + preview -->
        <div class="xl:col-span-2 space-y-6">
          <!-- Drop zone -->
          <div
            class="relative rounded-2xl border-2 border-dashed transition-colors cursor-pointer"
            :class="
              dragging
                ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
                : 'border-slate-300 dark:border-navy-500 bg-white dark:bg-navy-700 hover:border-indigo-300'
            "
            @dragover.prevent="dragging = true"
            @dragleave.prevent="dragging = false"
            @drop.prevent="onDrop"
            @click="fileInput?.click()"
          >
            <input
              ref="fileInput"
              type="file"
              accept=".csv,text/csv"
              class="hidden"
              @change="onFileChange"
            />

            <div
              v-if="!selectedFile"
              class="flex flex-col items-center justify-center py-16 px-6 text-center"
            >
              <div
                class="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 dark:bg-indigo-900/40"
              >
                <i class="fa-light fa-file-csv text-3xl text-indigo-500"></i>
              </div>
              <p class="text-base font-semibold text-slate-700 dark:text-navy-100">
                Arraste o CSV aqui ou clique para selecionar
              </p>
              <p class="mt-1 text-sm text-slate-400 dark:text-navy-400">Somente arquivos .csv</p>
            </div>

            <div v-else class="flex items-center gap-4 p-5" @click.stop>
              <div
                class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30"
              >
                <i class="fa-light fa-file-csv text-2xl text-emerald-500"></i>
              </div>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-semibold text-slate-700 dark:text-navy-100">
                  {{ selectedFile.name }}
                </p>
                <p class="text-xs text-slate-400 dark:text-navy-400">
                  {{ (selectedFile.size / 1024).toFixed(1) }} KB · {{ preview.length }}+ linhas de
                  dados
                </p>
              </div>
              <button
                class="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 dark:hover:bg-navy-600 hover:text-red-500"
                title="Remover arquivo"
                @click.stop="clearFile"
              >
                <i class="fa-light fa-xmark text-lg"></i>
              </button>
            </div>
          </div>

          <!-- Preview table -->
          <div
            v-if="preview.length > 0"
            class="rounded-2xl border border-slate-200 dark:border-navy-600 bg-white dark:bg-navy-700 overflow-hidden"
          >
            <div
              class="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-navy-600"
            >
              <div>
                <h2 class="text-sm font-semibold text-slate-700 dark:text-navy-100">
                  Pré-visualização
                </h2>
                <p class="text-xs text-slate-400 dark:text-navy-400 mt-0.5">
                  Primeiras 10 linhas do arquivo
                </p>
              </div>
              <span
                class="rounded-full bg-slate-100 dark:bg-navy-600 px-3 py-1 text-xs font-medium text-slate-600 dark:text-navy-200"
              >
                {{ previewHeaders.length }} colunas
              </span>
            </div>
            <div class="overflow-x-auto">
              <table class="min-w-full text-xs">
                <thead>
                  <tr class="bg-slate-50 dark:bg-navy-800">
                    <th
                      v-for="header in previewHeaders"
                      :key="header"
                      class="whitespace-nowrap px-3 py-2 text-left font-semibold text-slate-500 dark:text-navy-300"
                    >
                      {{ header }}
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-navy-600">
                  <tr
                    v-for="(row, ri) in preview"
                    :key="ri"
                    class="hover:bg-slate-50 dark:hover:bg-navy-800/60"
                  >
                    <td
                      v-for="(cell, ci) in row"
                      :key="ci"
                      class="max-w-[160px] truncate px-3 py-2 text-slate-600 dark:text-navy-200"
                      :title="cell"
                    >
                      {{ cell }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Right column: help + action -->
        <div class="space-y-6">
          <!-- Import button -->
          <div
            class="rounded-2xl border border-slate-200 dark:border-navy-600 bg-white dark:bg-navy-700 p-5"
          >
            <h2 class="mb-4 text-sm font-semibold text-slate-700 dark:text-navy-100">
              Executar Importação
            </h2>
            <button
              :disabled="!selectedFile || importing"
              class="w-full rounded-xl py-3 text-sm font-semibold transition"
              :class="
                selectedFile && !importing
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                  : 'bg-slate-100 text-slate-400 dark:bg-navy-600 dark:text-navy-400 cursor-not-allowed'
              "
              @click="doImport"
            >
              <span v-if="importing" class="flex items-center justify-center gap-2">
                <i class="fa-light fa-spinner-third animate-spin"></i>
                Importando…
              </span>
              <span v-else class="flex items-center justify-center gap-2">
                <i class="fa-light fa-upload"></i>
                Importar CSV
              </span>
            </button>
            <p class="mt-3 text-xs text-slate-400 dark:text-navy-400 text-center">
              Produtos com mesmo código ou slug serão atualizados
            </p>
          </div>

          <!-- Column reference -->
          <div
            class="rounded-2xl border border-slate-200 dark:border-navy-600 bg-white dark:bg-navy-700 p-5"
          >
            <h2 class="mb-4 text-sm font-semibold text-slate-700 dark:text-navy-100">
              <i class="fa-light fa-circle-info mr-1.5 text-indigo-400"></i>
              Colunas esperadas
            </h2>
            <ul class="space-y-2">
              <li
                v-for="col in EXPECTED_HEADERS"
                :key="col"
                class="flex items-center gap-2 text-xs"
              >
                <i class="fa-light fa-check text-emerald-400 shrink-0"></i>
                <span class="font-mono text-slate-600 dark:text-navy-200">{{ col }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Results -->
      <div v-if="results" class="mt-8 space-y-5">
        <!-- Summary cards -->
        <div class="grid grid-cols-3 gap-4">
          <div
            class="rounded-2xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-900/20 p-5 text-center"
          >
            <p class="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {{ summaryCreated }}
            </p>
            <p class="mt-1 text-sm font-medium text-emerald-700 dark:text-emerald-300">Criados</p>
          </div>
          <div
            class="rounded-2xl border border-blue-200 dark:border-blue-900/40 bg-blue-50 dark:bg-blue-900/20 p-5 text-center"
          >
            <p class="text-3xl font-bold text-blue-600 dark:text-blue-400">{{ summaryUpdated }}</p>
            <p class="mt-1 text-sm font-medium text-blue-700 dark:text-blue-300">Atualizados</p>
          </div>
          <div
            class="rounded-2xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/20 p-5 text-center"
          >
            <p class="text-3xl font-bold text-red-600 dark:text-red-400">{{ summaryErrors }}</p>
            <p class="mt-1 text-sm font-medium text-red-700 dark:text-red-300">Erros</p>
          </div>
        </div>

        <!-- Detailed results table -->
        <div
          class="rounded-2xl border border-slate-200 dark:border-navy-600 bg-white dark:bg-navy-700 overflow-hidden"
        >
          <div class="px-5 py-4 border-b border-slate-100 dark:border-navy-600">
            <h2 class="text-sm font-semibold text-slate-700 dark:text-navy-100">
              Resultado detalhado
            </h2>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full text-sm">
              <thead>
                <tr class="bg-slate-50 dark:bg-navy-800">
                  <th
                    class="w-12 px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-navy-300"
                  >
                    #
                  </th>
                  <th
                    class="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-navy-300"
                  >
                    Código
                  </th>
                  <th
                    class="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-navy-300"
                  >
                    Produto
                  </th>
                  <th
                    class="w-24 px-4 py-3 text-center text-xs font-semibold text-slate-500 dark:text-navy-300"
                  >
                    Status
                  </th>
                  <th
                    class="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-navy-300"
                  >
                    Mensagem
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-navy-600">
                <tr
                  v-for="r in results"
                  :key="r.row"
                  class="hover:bg-slate-50 dark:hover:bg-navy-800/60 transition-colors"
                >
                  <td class="px-4 py-3 text-xs text-slate-400 dark:text-navy-400">{{ r.row }}</td>
                  <td class="px-4 py-3 font-mono text-xs text-slate-600 dark:text-navy-200">
                    {{ r.code ?? '—' }}
                  </td>
                  <td class="px-4 py-3 text-slate-700 dark:text-navy-100">{{ r.name ?? '—' }}</td>
                  <td class="px-4 py-3 text-center">
                    <span
                      v-if="r.success"
                      class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
                      :class="
                        r.created
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                      "
                    >
                      <i class="fa-light" :class="r.created ? 'fa-plus' : 'fa-pencil'"></i>
                      {{ r.created ? 'Criado' : 'Atualizado' }}
                    </span>
                    <span
                      v-else
                      class="inline-flex items-center gap-1 rounded-full bg-red-100 dark:bg-red-900/40 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:text-red-300"
                    >
                      <i class="fa-light fa-triangle-exclamation"></i>
                      Erro
                    </span>
                  </td>
                  <td class="px-4 py-3 text-xs text-slate-500 dark:text-navy-300">
                    {{ r.message }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div></DefaultLayout
  >
</template>
