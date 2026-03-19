<script  setup lang="ts">
import { ref } from 'vue';
import { useGlobalState, useAuthStore } from '@/stores/stores';
import { ErrorMessage, Field, Form } from 'vee-validate';
import { useRouter } from 'vue-router';

// Use global state and auth store
const globalState = useGlobalState();
const authenticator = useAuthStore();
const router = useRouter();

// Reactive credentials
const credentials = ref({
  username: null as string | null,
  password: null as string | null
});

// Login method
async function login() {
  globalState.setReady(false);
  try {
    const result = await authenticator.login(credentials.value);
    if (result.requiresTenantSelection) {
      await router.push({ name: 'select-tenant' });
    } else {
      await router.push({ name: 'dashboard' });
    }
  } finally {
    globalState.setReady(true);
  }
}
</script>

<template>
      <Form @submit="login">
        <div class="mt-16">
          <label class="relative flex">
            <Field name="username" :rules="{ required: true }"
                   class="form-input peer w-full rounded-lg bg-slate-150 px-3 py-2 pl-9 ring-primary/50 placeholder:text-slate-400 hover:bg-slate-200 focus:ring dark:bg-navy-900/90 dark:ring-accent/50 dark:placeholder:text-navy-300 dark:hover:bg-navy-900 dark:focus:bg-navy-900"
                   :placeholder="$t('login.username')"
                   type="text" v-model="credentials.username"
            />

            <span
                class="pointer-events-none absolute flex h-full w-10 items-center justify-center text-slate-400 peer-focus:text-primary dark:text-navy-300 dark:peer-focus:text-accent"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5 transition-colors duration-200"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                  <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="1.5"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </span>
          </label>
          <ErrorMessage class="text-tiny+ text-error" name="username"/>
          <label class="relative mt-4 flex">
            <Field name="password" :rules="{required:true}"
                   class="form-input peer w-full rounded-lg bg-slate-150 px-3 py-2 pl-9 ring-primary/50 placeholder:text-slate-400 hover:bg-slate-200 focus:ring dark:bg-navy-900/90 dark:ring-accent/50 dark:placeholder:text-navy-300 dark:hover:bg-navy-900 dark:focus:bg-navy-900"
                   :placeholder="$t('login.password')"
                   type="password" v-model="credentials.password"
            />
            <span
                class="pointer-events-none absolute flex h-full w-10 items-center justify-center text-slate-400 peer-focus:text-primary dark:text-navy-300 dark:peer-focus:text-accent"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5 transition-colors duration-200"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                  <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="1.5"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </span>
          </label>
          <ErrorMessage class="text-tiny+ text-error" name="password"/>
          <div class="mt-4 flex items-center justify-between space-x-2">
            <router-link to="/login/forgotPassword"
                class="text-xs text-slate-400 transition-colors line-clamp-1 hover:text-slate-800 focus:text-slate-800 dark:text-navy-300 dark:hover:text-navy-100 dark:focus:text-navy-100"
            >{{ $t('login.forgot') }}</router-link
            >
          </div>
          <button type="submit"
                  class="btn mt-10 h-10 w-full bg-primary font-medium text-white hover:bg-primary-focus focus:bg-primary-focus active:bg-primary-focus/90 dark:bg-accent dark:hover:bg-accent-focus dark:focus:bg-accent-focus dark:active:bg-accent/90"
          >
            {{ $t('login.signin') }}
          </button>
        </div>
      </Form>

</template>


