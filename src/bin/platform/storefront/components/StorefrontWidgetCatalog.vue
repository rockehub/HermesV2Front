<template>
  <section
    class="rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-navy-700 dark:bg-navy-800"
  >
    <div class="border-b border-slate-100 px-6 py-5 dark:border-navy-700">
      <h2 class="text-lg font-semibold text-slate-900 dark:text-navy-50">Widgets</h2>
      <p class="mt-1 text-sm text-slate-500 dark:text-navy-300">
        Disponíveis para {{ pageTypeLabel }}.
      </p>
    </div>

    <div class="space-y-2 px-4 py-4">
      <button
        v-for="widget in filteredWidgets"
        :key="widget.name"
        class="flex w-full items-start gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-left transition hover:border-slate-300 hover:bg-slate-50 dark:border-navy-600 dark:hover:border-navy-500 dark:hover:bg-navy-700/40"
        type="button"
        @click="$emit('select', widget.name)"
      >
        <span
          class="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary"
        >
          <em class="fa-light fa-cubes-stacked text-sm"></em>
        </span>
        <span class="min-w-0 flex-1">
          <span class="block text-sm font-semibold text-slate-800 dark:text-navy-50">
            {{ widget.title }}
          </span>
          <span class="mt-1 block text-xs text-slate-400 dark:text-navy-400">
            {{ widget.description }}
          </span>
        </span>
      </button>

      <div
        v-if="!filteredWidgets.length"
        class="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-400 dark:border-navy-600 dark:bg-navy-700/30 dark:text-navy-400"
      >
        Nenhum widget disponível para esse tipo de página.
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import type { StorefrontPageType } from '../composables/useStorefrontApi'
import { storefrontWidgets } from '../widgets'

const props = defineProps<{
  pageType: StorefrontPageType
}>()

defineEmits<{
  (event: 'select', widgetName: string): void
}>()

const filteredWidgets = computed(() =>
  storefrontWidgets.filter((widget) => widget.supportsPageType(props.pageType))
)

const pageTypeLabel = computed(() => props.pageType.toLowerCase())
</script>
