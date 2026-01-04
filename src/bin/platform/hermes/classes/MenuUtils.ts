import { $axios } from '@/helpers/integration/integration'

export const findMenu = async (parent?: string) => {
  const url  = parent != null ? `/menu/${parent}` : '/menu'
  const response = await $axios.get(url)
  let items =  response.data
  items = items.map((item) => {
    const hasParent = item.parent;

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
      label: item.name
    };
  });

  return items;

}