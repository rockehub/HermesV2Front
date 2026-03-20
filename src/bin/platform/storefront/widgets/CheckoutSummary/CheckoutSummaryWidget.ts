import StorefrontWidgetBase from '../StorefrontWidgetBase'
import PreviewComponent from './CheckoutSummaryPreview.vue'

export default class CheckoutSummaryWidget extends StorefrontWidgetBase {
  constructor() {
    super({
      name: 'checkout-summary',
      title: 'Checkout Summary',
      description: 'Order summary and totals.',
      category: 'Checkout',
      icon: 'receipt_long',
      allowMultiple: false,
      supportedPageTypes: ['CHECKOUT'],
      component: PreviewComponent,
      fields: []
    })
  }
}
