import StorefrontWidgetBase from '../StorefrontWidgetBase'
import PreviewComponent from './CategoryGridPreview.vue'

export default class CategoryGridWidget extends StorefrontWidgetBase {
  constructor() {
    super({
      name: 'category-grid',
      title: 'Category Grid',
      description: 'Grade de categorias destacadas com imagem e link.',
      category: 'Catalog',
      icon: 'grid_view',
      allowMultiple: true,
      supportedPageTypes: ['HOME', 'CATEGORY', 'CONTENT'],
      component: PreviewComponent,
      fields: [
        { id: 'content.title', label: 'Section title', type: 'text', defaultValue: 'Categorias em destaque', section: 'content' },
        { id: 'content.items', label: 'Categories', type: 'textarea', defaultValue: 'Moda feminina|Looks da temporada|/category/feminino|https://placehold.co/640x640/f1f5f9/0f172a?text=Feminino\nModa masculina|Essenciais do dia a dia|/category/masculino|https://placehold.co/640x640/e2e8f0/0f172a?text=Masculino\nAcessorios|Detalhes que finalizam|/category/acessorios|https://placehold.co/640x640/cbd5e1/0f172a?text=Acessorios', description: 'Uma linha por categoria: Titulo|Descricao|/rota|imagem', section: 'content' },
        { id: 'layout.columns', label: 'Columns', type: 'select', defaultValue: '3', options: [{ label: '2', value: '2' }, { label: '3', value: '3' }, { label: '4', value: '4' }], section: 'layout' },
        { id: 'layout.width', label: 'Container width', type: 'select', defaultValue: 'contained', options: [{ label: 'Contained', value: 'contained' }, { label: 'Wide', value: 'wide' }, { label: 'Full', value: 'full' }], section: 'layout' },
        { id: 'style.backgroundColor', label: 'Background color', type: 'text', defaultValue: '#ffffff', section: 'style' },
        { id: 'style.cardBackgroundColor', label: 'Card background', type: 'text', defaultValue: '#f8fafc', section: 'style' },
        { id: 'style.textColor', label: 'Text color', type: 'text', defaultValue: '#0f172a', section: 'style' },
        { id: 'style.paddingY', label: 'Vertical padding', type: 'number', defaultValue: 24, section: 'style' },
        { id: 'style.paddingX', label: 'Horizontal padding', type: 'number', defaultValue: 24, section: 'style' },
        { id: 'style.borderRadius', label: 'Border radius', type: 'number', defaultValue: 28, section: 'style' }
      ]
    })
  }
}
