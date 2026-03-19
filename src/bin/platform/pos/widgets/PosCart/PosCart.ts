import { WidgetBase } from '@/helpers/extensionLoader/WidgetBase'
import PosCartComponent from './PosCart.vue'
import { markRaw } from 'vue'

export class PosCartWidget extends WidgetBase {
  name = 'PosCart'
  component = markRaw(PosCartComponent)
  allowMultiple = false
  requiredRoles = ['pos:sale:create']
}
