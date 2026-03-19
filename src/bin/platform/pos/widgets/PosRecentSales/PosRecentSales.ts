import { WidgetBase } from '@/helpers/extensionLoader/WidgetBase'
import PosRecentSalesComponent from './PosRecentSales.vue'
import { markRaw } from 'vue'

export class PosRecentSalesWidget extends WidgetBase {
  name = 'PosRecentSales'
  component = markRaw(PosRecentSalesComponent)
  allowMultiple = false
  requiredRoles = ['pos:sale:create']
}
