import { ExtensionBase } from '@/helpers/extensionLoader/ExtensionBase'
import type { MenuItem } from '@/types/global.d'
import cockpitPage from './pages/cockpit.vue'
import formPage from './pages/form.vue'
import workflowDesignerPage from './pages/workflow-designer.vue'
import productMediaPage from './pages/product-media.vue'
import productBuilderPage from './pages/product-builder.vue'
import productImportPage from './pages/product-import.vue'
import { type Ref, ref } from 'vue'
import { findMenu } from '@/bin/platform/hermes/classes/MenuUtils'
import { registerSearchItem } from '@/helpers/search/searchRegistry'
import router from '@/helpers/routes/main'
import { $axios } from '@/helpers/integration/integration'

export default class HermesPlugin extends ExtensionBase {
  component = cockpitPage
  menuItem: Ref<MenuItem[]> = ref([])
  name = 'Hermes'
  routes = [
    {
      name: 'cockpit',
      path: '/cockpit/:cockpit?/:sub?',
      component: cockpitPage,
      meta: { auth: true }
    },
    {
      name: 'cockpit-form',
      path: '/cockpit/:cockpit?/:sub?/form/:id?',
      component: formPage,
      meta: { auth: true }
    },
    {
      name: 'workflow-designer',
      path: '/workflow/designer/:id?',
      component: workflowDesignerPage,
      meta: { auth: true }
    },
    {
      name: 'product-media',
      path: '/products/:productId/media',
      component: productMediaPage,
      meta: { auth: true }
    },
    {
      name: 'product-builder',
      path: '/products/builder',
      component: productBuilderPage,
      meta: { auth: true }
    },
    {
      name: 'product-import',
      path: '/products/import',
      component: productImportPage,
      meta: { auth: true }
    }
  ]

  async boot(): Promise<void> {}

  async whenAuthenticated(): Promise<void> {
    try {
      await $axios.post('/api/v1/admin/plugins/roles', {
        pluginId: 'hermes',
        roles: [
          { name: 'hermes:product:read', description: 'Ver produtos' },
          { name: 'hermes:product:write', description: 'Criar/editar produtos' },
          { name: 'hermes:order:read', description: 'Ver pedidos' },
          { name: 'hermes:order:manage', description: 'Gerenciar pedidos' },
          { name: 'hermes:customer:read', description: 'Ver clientes' },
          { name: 'hermes:customer:write', description: 'Gerenciar clientes' },
          { name: 'hermes:management:access', description: 'Permissão de Gerenciamento' }
        ]
      })
    } catch (e) {
      console.warn('HermesPlugin: falha ao registrar roles', e)
    }

    const items = await findMenu()

    this.menuItem.value = [
      {
        name: 'cockpit',
        label: 'Commerce',
        icon: { icon: 'fa-light fa-store text-[1.2rem]', type: 'fa' }
      },
      {
        name: 'workflow-designer',
        label: 'Workflow Designer',
        icon: { icon: 'fa-light fa-diagram-project text-[1.2rem]', type: 'fa' }
      },
      {
        name: 'product-builder',
        label: 'Criador de Produtos',
        icon: { icon: 'fa-light fa-box-open text-[1.2rem]', type: 'fa' }
      },
      {
        name: 'product-import',
        label: 'Importar Produtos',
        icon: { icon: 'fa-light fa-file-import text-[1.2rem]', type: 'fa' }
      }
    ]

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

    registerSearchItem(
      {
        name: 'Workflow Designer',
        keywords: ['workflow', 'designer', 'processo', 'fluxo'],
        type: 'page',
        icon: { icon: 'fa-light fa-diagram-project text-[1.2rem]', type: 'fa' },
        action: () => router.push({ name: 'workflow-designer' })
      },
      'hermes'
    )

    registerSearchItem(
      {
        name: 'Criar Produto',
        keywords: ['produto', 'criar produto', 'novo produto', 'product builder', 'wizard'],
        type: 'page',
        icon: { icon: 'fa-light fa-box-open text-[1.2rem]', type: 'fa' },
        action: () => router.push({ name: 'product-builder' })
      },
      'hermes'
    )

    registerSearchItem(
      {
        name: 'Importar Produtos',
        keywords: ['importar', 'importação', 'csv', 'produtos', 'upload'],
        type: 'page',
        icon: { icon: 'fa-light fa-file-import text-[1.2rem]', type: 'fa' },
        action: () => router.push({ name: 'product-import' })
      },
      'hermes'
    )
  }
}

