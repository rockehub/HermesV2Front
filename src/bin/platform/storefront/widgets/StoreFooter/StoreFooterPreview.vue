<template>
  <div :style="wrapperStyle">
    <div class="mx-auto grid gap-6 lg:grid-cols-[1.3fr_1fr]" :style="containerStyle">
      <div>
        <div class="text-lg font-semibold" :style="{ color: accentColor }">{{ headline }}</div>
        <p class="mt-3 text-sm leading-6" :style="{ color: textColor }">{{ description }}</p>
      </div>
      <div>
        <div class="grid gap-2">
          <div v-for="link in links" :key="`${link.label}-${link.href}`" class="text-sm font-medium" :style="{ color: textColor }">
            {{ link.label }}
          </div>
        </div>
        <div class="mt-5 text-xs opacity-70" :style="{ color: textColor }">{{ copyright }}</div>
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

const headline = computed(() => content.value.headline || 'Atendimento e informacoes')
const description = computed(() => content.value.description || 'Use este rodape para contatos e politicas.')
const copyright = computed(() => content.value.copyright || '© 2026 Minha Loja.')
const textColor = computed(() => style.value.textColor || '#334155')
const accentColor = computed(() => style.value.accentColor || '#0f172a')

const links = computed(() => String(content.value.links || '')
  .split('\n')
  .map((line: string) => line.trim())
  .filter(Boolean)
  .map((line: string) => {
    const [label, href] = line.split('|')
    return { label: label?.trim() || 'Link', href: href?.trim() || '/' }
  }))

const wrapperStyle = computed(() => ({
  backgroundColor: style.value.backgroundColor || '#f8fafc',
  borderRadius: `${Number(style.value.borderRadius ?? 28)}px`,
  padding: `${Number(style.value.paddingY ?? 28)}px ${Number(style.value.paddingX ?? 24)}px`
}))

const containerStyle = computed(() => {
  const width = layout.value.width || 'contained'
  if (width === 'full') return { maxWidth: '100%' }
  if (width === 'wide') return { maxWidth: '1280px' }
  return { maxWidth: '1120px' }
})
</script>
