<template>
  <div class="overflow-hidden" :style="wrapperStyle">
    <div class="mx-auto flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between" :style="containerStyle">
      <div>
        <div class="text-lg font-semibold" :style="{ color: textColor }">{{ title }}</div>
        <div class="text-sm opacity-70" :style="{ color: textColor }">{{ subtitle }}</div>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <span v-for="link in links" :key="`${link.label}-${link.href}`" class="text-sm font-medium" :style="{ color: textColor }">
          {{ link.label }}
        </span>
        <span class="rounded-full px-4 py-2 text-sm font-semibold text-white" :style="{ backgroundColor: accentColor }">
          {{ ctaLabel }}
        </span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

const props = defineProps<{ configuration?: Record<string, any>; isEditorPreview?: boolean }>()

const content = computed(() => props.configuration?.content || {})
const layout = computed(() => props.configuration?.layout || {})
const style = computed(() => props.configuration?.style || {})

const title = computed(() => content.value.title || 'Minha Loja')
const subtitle = computed(() => content.value.subtitle || 'Colecao principal')
const ctaLabel = computed(() => content.value.ctaLabel || 'Entrar')
const textColor = computed(() => style.value.textColor || '#1f2937')
const accentColor = computed(() => style.value.accentColor || '#111827')

const links = computed(() => String(content.value.navigationLinks || '')
  .split('\n')
  .map((line: string) => line.trim())
  .filter(Boolean)
  .map((line: string) => {
    const [label, href] = line.split('|')
    return { label: label?.trim() || 'Link', href: href?.trim() || '/' }
  }))

const wrapperStyle = computed(() => ({
  backgroundColor: style.value.backgroundColor || '#ffffff',
  borderRadius: `${Number(style.value.borderRadius ?? 24)}px`,
  padding: `${Number(style.value.paddingY ?? 20)}px ${Number(style.value.paddingX ?? 24)}px`
}))

const containerStyle = computed(() => {
  const width = layout.value.width || 'contained'
  if (width === 'full') return { maxWidth: '100%' }
  if (width === 'wide') return { maxWidth: '1280px' }
  return { maxWidth: '1120px' }
})
</script>
