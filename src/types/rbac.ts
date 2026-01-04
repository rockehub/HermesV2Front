import type { Resource, ScopeOptions, Scope } from '@/classes/permissions';


export type IRole = Roles[keyof Roles];

export const ROLE = {
	Owner: 'global:owner',
	Member: 'global:member',
	Admin: 'global:admin',
	Default: 'default', // default user with no email when setting up instance
} as const;

export type Roles = typeof ROLE;

export type AuthenticatedPermissionOptions = {
	bypass?: () => boolean;
};
export type CustomPermissionOptions<C = {}> = RBACPermissionCheck<C>;
export type DefaultUserMiddlewareOptions = {};
export type InstanceOwnerMiddlewareOptions = {};

export type GuestPermissionOptions = {};
export type RBACPermissionOptions = {
	scope?: Scope | Scope[];
	projectId?: string;
	resourceType?: Resource;
	resourceId?: string;
	options?: ScopeOptions;
};
export type RolePermissionOptions = IRole[];

export type PermissionType =
	| 'authenticated'
	| 'custom'
	| 'defaultUser'
	| 'instanceOwner'
	| 'guest'
	| 'rbac'
	| 'role';

export type PermissionTypeOptions = {
	authenticated: AuthenticatedPermissionOptions;
	custom: CustomPermissionOptions;
	defaultUser: DefaultUserMiddlewareOptions;
	instanceOwner: InstanceOwnerMiddlewareOptions;
	guest: GuestPermissionOptions;
	rbac: RBACPermissionOptions;
	role: RolePermissionOptions;
};

export interface RBACPermissionCheck<Options> {
	(options?: Options): boolean;
}
