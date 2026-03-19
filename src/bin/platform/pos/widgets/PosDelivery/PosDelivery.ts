import { WidgetBase } from '@/helpers/extensionLoader/WidgetBase'
import PosDeliveryComponent from './PosDelivery.vue'
import { markRaw } from 'vue'

export class PosDeliveryWidget extends WidgetBase {
  name = 'PosDelivery'
  component = markRaw(PosDeliveryComponent)
  allowMultiple = false
  requiredRoles = ['pos:sale:create']
}
