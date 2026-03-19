import { WidgetBase } from '@/helpers/extensionLoader/WidgetBase'
import PosPaymentComponent from './PosPayment.vue'
import { markRaw } from 'vue'

export class PosPaymentWidget extends WidgetBase {
  name = 'PosPayment'
  component = markRaw(PosPaymentComponent)
  allowMultiple = false
  requiredRoles = ['pos:sale:create']
}
