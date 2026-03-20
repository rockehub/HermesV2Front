<template>
  <div :style="wrapperStyle">
    <div class="mx-auto" :style="containerStyle">
      <div class="mb-5 text-2xl font-semibold" :style="{ color: textColor }">{{ title }}</div>
      <div class="grid gap-4" :style="gridStyle">
        <article v-for="item in items" :key="item.title" class="overflow-hidden" :style="cardStyle">
          <img :src="item.imageUrl" :alt="item.title" class="h-40 w-full object-cover" />
          <div class="p-4">
            <div class="text-sm font-semibold" :style="{ color: textColor }">{{ item.title }}</div>
            <div class="mt-1 text-xs opacity-70" :style="{ color: textColor }">{{ item.description }}</div>
          </div>
        </article>
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
const title = computed(() => content.value.title || 'Categorias em destaque')
const textColor = computed(() => style.value.textColor || '#0f172a')

const items = computed(() => String(content.value.items || '')
  .split('\n')
  .map((line: string) => line.trim())
  .filter(Boolean)
  .map((line: string) => {
    const [titlePart, description, href, imageUrl] = line.split('|')
    return {
      title: titlePart?.trim() || 'Categoria',
      description: description?.trim() || '',
      href: href?.trim() || '/',
      imageUrl: imageUrl?.trim() || 'https://placehold.co/640x640/e2e8f0/0f172a?text=Categoria'
    }
  }))

const wrapperStyle = computed(() => ({
  backgroundColor: style.value.backgroundColor || '#ffffff',
  borderRadius: `${Number(style.value.borderRadius ?? 28)}px`,
  padding: `${Number(style.value.paddingY ?? 24)}px ${Number(style.value.paddingX ?? 24)}px`
}))

const cardStyle = computed(() => ({
  backgroundColor: style.value.cardBackgroundColor || '#f8fafc',
  borderRadius: `${Math.max(16, Number(style.value.borderRadius ?? 28) - 8)}px`
}))

const containerStyle = computed(() => {
  const width = layout.value.width || 'contained'
  if (width === 'full') return { maxWidth: '100%' }
  if (width === 'wide') return { maxWidth: '1280px' }
  return { maxWidth: '1120px' }
})

const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${Number(layout.value.columns || 3)}, minmax(0, 1fr))`
}))
</script>
