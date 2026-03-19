import { WidgetBase } from '@/helpers/extensionLoader/WidgetBase'
import PosCustomerComponent from './PosCustomer.vue'
import { markRaw } from 'vue'

export class PosCustomerWidget extends WidgetBase {
  name = 'PosCustomer'
  component = markRaw(PosCustomerComponent)
  allowMultiple = false
  requiredRoles = ['pos:sale:create']
}
