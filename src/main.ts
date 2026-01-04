import {pinia} from "@/stores/main";
import {createApp} from 'vue';
import App from './App.vue';
import '@/assets/css/style.css';
import notification from "@/helpers/utils/notification";
import vueClickOutsideElement from 'vue-click-outside-element';
import vueDebounce, {type PluginConfig} from 'vue-debounce';
import {bootPlugins, menuItems, registerPlugins} from "@/helpers/extensionLoader/extension-loader";
import JitsiMeeting from "@jitsi/vue-sdk";
import {configure, defineRule} from 'vee-validate';
import {all} from '@vee-validate/rules';
import {localize} from '@vee-validate/i18n';
import {useBreakpoints} from "@/stores/breakpoints";
import whenAuthenticatedRunner from "@/classes/initialization/auth"


import integration from "@/helpers/integration/integration";
import router from "@/helpers/routes/main";

import 'material-icons/iconfont/material-icons.css';
// import websocket from "@/helpers/integration/websocket";
// import Pusher from "pusher-js";
import clickAway from "@/helpers/directives/ClickAway";
import {useLocalizationStore} from "@/stores/localizationStore";
import {inactivityPlugin} from "@/helpers/plugins/InactivityPlugin";

// window.Pusher = Pusher;

const initApp = async () => {
    const localizationStore = useLocalizationStore(pinia);
    Object.entries(all).forEach(([name, rule]) => {
        defineRule(name, rule);
    });

    configure({
        generateMessage: localize('br', {
            messages: localizationStore.i18n.global.messages
        })
    });

    const app = createApp(App);

    app.use(router);
    app.use(pinia);
    app.use(JitsiMeeting)
    app.use(localizationStore.i18n);
    app.use(integration);
    // app.use(websocket);
    app.use(whenAuthenticatedRunner)
    app.use(inactivityPlugin, {duration: 900000});
    app.directive('click-away', clickAway);
    app.use<PluginConfig>(vueDebounce, {lock: true, defaultTime: '400ms', listenTo: 'keyup'});

    app.use(vueClickOutsideElement);
    app.config.globalProperties.$toast = notification;
    app.config.globalProperties.$menu = menuItems;

    const breakpoints = useBreakpoints(pinia);
    breakpoints.init();
    app.config.globalProperties.$breakpoints = breakpoints;

    await bootPlugins();

    await registerPlugins(app);

    app.mount('#app');
};


// Make sure that we get all error messages properly displayed
// as long as we are not in production mode
window.onerror = (message, _source, _lineno, _colno, error) => {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    if (message.toString().includes('ResizeObserver')) {
        // That error can apparently be ignored and can probably
        // not do anything about it anyway
        return;
    }
    console.error('error caught in main.ts');
    console.error(message);
    console.error(error);
};


initApp().catch(error => console.error('Failed to initialize the app:', error));
