import type { RouterMiddleware } from '@/types/router';
import {
	inferProjectIdFromRoute,
	inferResourceIdFromRoute,
	inferResourceTypeFromRoute,
} from '@/helpers/utils/rbacUtils';
import type { RBACPermissionOptions } from '@/types/rbac';
import { hasScope } from '@/helpers/rbac/checks';
//todo change to simplescope
export const rbacMiddleware: RouterMiddleware<RBACPermissionOptions> = async (
	to,
	_from,
	next,
	{ scope, options },
) => {
	const projectId = inferProjectIdFromRoute(to);
	const resourceType = inferResourceTypeFromRoute(to);
	const resourceId = resourceType ? inferResourceIdFromRoute(to) : undefined;

	const valid = hasScope({ scope, projectId, resourceType, resourceId, options });
	if (!valid) {
		return next({ name: 'dashboard' });
	}
};
