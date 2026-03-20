<template>
  <div :style="wrapperStyle">
    <div class="mx-auto grid items-center gap-8 lg:grid-cols-2" :style="containerStyle">
      <div :class="imagePosition === 'left' ? 'lg:order-2' : ''">
        <div class="text-[11px] font-semibold uppercase tracking-[0.22em] opacity-70" :style="{ color: textColor }">
          {{ content.eyebrow }}
        </div>
        <div class="mt-3 text-3xl font-semibold leading-tight" :style="{ color: textColor }">
          {{ content.title }}
        </div>
        <div class="mt-4 text-sm leading-6 opacity-90" :style="{ color: textColor }">
          {{ content.description }}
        </div>
        <div class="mt-6 inline-flex rounded-full px-5 py-2.5 text-sm font-semibold text-white" :style="{ backgroundColor: accentColor }">
          {{ content.ctaLabel }}
        </div>
      </div>

      <div :class="imagePosition === 'left' ? 'lg:order-1' : ''">
        <img :src="content.imageUrl" alt="Hero" class="h-[320px] w-full rounded-[28px] object-cover" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

const props = defineProps<{ configuration?: Record<string, any>; isEditorPreview?: boolean }>()
const content = computed(() => ({
  eyebrow: props.configuration?.content?.eyebrow || 'Nova colecao',
  title: props.configuration?.content?.title || 'Campanha principal da loja',
  description: props.configuration?.content?.description || 'Texto de apoio da campanha.',
  ctaLabel: props.configuration?.content?.ctaLabel || 'Comprar agora',
  imageUrl: props.configuration?.content?.imageUrl || 'https://placehold.co/1200x720/e2e8f0/1e293b?text=Hero'
}))
const layout = computed(() => props.configuration?.layout || {})
const style = computed(() => props.configuration?.style || {})
const textColor = computed(() => style.value.textColor || '#f8fafc')
const accentColor = computed(() => style.value.accentColor || '#f59e0b')
const imagePosition = computed(() => layout.value.imagePosition || 'right')

const wrapperStyle = computed(() => ({
  backgroundColor: style.value.backgroundColor || '#0f172a',
  borderRadius: `${Number(style.value.borderRadius ?? 32)}px`,
  padding: `${Number(style.value.paddingY ?? 36)}px ${Number(style.value.paddingX ?? 36)}px`
}))

const containerStyle = computed(() => {
  const width = layout.value.width || 'wide'
  if (width === 'full') return { maxWidth: '100%' }
  if (width === 'contained') return { maxWidth: '1120px' }
  return { maxWidth: '1280px' }
})
</script>
