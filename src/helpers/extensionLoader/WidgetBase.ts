import {type App, type Component} from "vue";
import type { AnyFieldSchema, BaseFieldSchema } from '@/classes/form/schemas'
import  * as yup from 'yup'

export abstract class WidgetBase {
  public async boot(): Promise<void> {}

  public async register(app: App): Promise<void> {}

  abstract name: string

  abstract component: Component

  abstract allowMultiple: boolean

  description: string =  "WidgetBase"

  requiredRoles: string[] = []

  configuration: AnyFieldSchema[] = [
    {
      fieldType: 'options',
      code: 'size',
      type: 'select',
      label: 'size',
      span: 6,
      options: [
        { id: 1, name: '1 Espaço' },
        { id: 2, name: '2 Espaços' },
        { id: 3, name: '3 Espaços' },
        { id: 4, name: '4 Espaços' },
        { id: 5, name: '5 Espaços' },
        { id: 6, name: '6 Espaços' },
        { id: 7, name: '7 Espaços' },
        { id: 8, name: '8 Espaços' },
        { id: 9, name: '9 Espaços' },
        { id: 10, name: '10 Espaços' },
        { id: 11, name: '11 Espaços' },
        { id: 12, name: '12 Espaços' }
      ],
      validation: yup.number().required('Campo obrigatório')
    }
  ]
}