import StorefrontWidgetBase from '../StorefrontWidgetBase'
import PreviewComponent from './CartItemsPreview.vue'

export default class CartItemsWidget extends StorefrontWidgetBase {
  constructor() {
    super({
      name: 'cart-items',
      title: 'Cart Items',
      description: 'Shows cart items list.',
      category: 'Cart',
      icon: 'shopping_cart',
      allowMultiple: false,
      supportedPageTypes: ['CART'],
      component: PreviewComponent,
      fields: []
    })
  }
}
