<template>
  <div :style="wrapperStyle">
    <div class="mx-auto" :style="containerStyle">
      <div class="mb-5 text-2xl font-semibold" :style="{ color: textColor }">{{ title }}</div>
      <div class="grid gap-4" :style="gridStyle">
        <article v-for="item in items" :key="item.title" class="overflow-hidden border border-slate-200" :style="cardStyle">
          <img :src="item.imageUrl" :alt="item.title" class="h-52 w-full object-cover" />
          <div class="space-y-3 p-4">
            <div class="flex items-start justify-between gap-3">
              <div class="text-sm font-semibold" :style="{ color: textColor }">{{ item.title }}</div>
              <span class="rounded-full px-2.5 py-1 text-[11px] font-semibold text-white" :style="{ backgroundColor: accentColor }">
                {{ item.badge }}
              </span>
            </div>
            <div class="text-sm opacity-80" :style="{ color: textColor }">{{ item.price }}</div>
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
const title = computed(() => content.value.title || 'Produtos em destaque')
const textColor = computed(() => style.value.textColor || '#0f172a')
const accentColor = computed(() => style.value.accentColor || '#0f172a')

const items = computed(() => String(content.value.items || '')
  .split('\n')
  .map((line: string) => line.trim())
  .filter(Boolean)
  .map((line: string) => {
    const [titlePart, price, badge, href, imageUrl] = line.split('|')
    return {
      title: titlePart?.trim() || 'Produto',
      price: price?.trim() || 'R$ 0,00',
      badge: badge?.trim() || 'Destaque',
      href: href?.trim() || '/',
      imageUrl: imageUrl?.trim() || 'https://placehold.co/640x760/e2e8f0/0f172a?text=Produto'
    }
  }))

const wrapperStyle = computed(() => ({
  backgroundColor: style.value.backgroundColor || '#ffffff',
  borderRadius: `${Number(style.value.borderRadius ?? 28)}px`,
  padding: `${Number(style.value.paddingY ?? 24)}px ${Number(style.value.paddingX ?? 24)}px`
}))

const cardStyle = computed(() => ({
  backgroundColor: style.value.cardBackgroundColor || '#ffffff',
  borderRadius: `${Math.max(18, Number(style.value.borderRadius ?? 28) - 10)}px`
}))

const containerStyle = computed(() => {
  const width = layout.value.width || 'contained'
  if (width === 'full') return { maxWidth: '100%' }
  if (width === 'wide') return { maxWidth: '1280px' }
  return { maxWidth: '1120px' }
})

const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${Number(layout.value.columns || 4)}, minmax(0, 1fr))`
}))
</script>
