import type { RouterMiddleware, RouterMiddlewareType, MiddlewareOptions } from '@/types/router';
import { authenticatedMiddleware } from '@/helpers/rbac/middleware/authenticated';
import { guestMiddleware } from '@/helpers/rbac/middleware/guest';
import { rbacMiddleware } from '@/helpers/rbac/middleware/rbac';
import { roleMiddleware } from '@/helpers/rbac/middleware/role';
import { customMiddleware } from '@/helpers/rbac/middleware/custom';
import { defaultUserMiddleware } from '@/helpers/rbac/middleware/defaultUser';

type Middleware = {
	[key in RouterMiddlewareType]: RouterMiddleware<MiddlewareOptions[key]>;
};

export const middleware: Middleware = {
	authenticated: authenticatedMiddleware,
	custom: customMiddleware,
	defaultUser: defaultUserMiddleware,
	guest: guestMiddleware,
	rbac: rbacMiddleware,
	role: roleMiddleware,
};
