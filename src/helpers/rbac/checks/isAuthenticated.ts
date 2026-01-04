
import type { RBACPermissionCheck, AuthenticatedPermissionOptions } from '@/types/rbac';
import {useAuthStore} from "@/stores/stores";

export const isAuthenticated: RBACPermissionCheck<AuthenticatedPermissionOptions> = (options) => {
	if (options?.bypass?.()) {
		return true;
	}

	const usersStore = useAuthStore()
	console.warn("chegou aqui")
	return usersStore.isAuthenticated
};
