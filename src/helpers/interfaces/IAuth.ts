import { type RemovableRef } from '@vueuse/core'
import type { IRole } from '@/types/rbac'

export interface AuthState {
  token: string | null | RemovableRef<string>
  user: User | RemovableRef<User> | RemovableRef<null>
  permissions: Array<string> | RemovableRef<Array<string>>
  toast: any
}

export interface Token {
  exp: number
}

export interface ResetPassword {
  password: string
  password_confirmation: string
  code: string
}

export interface Credentials {
  username: string | null
  password?: string | null
}

export interface User {
  id: number
  name: string
  email?: string
  image?: string
  role: IRole
  permissions?: Array<string>
  status?: string
  roles?: string[]
  isAdmin?: boolean
  tenantAccessStatus?: 'FULL' | 'BILLING_ONLY' | 'BLOCKED' | null
  blockedReason?: string | null
  storeSetupComplete?: boolean
}
