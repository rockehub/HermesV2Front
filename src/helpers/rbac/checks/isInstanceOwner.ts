
import type { DefaultUserMiddlewareOptions, RBACPermissionCheck } from '@/types/rbac';

export const isInstanceOwner: RBACPermissionCheck<DefaultUserMiddlewareOptions> = () =>
	false
