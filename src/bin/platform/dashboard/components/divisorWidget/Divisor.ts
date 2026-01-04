import {WidgetBase} from "@/helpers/extensionLoader/WidgetBase";
import DivisorWidget from "@/bin/platform/dashboard/components/divisorWidget/components/DivisorWidget.vue";
import type {Configurable} from "@/types/global.d";
import {markRaw} from "vue";


export class Divisor extends WidgetBase implements Configurable {
    name = 'Divisor';
    component = markRaw(DivisorWidget)
    allowMultiple = true;
    widgetConfiguration = [
        {
            name: 'name',
            label: 'name',
            span: "span-6",
            default: "divisor",
            type: 'text'
        }
    ]
}