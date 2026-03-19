import {createRouter, createWebHistory, type RouteLocationRaw} from "vue-router";
import {routes as defaultRoutes} from "@/helpers/routes/routes";
import {pluginsLoaded, routes} from "@/helpers/extensionLoader/extension-loader"
import {useAuthStore} from "@/stores/auth";
import {usePluginManager} from "@/helpers/extensionLoader/usePluginManager";
import {hasRole} from "@/helpers/rbac/checks/hasRole";
import {watch} from "vue";


const router = createRouter({
    history: createWebHistory(),
    routes: defaultRoutes
})

watch(routes.value, (newRoute) => {
    console.log("adding this route", newRoute)
    if (newRoute && Array.isArray(newRoute)) {
        newRoute.forEach((route)=> {
            if (!router.hasRoute(route.name)) {
                router.addRoute(route);
                console.info(`Added route: ${route.path}`);
            }
        })
    }else if (newRoute){
        if (!router.hasRoute(newRoute.name)) {
            router.addRoute(newRoute);
            console.info(`Added route: ${newRoute.path}`);
        }
    }

}, {deep: true});

const pluginManager = usePluginManager()


router.beforeEach(async (to, from, next) => {
    const user = useAuthStore();
    console.log(to)

    await new Promise((resolve) => {
        const checkPluginsLoaded = setInterval(() => {
            if (pluginsLoaded.value) {
                clearInterval(checkPluginsLoaded);
                resolve(true);
            }
        }, 100); // Check every 100ms
    });


    // Ensure next() is only called once
    let nextCalled = false;

    const guardedNext = (location?: RouteLocationRaw) => {
        if (!nextCalled) {
            next(location);
            nextCalled = true;
        } else {
            console.warn('next() was called more than once');
        }
    };
    // Check if the route exists
    if (!to.matched.length) {
        return guardedNext( to);
    }


    // Call routerBefore for each plugin
    for (const plugin of Object.values(pluginManager.getPlugins().value)) {
        await plugin.routerBefore(to, from, guardedNext);

        // If next() was already called, stop the loop
        if (nextCalled) return;
    }



    // Check if route requires authentication
    if (to.matched.some(record => record.meta.auth)) {
        if (!user.checkAuth()) {
            if (to.name !== 'login') {
                return guardedNext({
                    name: 'login',
                    query: {redirect: to.fullPath}
                });
            }
        }
    }

    // Check if route requires specific roles
    if (to.meta.roles && !hasRole(to.meta.roles as string[])) {
        return guardedNext({ name: 'dashboard' });
    }

    // Check if route should redirect authenticated users away
    if (to.matched.some(record => record.meta.noAuth)) {
        if (user.checkAuth()) {
            return guardedNext({name: 'dashboard'});
        }
    }

    // Call next() if no other conditions have triggered it
    return guardedNext();
});


router.afterEach(async (to, from) => {
    for (const plugin of Object.values(pluginManager.getPlugins().value)) {
        await plugin.routerAfter(to, from);
    }
});

export default router;