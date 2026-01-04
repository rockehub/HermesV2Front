import type { RouterMiddleware } from '@/types/router';
import type { DefaultUserMiddlewareOptions } from '@/types/rbac';
import { isDefaultUser } from '@/helpers/rbac/checks';

export const defaultUserMiddleware: RouterMiddleware<DefaultUserMiddlewareOptions> = async (
	_to,
	_from,
	next,
) => {
	const valid = isDefaultUser();
	if (!valid) {
		return next({ name: 'dashboard' });
	}
};
