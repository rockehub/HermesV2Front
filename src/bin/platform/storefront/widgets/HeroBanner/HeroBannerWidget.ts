import StorefrontWidgetBase from '../StorefrontWidgetBase'
import PreviewComponent from './HeroBannerPreview.vue'

export default class HeroBannerWidget extends StorefrontWidgetBase {
  constructor() {
    super({
      name: 'hero-banner',
      title: 'Hero Banner',
      description: 'Hero principal da loja com campanha e CTA.',
      category: 'Marketing',
      icon: 'image',
      allowMultiple: true,
      supportedPageTypes: ['HOME', 'CONTENT', 'CATEGORY'],
      component: PreviewComponent,
      fields: [
        { id: 'content.eyebrow', label: 'Eyebrow', type: 'text', defaultValue: 'Nova colecao', section: 'content' },
        { id: 'content.title', label: 'Title', type: 'text', defaultValue: 'Campanha principal da loja', section: 'content' },
        { id: 'content.description', label: 'Description', type: 'textarea', defaultValue: 'Texto de apoio para destacar uma colecao, categoria ou promocao da loja.', section: 'content' },
        { id: 'content.ctaLabel', label: 'CTA label', type: 'text', defaultValue: 'Comprar agora', section: 'content' },
        { id: 'content.ctaHref', label: 'CTA href', type: 'text', defaultValue: '/category/destaques', section: 'content' },
        { id: 'content.imageUrl', label: 'Image URL', type: 'text', defaultValue: 'https://placehold.co/1200x720/e2e8f0/1e293b?text=Hero', section: 'content' },
        { id: 'layout.width', label: 'Container width', type: 'select', defaultValue: 'wide', options: [{ label: 'Contained', value: 'contained' }, { label: 'Wide', value: 'wide' }, { label: 'Full', value: 'full' }], section: 'layout' },
        { id: 'layout.imagePosition', label: 'Image position', type: 'select', defaultValue: 'right', options: [{ label: 'Right', value: 'right' }, { label: 'Left', value: 'left' }], section: 'layout' },
        { id: 'style.backgroundColor', label: 'Background color', type: 'text', defaultValue: '#0f172a', section: 'style' },
        { id: 'style.textColor', label: 'Text color', type: 'text', defaultValue: '#f8fafc', section: 'style' },
        { id: 'style.accentColor', label: 'Button color', type: 'text', defaultValue: '#f59e0b', section: 'style' },
        { id: 'style.paddingY', label: 'Vertical padding', type: 'number', defaultValue: 36, section: 'style' },
        { id: 'style.paddingX', label: 'Horizontal padding', type: 'number', defaultValue: 36, section: 'style' },
        { id: 'style.borderRadius', label: 'Border radius', type: 'number', defaultValue: 32, section: 'style' }
      ]
    })
  }
}
