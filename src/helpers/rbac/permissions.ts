import {
	hasRole,
	hasScope,
	isAuthenticated,
	isDefaultUser,
	isInstanceOwner,
	isGuest,
	isValid,
} from '@/helpers/rbac/checks';
import type { PermissionType, PermissionTypeOptions, RBACPermissionCheck } from '@/types/rbac';

type Permissions = {
	[key in PermissionType]: RBACPermissionCheck<PermissionTypeOptions[key]>;
};

export const permissions: Permissions = {
	authenticated: isAuthenticated,
	custom: isValid,
	defaultUser: isDefaultUser,
	instanceOwner: isInstanceOwner,
	guest: isGuest,
	rbac: hasScope,
	role: hasRole,
};

export function hasPermission(
	permissionNames: PermissionType[],
	options?: Partial<PermissionTypeOptions>,
) {
	let valid = true;

	for (const permissionName of permissionNames) {
		const permissionOptions = options?.[permissionName] ?? {};
		const permissionFn = permissions[permissionName] as RBACPermissionCheck<unknown>;

		valid = valid && permissionFn(permissionOptions);
	}

	return valid;
}
