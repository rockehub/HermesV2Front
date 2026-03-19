<template>
  <teleport to="body">
    <div
      v-if="show"
      class="fixed inset-0 z-[99999] flex items-center justify-center px-4"
      @keydown.esc="emit('close')"
      tabindex="-1"
    >
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        @click="emit('close')"
      />

      <!-- Panel -->
      <div class="relative w-[420px] rounded-xl bg-white dark:bg-navy-750 shadow-2xl ring-1 ring-slate-200 dark:ring-navy-600 p-6">
        <!-- Header -->
        <div class="flex items-center justify-between mb-5">
          <div class="flex items-center gap-2">
            <em class="fa-solid fa-sliders text-primary"></em>
            <h3 class="text-base font-semibold text-slate-700 dark:text-navy-100">
              Configurar Menu
            </h3>
          </div>
          <button
            class="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-navy-600 transition-colors"
            @click="emit('close')"
          >
            <em class="fa-solid fa-times text-slate-400"></em>
          </button>
        </div>

        <!-- Info do item (readonly) -->
        <div class="mb-4 flex items-center gap-2 rounded-lg bg-slate-50 dark:bg-navy-800 px-3 py-2 text-xs text-slate-400 dark:text-navy-300">
          <em :class="isBackendItem ? 'fa-solid fa-server text-primary/60' : 'fa-solid fa-puzzle-piece text-warning/70'"></em>
          <span class="font-mono font-semibold text-slate-600 dark:text-navy-100">{{ itemBadge }}</span>
        </div>

        <!-- Preview do ícone -->
        <div class="flex justify-center mb-5">
          <div
            class="flex h-14 w-14 items-center justify-center rounded-xl shadow-inner ring-1 ring-slate-200 dark:ring-navy-600"
            :style="previewColor ? `background: ${previewColor}22; color: ${previewColor}` : ''"
          >
            <em
              :class="[previewIcon || 'fa-solid fa-database', 'text-2xl']"
              :style="previewColor ? `color: ${previewColor}` : ''"
            />
          </div>
        </div>

        <!-- Formulário -->
        <div class="space-y-4">
          <!-- Display Name -->
          <div>
            <label class="mb-1 block text-xs font-medium text-slate-500 dark:text-navy-300">
              Nome de exibição
            </label>
            <input
              v-model="form.displayName"
              type="text"
              class="form-input w-full rounded-lg border border-slate-200 dark:border-navy-500 bg-white dark:bg-navy-700 px-3 py-2 text-sm text-slate-700 dark:text-navy-100 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
              placeholder="ex: Pedidos, Catálogo..."
            />
          </div>

          <!-- Ícone -->
          <div>
            <label class="mb-1 block text-xs font-medium text-slate-500 dark:text-navy-300">
              Ícone <span class="text-slate-400">(FA class)</span>
            </label>
            <input
              v-model="form.icon"
              type="text"
              class="form-input w-full rounded-lg border border-slate-200 dark:border-navy-500 bg-white dark:bg-navy-700 px-3 py-2 text-sm font-mono text-slate-700 dark:text-navy-100 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
              placeholder="fa-solid fa-database"
            />
            <!-- Quick picks -->
            <div class="mt-2 flex flex-wrap gap-1.5">
              <button
                v-for="icon in quickIcons"
                :key="icon"
                class="flex h-7 w-7 items-center justify-center rounded-md border transition-colors"
                :class="form.icon === icon
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-slate-200 dark:border-navy-500 hover:border-primary/50 hover:text-primary'"
                :title="icon"
                @click="form.icon = icon"
              >
                <em :class="icon" class="text-sm"></em>
              </button>
            </div>
          </div>

          <!-- Cor -->
          <div>
            <label class="mb-1 block text-xs font-medium text-slate-500 dark:text-navy-300">
              Cor do ícone
            </label>
            <div class="flex items-center gap-3">
              <input
                v-model="form.color"
                type="color"
                class="h-9 w-12 cursor-pointer rounded-lg border border-slate-200 dark:border-navy-500 p-0.5"
              />
              <input
                v-model="form.color"
                type="text"
                class="form-input flex-1 rounded-lg border border-slate-200 dark:border-navy-500 bg-white dark:bg-navy-700 px-3 py-2 text-sm font-mono text-slate-700 dark:text-navy-100 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                placeholder="#FF6B6B"
              />
              <button
                class="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-navy-200 transition-colors"
                title="Limpar cor"
                @click="form.color = ''"
              >
                <em class="fa-solid fa-xmark"></em>
              </button>
            </div>
            <!-- Paleta rápida -->
            <div class="mt-2 flex gap-1.5">
              <button
                v-for="c in colorPalette"
                :key="c"
                class="h-5 w-5 rounded-full ring-offset-1 transition-all"
                :class="form.color === c ? 'ring-2 ring-primary' : 'hover:ring-2 hover:ring-slate-300'"
                :style="`background: ${c}`"
                @click="form.color = c"
              />
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="mt-6 flex justify-end gap-3">
          <button
            class="btn px-4 py-2 rounded-lg bg-slate-100 dark:bg-navy-600 text-slate-600 dark:text-navy-100 hover:bg-slate-200 dark:hover:bg-navy-500 text-sm font-medium transition-colors"
            @click="emit('close')"
          >
            Cancelar
          </button>
          <button
            class="btn px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-focus text-sm font-medium transition-colors flex items-center gap-2"
            :disabled="saving"
            @click="save"
          >
            <em v-if="saving" class="fa-solid fa-spinner fa-spin text-xs"></em>
            <em v-else class="fa-solid fa-check text-xs"></em>
            Salvar
          </button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useMenuStore } from '@/stores/menuStore'

