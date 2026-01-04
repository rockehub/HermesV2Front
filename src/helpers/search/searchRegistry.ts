import type { SearchItem } from '@/types/global'


const registry: SearchItem[] = []

export function registerSearchItem(item: SearchItem) {
  if (registry.filter(existingItem => existingItem.name === item.name).length === 0) {
    registry.push(item)
  }
}

export function getSearchIndex() {
  return registry
}