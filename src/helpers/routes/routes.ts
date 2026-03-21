import { type RouteRecordRaw } from 'vue-router'
import Login from '@/pages/Login/index.vue'
import TenantSelector from '@/pages/Login/TenantSelector.vue'
import ForgotPassword from '@/components/login/ForgotPassword.vue'
import ResetPassword from '@/components/login/ResetPassword.vue'
import LoginForm from '@/components/login/LoginForm.vue'
import PlansPage from '@/pages/Saas/PlansPage.vue'
import SignupPage from '@/pages/Saas/SignupPage.vue'
import BillingPage from '@/pages/Saas/BillingPage.vue'
import OnboardingPage from '@/pages/Saas/OnboardingPage.vue'
import ProfilePage from '@/pages/Settings/ProfilePage.vue'
import HelloWorld from '@/components/HelloWorld.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/auth',
    component: Login,
    meta: { noAuth: true },
    name: 'auth',
    children: [
      { path: 'login', name: 'login', components: { form: LoginForm }, meta: { noAuth: true } },
      {
        path: 'forgotPassword',
        components: { form: ForgotPassword },
        meta: { noAuth: true },
        name: 'forgotPassword'
      },
      {
        path: 'resetPassword',
        components: { form: ResetPassword },
        meta: { noAuth: true },
        name: 'resetPassword'
      }
    ]
  },
  {
    path: '/select-tenant',
    name: 'select-tenant',
    component: TenantSelector,
    meta: { noAuth: true }
  },
  { path: '/plans', name: 'plans', component: PlansPage, meta: { noAuth: true } },
  { path: '/signup', name: 'signup', component: SignupPage, meta: { noAuth: true } },
  { path: '/billing', name: 'billing', component: BillingPage, meta: { auth: true } },
  { path: '/onboarding', name: 'onboarding', component: OnboardingPage, meta: { auth: true } },
  { name: 'profile', path: '/profile', component: ProfilePage, meta: { auth: true } },
  { name: 'settings', path: '/settings', component: OnboardingPage, meta: { auth: true } },
  { name: 'tickets', path: '/tickets', component: HelloWorld, meta: { auth: true } },
  { path: '/404', component: HelloWorld, meta: { noAuth: true }, name: 'notFound' }
]

export { routes }
