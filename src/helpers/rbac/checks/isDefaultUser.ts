import type { DefaultUserMiddlewareOptions, RBACPermissionCheck } from '@/types/rbac';


export const isDefaultUser: RBACPermissionCheck<DefaultUserMiddlewareOptions> = () => {

	return false;
};
