import {WidgetBase} from "@/helpers/extensionLoader/WidgetBase";
import WidgetAreaWidgetComponent from './components/WidgetAreaWidget.vue'
import type {Configurable} from "@/types/global.d";
import {markRaw} from "vue";
import {generateRandomHash} from "@/helpers/utils/utils";


export class WidgetAreaWidget extends WidgetBase implements Configurable {
    name = 'WidgetAreaWidget';
    component = markRaw(WidgetAreaWidgetComponent)
    allowMultiple = true;
    widgetConfiguration = [
        {
            name: 'name',
            label: 'name',
            span: "span-6",
            default: generateRandomHash(),
            type: 'text'
        },

    ]
}