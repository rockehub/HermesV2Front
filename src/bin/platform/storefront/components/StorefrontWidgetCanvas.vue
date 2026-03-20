<template>
  <section
    class="rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-navy-700 dark:bg-navy-800"
  >
    <div class="border-b border-slate-100 px-6 py-5 dark:border-navy-700">
      <h2 class="text-lg font-semibold text-slate-900 dark:text-navy-50">Canvas</h2>
      <p class="mt-1 text-sm text-slate-500 dark:text-navy-300">
        Organize áreas e widgets da página selecionada.
      </p>
    </div>

    <div class="space-y-5 px-6 py-5">
      <div
        v-if="!layout.areas.length"
        class="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-400 dark:border-navy-600 dark:bg-navy-700/30 dark:text-navy-400"
      >
        Nenhuma área criada ainda.
      </div>

      <div
        v-for="area in layout.areas"
        :key="area.name"
        class="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4 dark:border-navy-600 dark:bg-navy-700/30"
      >
        <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Area</p>
            <h3 class="mt-1 text-base font-semibold text-slate-800 dark:text-navy-50">
              {{ area.name }}
            </h3>
          </div>

          <div class="flex flex-wrap gap-2">
            <button
              class="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 dark:bg-navy-800 dark:text-navy-100 dark:hover:bg-navy-600"
              type="button"
              @click="emit('add-widget', area.name)"
            >
              Add widget
            </button>
            <button
              class="rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/30"
              type="button"
              :disabled="layout.areas.length <= 1"
              @click="emit('remove-area', area.name)"
            >
              Remove area
            </button>
          </div>
        </div>

        <div
          v-if="!area.widgets.length"
          class="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-400 dark:border-navy-600 dark:bg-navy-800/60 dark:text-navy-400"
        >
          No widgets in this area yet.
        </div>

        <div v-else class="space-y-3">
          <button
            v-for="widget in sortedWidgets(area.widgets)"
            :key="widget.id ?? `${area.name}-${widget.position}-${widget.name}`"
            class="block w-full rounded-[22px] border bg-white p-4 text-left transition dark:bg-navy-800"
            :class="
              widget.id === selectedWidgetId
                ? 'border-primary shadow-sm ring-2 ring-primary/20'
                : 'border-slate-200 hover:border-slate-300 dark:border-navy-600 dark:hover:border-navy-500'
            "
            type="button"
            :disabled="!widget.id"
            @click="selectWidget(widget.id)"
          >
            <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div class="text-sm font-semibold text-slate-800 dark:text-navy-50">
                  {{ widget.name }}
                </div>
                <div class="mt-1 text-xs text-slate-400 dark:text-navy-400">
                  Position {{ widget.position }}
                </div>
              </div>

              <div class="flex flex-wrap gap-2">
                <button
                  class="rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 dark:text-navy-200 dark:hover:bg-navy-700"
                  type="button"
                  :disabled="!widget.id"
                  @click.stop="moveUp(area.name, widget.id)"
                >
                  Up
                </button>
                <button
                  class="rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 dark:text-navy-200 dark:hover:bg-navy-700"
                  type="button"
                  :disabled="!widget.id"
                  @click.stop="moveDown(area.name, widget.id)"
                >
                  Down
                </button>
                <button
                  class="rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/30"
                  type="button"
                  :disabled="!widget.id"
                  @click.stop="removeWidget(area.name, widget.id)"
                >
                  Remove
                </button>
              </div>
            </div>

            <div
              class="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-navy-600 dark:bg-navy-700/40"
            >
              <component
                :is="resolveWidgetComponent(widget.name)"
                :configuration="widget.configuration"
                :is-editor-preview="true"
              />
            </div>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
import type { StorefrontLayoutDraft, StorefrontWidgetDraft } from '../composables/useStorefrontApi'
import { findStorefrontWidget } from '../widgets'

const props = defineProps<{
  layout: StorefrontLayoutDraft
  selectedWidgetId?: string | null
}>()

const emit = defineEmits<{
  'add-widget': [areaName: string]
  'remove-widget': [areaName: string, widgetId: string]
  'move-up': [areaName: string, widgetId: string]
  'move-down': [areaName: string, widgetId: string]
  'select-widget': [widgetId: string]
  'remove-area': [areaName: string]
}>()

function sortedWidgets(widgets: StorefrontWidgetDraft[]) {
  return [...widgets].sort((a, b) => a.position - b.position)
}

function resolveWidgetComponent(name: string) {
  return findStorefrontWidget(name)?.component ?? 'div'
}

function selectWidget(widgetId?: string | null) {
  if (!widgetId) return
  emit('select-widget', widgetId)
}

function moveUp(areaName: string, widgetId?: string | null) {
  if (!widgetId) return
  emit('move-up', areaName, widgetId)
}

function moveDown(areaName: string, widgetId?: string | null) {
  if (!widgetId) return
  emit('move-down', areaName, widgetId)
}

function removeWidget(areaName: string, widgetId?: string | null) {
  if (!widgetId) return
  emit('remove-widget', areaName, widgetId)
}
</script>
