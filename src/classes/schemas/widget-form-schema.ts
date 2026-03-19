import { AbstractFormSchema } from '@/classes/form/AbstractFormSchema'
import { DynamicField } from '@/classes/form/decorators'


export class WidgetFormSchema extends AbstractFormSchema<WidgetFormSchema> {
  formName: string = 'WidgetFormSchema'

  private args;

  constructor(...args: any[]) {
    super(...args)
    this.args = args;
  }

  @DynamicField({
    code: 'configuration',
    initialValuesProperty: 'configuration',
    label: 'configuration',
    span: 12,
    type: 'request',
    shouldUseInCreate: true
  })
  private configuration: any = null

  getConfigurationDynamicSchema = () => {
    return this.args[0];
  }
}
