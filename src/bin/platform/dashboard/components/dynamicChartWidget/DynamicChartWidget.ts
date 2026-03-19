// bin/platform/dashboard/components/dynamicChartWidget/DynamicChartWidget.ts
import { WidgetBase } from '@/helpers/extensionLoader/WidgetBase'
import type { Configurable } from '@/types/global.d'
import DynamicChartWidgetComponent from './components/DynamicChartWidgetComponent.vue'
import { markRaw } from 'vue'
import type { OptionFieldSchema, TextFieldSchema } from '@/classes/form/schemas'
import * as yup from 'yup'

export class DynamicChartWidget extends WidgetBase implements Configurable {
  name = 'DynamicChartWidget'
  component = markRaw(DynamicChartWidgetComponent)
  allowMultiple = true

  widgetConfiguration = [
    {
      code: 'size',
      label: 'Tamanho',
      fieldType: 'options',
      span: 6,
      type: 'select',
      options: [
        { id: 3, name: '1/4' },
        { id: 4, name: '1/3' },
        { id: 6, name: '1/2' },
        { id: 8, name: '2/3' },
        { id: 12, name: 'Inteiro' }
      ],
      validation: yup.number().required('Campo obrigatório')
    } satisfies OptionFieldSchema,
    {
      code: 'title',
      label: 'Título do Widget',
      fieldType: 'text',
      span: 6,
      type: 'text',
      validation: yup.string()
    } satisfies TextFieldSchema,
    // A configuração completa (queryConfig e chartConfig) é gerenciada
    // internamente pelo componente e salva como JSON strings
    {
      code: 'queryConfig',
      label: 'Query Config',
      fieldType: 'text',
      span: 12,
      type: 'hidden', // Campo oculto, gerenciado pelo componente
      validation: yup.string()
    } satisfies TextFieldSchema,
    {
      code: 'chartConfig',
      label: 'Chart Config',
      fieldType: 'text',
      span: 12,
      type: 'hidden', // Campo oculto, gerenciado pelo componente
      validation: yup.string()
    } satisfies TextFieldSchema
  ]
}
