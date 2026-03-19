<template>
  <transition name="fade">
    <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4">
      <div class="w-full max-w-xl rounded-2xl bg-white shadow-2xl dark:bg-navy-750">
        <div class="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-navy-700">
          <div>
            <h3 class="text-sm font-semibold text-slate-700 dark:text-navy-100">{{ product?.name }}</h3>
            <p class="text-xs text-slate-400">Selecione a variante para adicionar ao carrinho</p>
          </div>
          <button class="text-slate-400 transition hover:text-slate-600 dark:hover:text-navy-100" @click="emit('close')">
            <em class="fa-solid fa-xmark"></em>
          </button>
        </div>

        <div class="space-y-4 px-5 py-4">
          <div v-for="group in optionGroups" :key="group.name" class="space-y-2">
            <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">{{ group.name }}</p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="value in group.values"
                :key="value"
                class="rounded-full border px-3 py-1.5 text-xs font-medium transition"
                :class="selectedOptions[group.name] === value
                  ? 'border-primary bg-primary text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-primary/40 hover:text-primary dark:border-navy-600 dark:bg-navy-700 dark:text-navy-200'"
                @click="selectedOptions[group.name] = value"
              >
                {{ value }}
              </button>
            </div>
          </div>

          <div class="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-navy-700 dark:bg-navy-800/40">
            <p class="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Combinacao selecionada</p>
            <template v-if="selectedVariant">
              <div class="space-y-1">
                <p class="text-sm font-medium text-slate-700 dark:text-navy-100">{{ labelFor(selectedVariant) }}</p>
                <div class="flex items-center gap-3 text-xs">
                  <span class="font-semibold text-primary">{{ formatCurrency(selectedVariant.price) }}</span>
                  <span :class="selectedVariant.inStock ? 'text-success' : 'text-error'">
                    {{ selectedVariant.inStock ? 'Em estoque' : 'Sem estoque' }}
                  </span>
                  <span class="text-slate-400">estoque: {{ selectedVariant.stock }}</span>
                </div>
              </div>
            </template>
            <p v-else class="text-sm text-slate-400">Escolha uma combinacao valida para continuar.</p>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 border-t border-slate-100 px-5 py-4 dark:border-navy-700">
          <button class="rounded-lg px-4 py-2 text-sm text-slate-500 transition hover:bg-slate-100 dark:hover:bg-navy-700" @click="emit('close')">
            Cancelar
          </button>
          <button
            class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="!selectedVariant"
            @click="confirmSelection"
          >
            Adicionar variante
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script lang="ts" setup>
import { computed, reactive, watch } from 'vue'
import type { PosProductVariant, PosSearchProduct } from '../store/usePosStore'

const props = defineProps<{
  open: boolean
  product: PosSearchProduct | null
}>()

const emit = defineEmits<{
  close: []
  confirm: [variant: PosProductVariant]
}>()

const selectedOptions = reactive<Record<string, string>>({})

const optionGroups = computed(() => {
  const groups = new Map<string, Set<string>>()
  for (const variant of props.product?.variants ?? []) {
    Object.entries(variant.optionValues ?? {}).forEach(([name, value]) => {
      if (!groups.has(name)) groups.set(name, new Set())
      groups.get(name)!.add(value)
    })
  }
  return Array.from(groups.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, values]) => ({ name, values: Array.from(values).sort() }))
})

const selectedVariant = computed(() => {
  return (props.product?.variants ?? []).find((variant) => {
    const optionValues = variant.optionValues ?? {}
    return optionGroups.value.every((group) => selectedOptions[group.name] === optionValues[group.name])
  }) ?? null
})

watch(
  () => props.open,
  (open) => {
    if (!open) return
    Object.keys(selectedOptions).forEach((key) => delete selectedOptions[key])
  }
)

function formatCurrency(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function labelFor(variant: PosProductVariant) {
  return Object.entries(variant.optionValues ?? {})
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}: ${value}`)
    .join(' | ') || variant.name
}

function confirmSelection() {
  if (!selectedVariant.value) return
  emit('confirm', selectedVariant.value)
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
