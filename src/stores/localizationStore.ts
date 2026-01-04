import {defineStore} from 'pinia';
import {createI18n, type I18n} from "vue-i18n";
import {pt} from "@/lang/pt/lang";
import {en} from "@/lang/en/lang";
import {useStorage} from "@vueuse/core";
import {usePluginManager} from "@/helpers/extensionLoader/usePluginManager";
import type {INodeTranslationHeaders} from "@/bin/platform/workflow/interfaces";

// Define a type for the state
interface LocalizationState {
    locale: ReturnType<typeof useStorage>;
    i18n: I18n;
}



const messages = await usePluginManager().mergeAllTranslations()
export const useLocalizationStore = defineStore('localization', {
    state: (): LocalizationState => ({
        locale: useStorage('locale', 'pt'), // Default locale
        i18n: createI18n({
            legacy: false,
            locale: useStorage('locale', 'pt').value, // Default locale
            messages:  messages,
        }),
    }),

    getters: {
        currentLocale: (state) => state.locale,
    },

    actions: {
        changeLocale(locale: string) {
            this.locale = locale; // Assuming `locale` from `useStorage` is a ref, you might need to access its `value` property
            this.i18n.global.locale = locale;
        },
        translator: (state: any, field: string, toString: string | undefined) => (key: string, ...params: any[]) => {
            const tFunction = state.i18n.global.t;
            if (typeof tFunction === 'function') {
                // Cast params as a tuple
                // @ts-ignore
                return (tFunction as VueI18nTranslation)(key, ...(params as [any, ...any[]]));
            }
            return key;
        },
        addNodeTranslation(nodeTranslation: { [nodeType: string]: object }, language: string,) {
            const newMessages = {
                'added-messages': {
                    nodes: nodeTranslation,
                },
            };

            this.i18n.global.mergeLocaleMessage(language, newMessages);
        },
        addHeaders(headers: INodeTranslationHeaders, language: string) {
            this.i18n.global.mergeLocaleMessage(language, { headers });
        }
    },
});
