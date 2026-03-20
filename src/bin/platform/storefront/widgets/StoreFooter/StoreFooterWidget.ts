import StorefrontWidgetBase from '../StorefrontWidgetBase'
import PreviewComponent from './StoreFooterPreview.vue'

export default class StoreFooterWidget extends StorefrontWidgetBase {
  constructor() {
    super({
      name: 'store-footer',
      title: 'Store Footer',
      description: 'Rodape da loja com descricao, links e copyright.',
      category: 'Navigation',
      icon: 'splitscreen_bottom',
      allowMultiple: false,
      supportedPageTypes: ['HOME', 'CATEGORY', 'PRODUCT', 'CART', 'CHECKOUT', 'CONTENT', 'SEARCH'],
      component: PreviewComponent,
      fields: [
        { id: 'content.headline', label: 'Headline', type: 'text', defaultValue: 'Atendimento e informacoes', section: 'content' },
        { id: 'content.description', label: 'Description', type: 'textarea', defaultValue: 'Use este rodape para contatos, politicas e links importantes da loja.', section: 'content' },
        { id: 'content.links', label: 'Footer links', type: 'textarea', defaultValue: 'Politica de envio|/envio\nTrocas e devolucoes|/trocas\nContato|/contato', description: 'Uma linha por link no formato Titulo|/rota', section: 'content' },
        { id: 'content.copyright', label: 'Copyright', type: 'text', defaultValue: '© 2026 Minha Loja. Todos os direitos reservados.', section: 'content' },
        { id: 'layout.width', label: 'Container width', type: 'select', defaultValue: 'contained', options: [{ label: 'Contained', value: 'contained' }, { label: 'Wide', value: 'wide' }, { label: 'Full', value: 'full' }], section: 'layout' },
        { id: 'style.backgroundColor', label: 'Background color', type: 'text', defaultValue: '#f8fafc', section: 'style' },
        { id: 'style.textColor', label: 'Text color', type: 'text', defaultValue: '#334155', section: 'style' },
        { id: 'style.accentColor', label: 'Accent color', type: 'text', defaultValue: '#0f172a', section: 'style' },
        { id: 'style.paddingY', label: 'Vertical padding', type: 'number', defaultValue: 28, section: 'style' },
        { id: 'style.paddingX', label: 'Horizontal padding', type: 'number', defaultValue: 24, section: 'style' },
        { id: 'style.borderRadius', label: 'Border radius', type: 'number', defaultValue: 28, section: 'style' }
      ]
    })
  }
}
