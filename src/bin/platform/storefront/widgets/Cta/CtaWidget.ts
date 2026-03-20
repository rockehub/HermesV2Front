import StorefrontWidgetBase from '../StorefrontWidgetBase'
import PreviewComponent from './CtaPreview.vue'

export default class CtaWidget extends StorefrontWidgetBase {
  constructor() {
    super({
      name: 'cta',
      title: 'CTA Banner',
      description: 'Simple call-to-action block.',
      category: 'Marketing',
      icon: 'campaign',
      allowMultiple: true,
      supportedPageTypes: ['HOME', 'CATEGORY', 'CONTENT'],
      component: PreviewComponent,
      fields: [
        { id: 'title', label: 'Title', type: 'text', defaultValue: 'Chamada principal' },
        { id: 'buttonLabel', label: 'Button label', type: 'text', defaultValue: 'Saiba mais' }
      ]
    })
  }
}
