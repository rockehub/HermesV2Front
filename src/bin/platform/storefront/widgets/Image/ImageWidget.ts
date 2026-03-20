import StorefrontWidgetBase from '../StorefrontWidgetBase'
import PreviewComponent from './ImagePreview.vue'

export default class ImageWidget extends StorefrontWidgetBase {
  constructor() {
    super({
      name: 'image',
      title: 'Image',
      description: 'Standalone image block.',
      category: 'Content',
      icon: 'photo',
      allowMultiple: true,
      supportedPageTypes: ['HOME', 'CATEGORY', 'PRODUCT', 'CONTENT'],
      component: PreviewComponent,
      fields: [
        {
          id: 'src',
          label: 'Image URL',
          type: 'text',
          defaultValue: 'https://placehold.co/1200x600'
        },
        { id: 'alt', label: 'Alt text', type: 'text', defaultValue: 'Imagem da secao' }
      ]
    })
  }
}
