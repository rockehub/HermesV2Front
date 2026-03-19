import {WidgetBase} from "@/helpers/extensionLoader/WidgetBase";
import WidgetAreaWidgetComponent from './components/WidgetAreaWidget.vue'
import type {Configurable} from "@/types/global.d";
import {markRaw} from "vue";
import {generateRandomHash} from "@/helpers/utils/utils";
import type { TextFieldSchema } from '@/classes/form/schemas'
import * as yup from 'yup'

export class WidgetAreaWidget extends WidgetBase implements Configurable {
  name = 'WidgetAreaWidget'
  component = markRaw(WidgetAreaWidgetComponent)
  allowMultiple = true
  widgetConfiguration = [
    {
      code: 'name',
      label: 'name',
      fieldType: 'text',
      span: 6,
      type: 'text',
      validation: yup.string().required('Campo obrigatório')
    } satisfies TextFieldSchema
  ]
}