// Role/permission domain types used by the RBAC store and services.
export interface Role {
  id: string
  name: string
  level: number
  description?: string | null
  created_at?: string
  updated_at?: string
}

export interface Permission {
  id: string
  resource: string
  action: string
  description?: string | null
  created_at?: string
  updated_at?: string
}
