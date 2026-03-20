import StorefrontWidgetBase from '../StorefrontWidgetBase'
import PreviewComponent from './ProductDetailsPreview.vue'

export default class ProductDetailsWidget extends StorefrontWidgetBase {
  constructor() {
    super({
      name: 'product-details',
      title: 'Product Details',
      description: 'Main product details block.',
      category: 'Product',
      icon: 'sell',
      allowMultiple: false,
      supportedPageTypes: ['PRODUCT'],
      component: PreviewComponent,
      fields: [
        { id: 'showGallery', label: 'Show gallery', type: 'boolean', defaultValue: true },
        { id: 'showDescription', label: 'Show description', type: 'boolean', defaultValue: true }
      ]
    })
  }
}
