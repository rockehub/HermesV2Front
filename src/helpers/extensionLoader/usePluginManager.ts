// usePluginManager.ts
import {ref, readonly, computed} from "vue";
import {routes, menuItems, searchContexts, plugins, globalWidgets,languages} from "./extension-loader";
import {WidgetBase} from "@/helpers/extensionLoader/WidgetBase";
import {type Configurable} from "@/types/global.d";
import { merge } from 'lodash-es'

export function usePluginManager() {
    // Reactive references to expose data
    const pluginRoutes = ref([...routes.value]);
    const pluginMenuItems = ref(menuItems);
    const pluginSearchContexts = ref([...searchContexts]);
    const pluginGlobalWidgets = ref([...globalWidgets]);
    const registeredPlugins = ref({...plugins});
    const registeredLanguages = ref(languages)

    // Methods to access and manipulate plugin data
    const getPlugins = () => readonly(registeredPlugins);
    const getRoutes = () => readonly(pluginRoutes);
    const getMenuItems = () => readonly(pluginMenuItems);
    const getSearchContexts = () => readonly(pluginSearchContexts);
    const getGlobalWidgets = () => readonly(pluginGlobalWidgets);



     const mergeAllTranslations = async () => {
        const mergedMessages: Record<string, any> = {};

        // 1. Carrega os arquivos principais de src/lang/<lang-code>/lang.ts
        const baseLangModules = import.meta.glob('../../lang/**/lang.ts', { eager: true });
        for (const path in baseLangModules) {
            const mod: any = baseLangModules[path];
            const langCode = path.match(/lang\/([^/]+)\/lang\.ts$/)?.[1];
            if (!langCode) continue;

            const messages = mod[langCode] || mod.default || {};
            mergedMessages[langCode] = merge({}, mergedMessages[langCode] || {}, messages);
        }

        // 2. Carrega arquivos dos plugins
        const pluginLangModules = import.meta.glob([
            '../../bin/custom/**/lang/**/lang.ts',
            '../../bin/platform/**/lang/**/lang.ts'
        ], { eager: true });

        for (const path in pluginLangModules) {
            const mod: any = pluginLangModules[path];
            const langCode = path.match(/lang\/([^/]+)\/lang\.ts$/)?.[1];
            if (!langCode) continue;

            const messages = mod[langCode] || mod.default || {};
            mergedMessages[langCode] = merge({}, mergedMessages[langCode] || {}, messages);
        }

        return mergedMessages;
    };


    const buildConfigurationValues = (widget: any, formData?: any) => {
        let config: any[] = [];

        if (isConfigurable(widget)) {
            config = [...widget.configuration, ...widget.widgetConfiguration as any[]];
        }

        const payload: { [key: string]: any } = {};

        // Use Object.prototype.hasOwnProperty.call for safety
        config.forEach((conf) => {
            if (formData) {
                if (Object.prototype.hasOwnProperty.call(formData, conf.name)) {
                    payload[conf.name] = formData[conf.name];
                } else if (Object.prototype.hasOwnProperty.call(conf, 'default')) {
                    payload[conf.name] = conf.default;
                }
            } else if (Object.prototype.hasOwnProperty.call(conf, 'default')) {
                payload[conf.name] = conf.default;
            }
        });

        return payload;
    }


    const isConfigurable = (widget: any): widget is Configurable => {
        return 'widgetConfiguration' in widget
    }

    const allWidgets = computed(() => {
        const globalWidgets = getGlobalWidgets().value;
        return globalWidgets.flatMap((item) => item.widgets);
    });

    const findWidgetByName = (name: string): WidgetBase => {
        return allWidgets.value.find((widget) => widget.name === name);
    };

    const mergeConfiguration = (widget: WidgetBase) => {
        if (isConfigurable(widget)) {
            return [...widget.configuration, ...widget.widgetConfiguration]
        } else {
            return []
        }
    }

    // Return all methods and data
    return {
        getPlugins,
        getRoutes,
        getMenuItems,
        getSearchContexts,
        getGlobalWidgets,
        isConfigurable,
        buildConfigurationValues,
        findWidgetByName,
        mergeConfiguration,
        mergeAllTranslations,
        pluginMenuItems
    };
}
