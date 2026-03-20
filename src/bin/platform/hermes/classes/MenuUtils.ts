import { $axios } from '@/helpers/integration/integration'
import type { MenuItem } from '@/types/global'

export interface HermesMenuItem extends MenuItem{
  name: string
  icon: { icon: string; type: 'material' | 'fa' }
  params: { cockpit: string; sub?: string }
  label: string
  displayName: string
  entityName: string
  color?: string
  hasChildren: boolean
}

export const findMenu = async (parent?: string): Promise<HermesMenuItem[]> => {
  const url = parent != null ? `api/v1/menu/${parent}` : 'api/v1/menu'
  const response = await $axios.get(url)
  const items = response.data.data

  return items.map((item: any) => {
    const hasParent = item.parent

    return {
      name: 'cockpit',
      icon: {
        icon: item.icon.icon,
        type: item.icon.type.toLowerCase()
      },
      params: {
        cockpit: hasParent ? item.parent.toLowerCase() : item.name.toLowerCase(),
        ...(hasParent && { sub: item.name.toLowerCase() })
      },
      label: item.displayName || item.name,
      displayName: item.displayName || item.name,
      entityName: item.name,
      color: item.color ?? undefined,
      hasChildren: item.hasChildren ?? false
    } satisfies HermesMenuItem
  })
}