const props = defineProps<{
  show: boolean
  item: {
    /** Presente apenas para itens que vêm do backend (Hermes) */
    entityName?: string
    /** Nome da rota — usado como chave para itens frontend-only */
    routeName?: string
    displayName: string
    icon: { icon: string; type: string }
    color?: string
  } | null
}>()

const emit = defineEmits<{
  close: []
}>()

const menuStore = useMenuStore()
const saving = ref(false)

const form = ref({ displayName: '', icon: '', color: '' })

const quickIcons = [
  'fa-solid fa-database', 'fa-solid fa-boxes-stacked', 'fa-solid fa-cart-shopping',
  'fa-solid fa-users', 'fa-solid fa-tags', 'fa-solid fa-image',
  'fa-solid fa-layer-group', 'fa-solid fa-store', 'fa-solid fa-truck',
  'fa-solid fa-credit-card', 'fa-solid fa-chart-bar', 'fa-solid fa-star',
  'fa-solid fa-wrench', 'fa-solid fa-globe', 'fa-solid fa-file-lines',
  'fa-solid fa-shield-halved',
]

const colorPalette = [
  '#FF6B6B', '#F4A261', '#FFD23F', '#06D6A0',
  '#5BC0EB', '#3A86FF', '#8B5CF6', '#EC4899',
  '#64748B', '#0F172A',
]

/** true = item vem do backend Hermes; false = item definido no frontend */
const isBackendItem = computed(() => !!props.item?.entityName)

const itemBadge = computed(() =>
  isBackendItem.value ? 'Backend · ' + props.item?.entityName : 'Frontend · ' + (props.item?.routeName ?? props.item?.displayName)
)

watch(() => props.item, (item) => {
  if (!item) return
  form.value = {
    displayName: item.displayName,
    icon: item.icon?.icon || 'fa-solid fa-database',
    color: item.color || ''
  }
}, { immediate: true })

const previewIcon  = computed(() => form.value.icon  || 'fa-solid fa-database')
const previewColor = computed(() => form.value.color || null)

async function save() {
  if (!props.item) return
  saving.value = true
  try {
    if (isBackendItem.value) {
      // Persiste no banco via API
      await menuStore.updateMenuConfig(
        props.item.entityName!,
        form.value.icon,
        form.value.displayName,
        form.value.color
      )
    } else {
      // Persiste no localStorage
      menuStore.saveLocalMenuConfig(
        { name: props.item.routeName ?? '', label: props.item.displayName },
        {
          displayName: form.value.displayName,
          icon: { icon: form.value.icon, type: form.value.icon.startsWith('fa') ? 'fa' : 'material' },
          color: form.value.color || undefined
        }
      )
    }
    emit('close')
  } finally {
    saving.value = false
  }
}
</script>
