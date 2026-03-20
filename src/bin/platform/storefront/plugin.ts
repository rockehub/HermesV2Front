import { ref, type Ref } from 'vue';
import type { MenuItem } from '@/types/global.d';
import { ExtensionBase } from '@/helpers/extensionLoader/ExtensionBase';
import type { RouteRecordRaw } from 'vue-router';
import StorefrontPagesPage from './pages/storefront-pages.vue';

export default class StorefrontExtension extends ExtensionBase {
  name = 'storefront';
  component = StorefrontPagesPage;
  menuItem: Ref<MenuItem[]> = ref([]);
  globalWidgets: any[] = [];

  routes: RouteRecordRaw[] = [
    {
      path: '/storefront/pages',
      component: StorefrontPagesPage,
      name: 'storefront-pages',
      meta: {
        title: 'Storefront Pages',
        auth: true,
      },
    },
    {
      path: '/storefront/pages/:pageId',
      component: () => import('./pages/storefront-editor.vue'),
      name: 'storefront-editor',
      meta: {
        title: 'Storefront Editor',
        auth: true,
      },
    },
  ];

  async whenAuthenticated(): Promise<void> {
    this.menuItem.value = [
      {
        name: 'storefront-pages',
        label: 'Storefront',
        icon: { icon: 'fa-solid fa-store', type: 'fa' },
      },
    ];
  }
}
