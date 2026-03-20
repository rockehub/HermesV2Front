import StorefrontWidgetBase from '../StorefrontWidgetBase'
import PreviewComponent from './RichTextPreview.vue'

export default class RichTextWidget extends StorefrontWidgetBase {
  constructor() {
    super({
      name: 'rich-text',
      title: 'Rich Text',
      description: 'Flexible text content block.',
      category: 'Content',
      icon: 'article',
      allowMultiple: true,
      supportedPageTypes: ['HOME', 'CATEGORY', 'PRODUCT', 'CONTENT', 'SEARCH'],
      component: PreviewComponent,
      fields: [
        { id: 'title', label: 'Title', type: 'text', defaultValue: 'Titulo de secao' },
        {
          id: 'body',
          label: 'Body',
          type: 'textarea',
          defaultValue: 'Conteudo de texto para a pagina.'
        }
      ]
    })
  }
}
