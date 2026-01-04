import type { RouterMiddleware } from '@/types/router';
import type { GuestPermissionOptions } from '@/types/rbac';
import { isGuest } from '@/helpers/rbac/checks';

export const guestMiddleware: RouterMiddleware<GuestPermissionOptions> = async (
	to,
	_from,
	next,
) => {
	const valid = isGuest();
	if (!valid) {
		const redirect = to.query.redirect as string;
		if (redirect && (redirect.startsWith('/') || redirect.startsWith(window.location.origin))) {
			return next(redirect);
		}

		return next({ name: 'dashboard' });
	}
};
