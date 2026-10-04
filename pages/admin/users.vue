<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-8 px-4">
    <div class="max-w-5xl mx-auto">
      <div class="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 class="text-3xl font-bold text-white">User roles</h1>
          <p class="text-slate-400 mt-1">Promote or demote users. Only admins can change roles; the master admin cannot be demoted.</p>
        </div>
        <span class="text-slate-400 text-sm">{{ total }} users</span>
      </div>

      <div class="flex flex-wrap gap-3 mb-4">
        <input
          v-model="search"
          type="search"
          placeholder="Search by username, name or email"
          class="flex-1 min-w-[220px] px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          @input="onSearch"
        />
        <div class="flex rounded-lg overflow-hidden border border-slate-700">
          <button
            v-for="option in FILTERS"
            :key="option.value"
            type="button"
            :class="['px-3 py-2 text-sm', roleFilter === option.value ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700']"
            @click="setFilter(option.value)"
          >
            {{ option.label }}
          </button>
        </div>
      </div>

      <p v-if="error" class="mb-4 text-red-400 text-sm">{{ error }}</p>

      <div class="bg-slate-800 border border-slate-700 rounded-lg divide-y divide-slate-700">
        <div v-if="loading" class="p-6 text-center text-slate-400">Loading…</div>
        <div v-else-if="!users.length" class="p-6 text-center text-slate-400">No users found.</div>
        <div v-for="user in users" :key="user.id" class="flex flex-wrap items-center gap-3 p-4">
          <NuxtLink :to="`/profile/${user.id}`" class="flex items-center gap-3 flex-1 min-w-[200px]">
            <img :src="user.avatar_url || '/default-avatar.svg'" alt="" class="w-10 h-10 rounded-full object-cover bg-slate-700" />
            <div class="min-w-0">
              <p class="text-white font-medium truncate">
                {{ user.display_name || user.username }}
                <span v-if="user.is_master" class="ml-1 text-xs text-amber-400">master admin</span>
                <span v-if="user.is_banned" class="ml-1 text-xs text-red-400">banned</span>
              </p>
              <p class="text-slate-400 text-sm truncate">@{{ user.username }} · {{ user.email }}</p>
            </div>
          </NuxtLink>
          <div class="flex rounded-lg overflow-hidden border border-slate-700">
            <button
              v-for="role in ROLES"
              :key="role"
              type="button"
              :disabled="savingId === user.id || (user.is_master && role !== 'admin')"
              :class="[
                'px-3 py-1.5 text-sm capitalize disabled:opacity-40 disabled:cursor-not-allowed',
                user.role === role ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-300 hover:bg-slate-700'
              ]"
              @click="changeRole(user, role)"
            >
              {{ role }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="total > users.length + offset || offset > 0" class="flex justify-between mt-4">
        <button type="button" :disabled="offset === 0" class="px-4 py-2 text-sm text-slate-300 disabled:opacity-40" @click="page(-1)">Previous</button>
        <button type="button" :disabled="offset + PAGE_SIZE >= total" class="px-4 py-2 text-sm text-slate-300 disabled:opacity-40" @click="page(1)">Next</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '~/services/http'

definePageMeta({
  middleware: ['auth', 'profile-completion', 'route-guard'],
  layout: 'default'
})

type Role = 'user' | 'manager' | 'admin'

interface AdminUser {
  id: string
  email: string | null
  username: string
  display_name: string | null
  avatar_url: string | null
  role: string
  is_banned: boolean
  created_at: string
  is_master: boolean
}

const ROLES: Role[] = ['user', 'manager', 'admin']
const FILTERS = [
  { value: '', label: 'All' },
  { value: 'admin', label: 'Admins' },
  { value: 'manager', label: 'Managers' },
  { value: 'user', label: 'Users' }
]
const PAGE_SIZE = 50

const users = ref<AdminUser[]>([])
const total = ref(0)
const offset = ref(0)
const search = ref('')
const roleFilter = ref('')
const loading = ref(false)
const savingId = ref<string | null>(null)
const error = ref('')

const errorMessage = (err: unknown, fallback: string): string => {
  const data = (err as { data?: { statusMessage?: string; message?: string } })?.data
  return data?.statusMessage || data?.message || fallback
}

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await api<{ users: AdminUser[]; total: number }>('/admin/roles', {
      query: { search: search.value || undefined, role: roleFilter.value || undefined, limit: PAGE_SIZE, offset: offset.value }
    })
    users.value = res.users
    total.value = res.total
  } catch (err: unknown) {
    error.value = errorMessage(err, 'Failed to load users')
  } finally {
    loading.value = false
  }
}

let searchTimer: ReturnType<typeof setTimeout> | null = null
const onSearch = () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    offset.value = 0
    load()
  }, 300)
}

const setFilter = (value: string) => {
  roleFilter.value = value
  offset.value = 0
  load()
}

const page = (direction: number) => {
  offset.value = Math.max(0, offset.value + direction * PAGE_SIZE)
  load()
}

const changeRole = async (user: AdminUser, role: Role) => {
  if (user.role === role) return
  if (!confirm(`Change @${user.username} from ${user.role} to ${role}?`)) return
  savingId.value = user.id
  error.value = ''
  try {
    await api('/admin/roles', { method: 'POST', body: { userId: user.id, role } })
    user.role = role
  } catch (err: unknown) {
    error.value = errorMessage(err, 'Failed to change role')
  } finally {
    savingId.value = null
  }
}

onMounted(load)
</script>
