import { WidgetBase } from '@/helpers/extensionLoader/WidgetBase'
import PosSummaryComponent from './PosSummary.vue'
import { markRaw } from 'vue'

export class PosSummaryWidget extends WidgetBase {
  name = 'PosSummary'
  component = markRaw(PosSummaryComponent)
  allowMultiple = false
  requiredRoles = ['pos:sale:create']
}
