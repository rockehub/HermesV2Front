import { WidgetBase } from '@/helpers/extensionLoader/WidgetBase'
import PosQuickProductsComponent from './PosQuickProducts.vue'
import { markRaw } from 'vue'
import type { TextFieldSchema } from '@/classes/form/schemas'
import * as yup from 'yup'
import type { Configurable } from '@/types/global.d'

export class PosQuickProductsWidget extends WidgetBase implements Configurable {
  name = 'PosQuickProducts'
  component = markRaw(PosQuickProductsComponent)
  allowMultiple = true
  requiredRoles = ['pos:sale:create']

  widgetConfiguration = [
    {
      code: 'size',
      label: 'Tamanho',
      fieldType: 'options',
      span: 6,
      type: 'select',
      options: [
        { id: 4, name: '1/3' },
        { id: 6, name: '1/2' },
        { id: 8, name: '2/3' },
        { id: 12, name: 'Inteiro' }
      ],
      validation: yup.number().required()
    },
    {
      code: 'categoryId',
      label: 'Filtrar por categoria (ID)',
      fieldType: 'text',
      span: 12,
      type: 'text',
      validation: yup.string()
    } satisfies TextFieldSchema
  ]
}
