import StorefrontWidgetBase from '../StorefrontWidgetBase'
import PreviewComponent from './ProductShelfPreview.vue'

export default class ProductShelfWidget extends StorefrontWidgetBase {
  constructor() {
    super({
      name: 'product-shelf',
      title: 'Product Shelf',
      description: 'Prateleira de produtos com cards, preco e destaque.',
      category: 'Catalog',
      icon: 'inventory_2',
      allowMultiple: true,
      supportedPageTypes: ['HOME', 'CATEGORY', 'CONTENT'],
      component: PreviewComponent,
      fields: [
        { id: 'content.title', label: 'Section title', type: 'text', defaultValue: 'Produtos em destaque', section: 'content' },
        { id: 'content.items', label: 'Products', type: 'textarea', defaultValue: 'Camisa Linho|R$ 189,90|Novo|/product/camisa-linho|https://placehold.co/640x760/f8fafc/0f172a?text=Camisa\nVestido Midi|R$ 249,90|Mais vendido|/product/vestido-midi|https://placehold.co/640x760/e2e8f0/0f172a?text=Vestido\nTenis Casual|R$ 329,90|Frete gratis|/product/tenis-casual|https://placehold.co/640x760/cbd5e1/0f172a?text=Tenis\nBolsa Couro|R$ 399,90|Ultimas pecas|/product/bolsa-couro|https://placehold.co/640x760/94a3b8/ffffff?text=Bolsa', description: 'Uma linha por produto: Nome|Preco|Badge|/rota|imagem', section: 'content' },
        { id: 'layout.columns', label: 'Columns', type: 'select', defaultValue: '4', options: [{ label: '2', value: '2' }, { label: '3', value: '3' }, { label: '4', value: '4' }], section: 'layout' },
        { id: 'layout.width', label: 'Container width', type: 'select', defaultValue: 'contained', options: [{ label: 'Contained', value: 'contained' }, { label: 'Wide', value: 'wide' }, { label: 'Full', value: 'full' }], section: 'layout' },
        { id: 'style.backgroundColor', label: 'Background color', type: 'text', defaultValue: '#ffffff', section: 'style' },
        { id: 'style.cardBackgroundColor', label: 'Card background', type: 'text', defaultValue: '#ffffff', section: 'style' },
        { id: 'style.textColor', label: 'Text color', type: 'text', defaultValue: '#0f172a', section: 'style' },
        { id: 'style.accentColor', label: 'Badge color', type: 'text', defaultValue: '#0f172a', section: 'style' },
        { id: 'style.paddingY', label: 'Vertical padding', type: 'number', defaultValue: 24, section: 'style' },
        { id: 'style.paddingX', label: 'Horizontal padding', type: 'number', defaultValue: 24, section: 'style' },
        { id: 'style.borderRadius', label: 'Border radius', type: 'number', defaultValue: 28, section: 'style' }
      ]
    })
  }
}
