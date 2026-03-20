import StorefrontWidgetBase from '../StorefrontWidgetBase'
import PreviewComponent from './FaqPreview.vue'

export default class FaqWidget extends StorefrontWidgetBase {
  constructor() {
    super({
      name: 'faq',
      title: 'FAQ',
      description: 'Frequently asked questions block.',
      category: 'Content',
      icon: 'quiz',
      allowMultiple: true,
      supportedPageTypes: ['CONTENT', 'PRODUCT', 'CHECKOUT'],
      component: PreviewComponent,
      fields: [{ id: 'title', label: 'Title', type: 'text', defaultValue: 'Perguntas frequentes' }]
    })
  }
}
