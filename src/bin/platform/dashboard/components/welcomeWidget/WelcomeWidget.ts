import {WidgetBase} from "@/helpers/extensionLoader/WidgetBase";
import type {Configurable} from "@/types/global.d";
import WelcomeWidgetComponent
    from "@/bin/platform/dashboard/components/welcomeWidget/components/WelcomeWidgetComponent.vue";
import {markRaw} from "vue";


export class WelcomeWidget extends WidgetBase implements Configurable {
    name = 'WelcomeWidget';
    component = markRaw(WelcomeWidgetComponent)
    allowMultiple = false;
//  example of configuration
    widgetConfiguration = []
}