<template>
  <section class="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
    <div class="flex items-center gap-2">
      <Icon name="smartphone" size="16" class="text-indigo-400 flex-shrink-0" />
      <span class="min-w-0">
        <span class="block text-sm font-bold text-white">Devices</span>
        <span class="block text-[11px] text-slate-400">Every device signed in to your account, with approximate location</span>
      </span>
      <button v-if="devices.some(d => d.signed_in && !d.current)" type="button" class="btn-secondary ml-auto flex-shrink-0 text-xs" :disabled="busy" @click="logout({ all_others: true })">Log out all others</button>
    </div>

    <p v-if="loading" class="text-xs text-slate-400">Loading devices…</p>
    <ul v-else class="space-y-2">
      <li v-for="d in devices" :key="d.device_id" class="flex items-center gap-3 rounded-lg bg-slate-950/60 border border-slate-800 p-3">
        <span :class="['w-2 h-2 rounded-full flex-shrink-0', d.online ? 'bg-emerald-400' : 'bg-slate-600']" :title="d.online ? 'Online' : 'Offline'" />
        <span class="min-w-0 flex-1">
          <span class="block text-sm text-white truncate">
            {{ d.label || 'Unknown device' }}
            <span v-if="d.current" class="ml-1 text-[10px] font-bold text-emerald-400">THIS DEVICE</span>
            <span v-if="mode !== 'any' && d.allowed" class="ml-1 text-[10px] font-bold text-indigo-300">APPROVED</span>
          </span>
          <span class="block text-[11px] text-slate-400 truncate">{{ d.location || 'Location unknown' }}</span>
          <span class="block text-[11px] text-slate-500">
            {{ d.online ? 'Online now' : d.signed_in ? `Last active ${when(d.last_seen)}` : `Signed out · last active ${when(d.last_seen)}` }} · first signed in {{ when(d.first_seen) }}
          </span>
        </span>
        <label v-if="mode === 'listed' || draftMode === 'listed'" class="flex-shrink-0 text-[11px] text-slate-400 flex items-center gap-1">
          <input v-model="allowed" type="checkbox" :value="d.device_id" :disabled="d.current"> Allow
        </label>
        <button v-if="d.signed_in && !d.current" type="button" class="btn-secondary flex-shrink-0 text-xs" :disabled="busy" @click="logout({ device_id: d.device_id })">Log out</button>
      </li>
      <li v-if="!devices.length" class="text-xs text-slate-400">No devices yet.</li>
    </ul>

    <div class="border-t border-slate-800 pt-3 space-y-2">
      <span class="block text-sm font-bold text-white">Device restriction</span>
      <div class="flex flex-wrap gap-3 text-xs text-slate-300">
        <label class="flex items-center gap-1"><input v-model="draftMode" type="radio" value="any"> Any device</label>
        <label class="flex items-center gap-1"><input v-model="draftMode" type="radio" value="listed"> Only approved devices</label>
        <label class="flex items-center gap-1"><input v-model="draftMode" type="radio" value="single"> Only this device</label>
      </div>
      <p v-if="!has2fa" class="text-[11px] text-amber-300">Turn on two-factor authentication above to restrict devices.</p>
      <div v-else class="flex flex-wrap items-center gap-2">
        <input v-model.trim="code" inputmode="numeric" maxlength="6" placeholder="2FA code" class="w-28 bg-slate-950 border border-slate-800 rounded px-2 py-2 text-sm text-white font-mono">
        <button type="button" class="btn-secondary text-xs" :disabled="busy || code.length !== 6" @click="savePolicy">Confirm and save</button>
      </div>
      <p class="text-[11px] text-slate-500">Devices that are not allowed are signed out at once and cannot stay signed in.</p>
    </div>
    <p v-if="message" :class="['text-xs', isError ? 'text-rose-400' : 'text-emerald-400']">{{ message }}</p>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useSupabaseClient } from '#imports'
import { getDeviceId } from '~/composables/use-device-id'

interface Device {
  device_id: string
  label: string | null
  location: string | null
  allowed: boolean
  first_seen: string
  last_seen: string
  current: boolean
  signed_in: boolean
  online: boolean
}

const devices = ref<Device[]>([])
const mode = ref('any')
const draftMode = ref('any')
const allowed = ref<string[]>([])
const has2fa = ref(false)
const loading = ref(true)
const busy = ref(false)
const code = ref('')
const message = ref('')
const isError = ref(false)

const when = (iso: string) => new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
const errText = (e: unknown) => (e as { data?: { statusMessage?: string }, message?: string }).data?.statusMessage ?? (e as { message?: string }).message ?? 'Something went wrong'
const say = (text: string, error = false) => { message.value = text; isError.value = error }

const load = async () => {
  try {
    const res = await $fetch<{ devices: Device[], mode: string, has_2fa: boolean }>('/api/security/devices', { query: { device_id: getDeviceId() } })
    devices.value = res.devices
    mode.value = res.mode
    draftMode.value = res.mode
    has2fa.value = res.has_2fa
    allowed.value = res.devices.filter(d => d.allowed || d.current).map(d => d.device_id)
  } catch (e) {
    say(errText(e), true)
  } finally {
    loading.value = false
  }
}

const logout = async (body: { device_id?: string, all_others?: boolean }) => {
  busy.value = true
  try {
    const r = await $fetch<{ signed_out: number }>('/api/security/devices/logout', { method: 'POST', body })
    say(body.all_others ? `Signed out ${r.signed_out} other device(s)` : 'Device signed out')
    await load()
  } catch (e) {
    say(errText(e), true)
  } finally {
    busy.value = false
  }
}

const savePolicy = async () => {
  busy.value = true
  say('')
  try {
    const supabase = useSupabaseClient()
    const { data: list, error: listErr } = await supabase.auth.mfa.listFactors()
    if (listErr) throw listErr
    const factor = list?.totp?.find(f => f.status === 'verified')
    if (!factor) throw new Error('Turn on two-factor authentication first')
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code: code.value })
    if (error) throw new Error('That code is not right')
    await $fetch('/api/security/devices/policy', { method: 'POST', body: { mode: draftMode.value, allowed: allowed.value, device_id: getDeviceId() } })
    code.value = ''
    say('Device restriction saved')
    await load()
  } catch (e) {
    say(errText(e), true)
  } finally {
    busy.value = false
  }
}

onMounted(load)
</script>
