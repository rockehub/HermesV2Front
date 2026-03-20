import StorefrontWidgetBase from '../StorefrontWidgetBase'
import PreviewComponent from './SpacerPreview.vue'

export default class SpacerWidget extends StorefrontWidgetBase {
  constructor() {
    super({
      name: 'spacer',
      title: 'Spacer',
      description: 'Vertical spacing block.',
      category: 'Layout',
      icon: 'height',
      allowMultiple: true,
      supportedPageTypes: ['HOME', 'CATEGORY', 'PRODUCT', 'CART', 'CHECKOUT', 'CONTENT', 'SEARCH'],
      component: PreviewComponent,
      fields: [{ id: 'height', label: 'Height', type: 'number', defaultValue: 32 }]
    })
  }
}
