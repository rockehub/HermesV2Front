import {type RouteRecordRaw } from "vue-router";

//pages
import Login from "@/pages/Login/index.vue";
import TenantSelector from "@/pages/Login/TenantSelector.vue";


//components
import HelloWorld from "@/components/HelloWorld.vue";
import ForgotPassword from "@/components/login/ForgotPassword.vue";
import resetPassword from "@/components/login/ResetPassword.vue";

import LoginForm from "@/components/login/LoginForm.vue";



 const routes: Array<RouteRecordRaw> = [
    {
        path: '/auth', component: Login, meta: {noAuth: true}, name: 'auth',
        children: [
            {
                path: 'login', name:"login", components: {form: LoginForm}, meta: {noAuth: true}
            },
            {
                path: 'forgotPassword', components: {form: ForgotPassword}, meta: {noAuth: true}, name: 'forgotPassword'
            },
            {
                path: 'resetPassword', components: {form: resetPassword}, meta: {noAuth: true}, name: 'resetPassword'
            }

        ]
    },
    {
        path: '/select-tenant',
        name: 'select-tenant',
        component: TenantSelector,
        meta: { noAuth: true }
    },
    {name: 'settings', path: '/settings', component: HelloWorld, meta: {auth: true}},
    // {name:'chat', path: '/chat', component: Chat, meta: {auth: true}},
    {name:'tickets', path: '/tickets', component: HelloWorld, meta: {auth: true}},
    {path: '/404', component: HelloWorld, meta: {noAuth: true},name: 'notFound'},

];


export { routes}





