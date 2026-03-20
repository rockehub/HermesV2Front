import StorefrontWidgetBase from '../StorefrontWidgetBase'
import PreviewComponent from './StoreHeaderPreview.vue'

export default class StoreHeaderWidget extends StorefrontWidgetBase {
  constructor() {
    super({
      name: 'store-header',
      title: 'Store Header',
      description: 'Header principal da loja com marca, navegacao e CTA.',
      category: 'Navigation',
      icon: 'web',
      allowMultiple: false,
      supportedPageTypes: ['HOME', 'CATEGORY', 'PRODUCT', 'CART', 'CHECKOUT', 'CONTENT', 'SEARCH'],
      component: PreviewComponent,
      fields: [
        { id: 'content.title', label: 'Store title', type: 'text', defaultValue: 'Minha Loja', section: 'content' },
        { id: 'content.subtitle', label: 'Subtitle', type: 'text', defaultValue: 'Colecao principal', section: 'content' },
        { id: 'content.navigationLinks', label: 'Navigation links', type: 'textarea', defaultValue: 'Inicio|/\nNovidades|/category/novidades\nContato|/contato', description: 'Uma linha por link no formato Titulo|/rota', section: 'content' },
        { id: 'content.ctaLabel', label: 'CTA label', type: 'text', defaultValue: 'Entrar', section: 'content' },
        { id: 'layout.width', label: 'Container width', type: 'select', defaultValue: 'contained', options: [{ label: 'Contained', value: 'contained' }, { label: 'Wide', value: 'wide' }, { label: 'Full', value: 'full' }], section: 'layout' },
        { id: 'style.backgroundColor', label: 'Background color', type: 'text', defaultValue: '#ffffff', section: 'style' },
        { id: 'style.textColor', label: 'Text color', type: 'text', defaultValue: '#1f2937', section: 'style' },
        { id: 'style.accentColor', label: 'Accent color', type: 'text', defaultValue: '#111827', section: 'style' },
        { id: 'style.paddingY', label: 'Vertical padding', type: 'number', defaultValue: 20, section: 'style' },
        { id: 'style.paddingX', label: 'Horizontal padding', type: 'number', defaultValue: 24, section: 'style' },
        { id: 'style.borderRadius', label: 'Border radius', type: 'number', defaultValue: 24, section: 'style' }
      ]
    })
  }
}
