import { defineStore } from 'pinia'
import { ref } from 'vue'
import { $axios } from '@/helpers/integration/integration'
import { findMenu } from '@/bin/platform/hermes/classes/MenuUtils'
import { plugins } from '@/helpers/extensionLoader/extension-loader'
import { registerSearchItem, unregisterSearchItemsByTag } from '@/helpers/search/searchRegistry'
import router from '@/helpers/routes/main'

export type SidebarFormat = 'minimized' | 'expanded'

const STORAGE_KEY_FORMAT  = 'hermes:sidebar:format'
const STORAGE_KEY_OVERRIDES = 'hermes:menu:local-overrides'

// Estrutura de override para itens frontend-only
export interface LocalMenuOverride {
  displayName?: string
  icon?: { icon: string; type: 'fa' | 'material' }
  color?: string
}

function loadOverrides(): Record<string, LocalMenuOverride> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_OVERRIDES) ?? '{}')
  } catch {
    return {}
  }
}

export const useMenuStore = defineStore('menuStore', () => {
  const isConfigMode   = ref(false)
  const menuRevision   = ref(0)           // incrementa ao atualizar qualquer item
  const localOverrides = ref<Record<string, LocalMenuOverride>>(loadOverrides())

  const sidebarFormat = ref<SidebarFormat>(
    (localStorage.getItem(STORAGE_KEY_FORMAT) as SidebarFormat) ?? 'minimized'
  )

  // ── UI ────────────────────────────────────────────────────────────────────
  function toggleConfigMode() {
    isConfigMode.value = !isConfigMode.value
  }

  function toggleFormat() {
    sidebarFormat.value = sidebarFormat.value === 'minimized' ? 'expanded' : 'minimized'
    localStorage.setItem(STORAGE_KEY_FORMAT, sidebarFormat.value)
    syncBodyClass()
  }

  function syncBodyClass() {
    document.body.classList.toggle('menu-expanded', sidebarFormat.value === 'expanded')
  }

  // ── Overrides locais (itens frontend-only) ────────────────────────────────
  /** Chave estável para itens que não vêm do backend */
  function localKey(item: { name: string; label: string }): string {
    return `${item.name}:${item.label}`
  }

  function getLocalOverride(item: { name: string; label: string }): LocalMenuOverride | null {
    return localOverrides.value[localKey(item)] ?? null
  }

  function saveLocalMenuConfig(item: { name: string; label: string }, override: LocalMenuOverride) {
    const key = localKey(item)
    localOverrides.value[key] = { ...localOverrides.value[key], ...override }
    localStorage.setItem(STORAGE_KEY_OVERRIDES, JSON.stringify(localOverrides.value))
    menuRevision.value++
  }

  // ── Backend (itens Hermes) ────────────────────────────────────────────────
  /** Atualiza icon / displayName / color de uma entidade via API */
  async function updateMenuConfig(entity: string, icon: string, displayName: string, color: string) {
    await $axios.patch(`api/v1/menu/${entity}`, { icon, displayName, color })
    await refreshHermesMenu()
  }

  /** Re-busca o menu raiz, atualiza o plugin e o search index */
  async function refreshHermesMenu() {
    const hermesPlugin = plugins['HermesPlugin']
    if (!hermesPlugin) return

    const items = await findMenu()
    hermesPlugin.menuItem.value = [items]

    // Atualiza entradas no search index
    unregisterSearchItemsByTag('hermes')
    for (const item of items) {
      registerSearchItem(
        {
          name: item.label,
          keywords: [item.label, item.entityName],
          type: 'page',
          icon: item.icon,
          action: () => router.push({ name: item.name, params: item.params })
        },
        'hermes'
      )
    }

    menuRevision.value++
  }

  // Aplica classe do body na inicialização
  syncBodyClass()

  return {
    isConfigMode,
    sidebarFormat,
    menuRevision,
    localOverrides,
    toggleConfigMode,
    toggleFormat,
    getLocalOverride,
    saveLocalMenuConfig,
    localKey,
    updateMenuConfig,
    refreshHermesMenu
  }
})
