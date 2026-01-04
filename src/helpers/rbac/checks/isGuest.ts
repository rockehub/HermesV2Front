import type { RBACPermissionCheck, GuestPermissionOptions } from '@/types/rbac';
import {useAuthStore} from "@/stores/stores";

export const isGuest: RBACPermissionCheck<GuestPermissionOptions> = () => {
	const usersStore = useAuthStore()
	return !usersStore.getUser
};
