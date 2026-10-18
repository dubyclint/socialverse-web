import { computed } from 'vue'
import { useState } from '#imports'

export interface StaffInfo {
  id: string
  role: 'admin' | 'manager'
  permissions: string[]
}

/** The signed-in user's admin/manager role, loaded once per session. */
export const useStaff = () => {
  const staff = useState<StaffInfo | null>('staff-info', () => null)
  const loaded = useState<boolean>('staff-info-loaded', () => false)

  const load = async (force = false) => {
    if (loaded.value && !force) return staff.value
    try {
      const res = await $fetch<{ staff: StaffInfo | null }>('/api/staff/me')
      staff.value = res.staff
    } catch {
      staff.value = null
    }
    loaded.value = true
    return staff.value
  }

  const reset = () => { staff.value = null; loaded.value = false }

  const can = (permission: string) => staff.value?.role === 'admin' || Boolean(staff.value?.permissions.includes(permission))

  return { staff, loaded, load, reset, can, isStaff: computed(() => Boolean(staff.value)), isAdmin: computed(() => staff.value?.role === 'admin') }
}
