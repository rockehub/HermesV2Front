import { useAuthStore } from '@/stores/auth'
import {type IRole, type RBACPermissionCheck, ROLE, type RolePermissionOptions} from '@/types/rbac';


export const hasRole: RBACPermissionCheck<RolePermissionOptions> = (checkRoles) => {
	const authStore = useAuthStore()
	const currentUser = authStore.getUser

	if (currentUser && checkRoles) {
		const userRole = currentUser.role
		return checkRoles.includes(userRole as IRole);
	}

	return false;
};
