import type { SearchItem } from '@/types/global.d'

type TaggedSearchItem = SearchItem & { _tag?: string }

const registry: TaggedSearchItem[] = []

export function registerSearchItem(item: SearchItem, tag?: string) {
  const idx = registry.findIndex(e => e.name === item.name)
  const entry: TaggedSearchItem = tag ? { ...item, _tag: tag } : item
  if (idx === -1) {
    registry.push(entry)
  } else {
    registry[idx] = entry
  }
}

export function unregisterSearchItemsByTag(tag: string) {
  for (let i = registry.length - 1; i >= 0; i--) {
    if (registry[i]._tag === tag) registry.splice(i, 1)
  }
}

export function getSearchIndex() {
  return registry
}

