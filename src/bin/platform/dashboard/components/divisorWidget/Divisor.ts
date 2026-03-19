import { WidgetBase } from '@/helpers/extensionLoader/WidgetBase'
import DivisorWidget from '@/bin/platform/dashboard/components/divisorWidget/components/DivisorWidget.vue'
import type { Configurable } from '@/types/global.d'
import { markRaw } from 'vue'
import type { TextFieldSchema } from '@/classes/form/schemas'

export class Divisor extends WidgetBase implements Configurable {
  name = 'Divisor'
  component = markRaw(DivisorWidget)
  allowMultiple = true
  widgetConfiguration = [
    {
      code: 'name',
      fieldType: 'text',
      type: 'text',
      label: 'name',
      span: 6
    } satisfies TextFieldSchema
  ]
}
