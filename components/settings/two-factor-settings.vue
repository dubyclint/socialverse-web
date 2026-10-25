<template>
  <div class="tfa">
    <div class="tfa-head">
      <div>
        <h3>Two-factor authentication</h3>
        <p>Ask for a 6-digit code from an authenticator app (Google Authenticator, Microsoft Authenticator, Authy) every time you sign in.</p>
      </div>
      <span class="state" :class="{ on: enabled }">{{ enabled ? 'On' : 'Off' }}</span>
    </div>

    <p v-if="error" class="err">{{ error }}</p>

    <template v-if="loading">
      <p class="muted">Loading…</p>
    </template>

    <template v-else-if="codes.length">
      <p class="ok">Two-factor authentication is on. Save these recovery codes somewhere safe. Each one works once if you lose your phone. They won't be shown again.</p>
      <ul class="codes"><li v-for="c in codes" :key="c">{{ c }}</li></ul>
      <div class="row">
        <button class="btn" @click="copyCodes">{{ copied ? 'Copied' : 'Copy codes' }}</button>
        <button class="btn primary" @click="codes = []">I've saved them</button>
      </div>
    </template>

    <template v-else-if="setup">
      <ol class="steps">
        <li>Open your authenticator app and scan this QR code.</li>
        <li>Or enter this key manually: <code class="key">{{ setup.secret }}</code></li>
        <li>Type the 6-digit code the app shows.</li>
      </ol>
      <img :src="setup.qr" alt="Authenticator QR code" class="qr" />
      <input v-model="code" class="input" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="123456" />
      <div class="row">
        <button class="btn" :disabled="busy" @click="cancelSetup">Cancel</button>
        <button class="btn primary" :disabled="busy || code.length !== 6" @click="confirmSetup">{{ busy ? 'Checking…' : 'Verify and turn on' }}</button>
      </div>
    </template>

    <template v-else-if="enabled">
      <p class="muted">Recovery codes left: {{ codesLeft }}</p>
      <div class="row">
        <button class="btn" :disabled="busy" @click="newCodes">New recovery codes</button>
        <button class="btn danger" :disabled="busy" @click="disable">Turn off</button>
      </div>
    </template>

    <button v-else class="btn primary" :disabled="busy" @click="startSetup">{{ busy ? 'Preparing…' : 'Set up two-factor authentication' }}</button>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useSupabaseClient } from '#imports'
import { useMfa } from '~/composables/use-mfa'

const supabase = useSupabaseClient()
const { verifiedTotp } = useMfa()
const loading = ref(true)
const busy = ref(false)
const enabled = ref(false)
const codesLeft = ref(0)
const error = ref('')
const code = ref('')
const codes = ref<string[]>([])
const copied = ref(false)
const setup = ref<{ factorId: string, qr: string, secret: string } | null>(null)

const errText = (e: unknown, fallback: string) =>
  (e as { data?: { statusMessage?: string }, message?: string })?.data?.statusMessage
  || (e as { message?: string })?.message || fallback

const refresh = async () => {
  enabled.value = Boolean(await verifiedTotp())
  if (enabled.value) codesLeft.value = (await $fetch<{ recoveryCodesLeft: number }>('/api/auth/mfa/status')).recoveryCodesLeft
}

onMounted(async () => {
  try { await refresh() } catch (e) { error.value = errText(e, 'Could not load two-factor settings') }
  loading.value = false
})

const startSetup = async () => {
  error.value = ''
  busy.value = true
  try {
    const { data: list } = await supabase.auth.mfa.listFactors()
    for (const f of list?.all ?? []) {
      if (f.status !== 'verified') await supabase.auth.mfa.unenroll({ factorId: f.id })
    }
    const { data, error: err } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: `Viorp ${Date.now()}` })
    if (err || !data) throw err ?? new Error('Could not start setup')
    setup.value = { factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret }
    code.value = ''
  } catch (e) {
    error.value = errText(e, 'Could not start setup')
  } finally {
    busy.value = false
  }
}

const cancelSetup = async () => {
  if (setup.value) await supabase.auth.mfa.unenroll({ factorId: setup.value.factorId }).catch(() => undefined)
  setup.value = null
}

const confirmSetup = async () => {
  if (!setup.value) return
  error.value = ''
  busy.value = true
  try {
    const { error: err } = await supabase.auth.mfa.challengeAndVerify({ factorId: setup.value.factorId, code: code.value })
    if (err) throw new Error('That code is not correct. Try the newest code in your app.')
    setup.value = null
    codes.value = (await $fetch<{ codes: string[] }>('/api/auth/mfa/recovery-codes', { method: 'POST' })).codes
    await refresh()
  } catch (e) {
    error.value = errText(e, 'Verification failed')
  } finally {
    busy.value = false
  }
}

const newCodes = async () => {
  busy.value = true
  try {
    codes.value = (await $fetch<{ codes: string[] }>('/api/auth/mfa/recovery-codes', { method: 'POST' })).codes
    await refresh()
  } catch (e) {
    error.value = errText(e, 'Could not create codes')
  } finally {
    busy.value = false
  }
}

const disable = async () => {
  if (!confirm('Turn off two-factor authentication? Sign-in will only need your password.')) return
  busy.value = true
  try {
    await $fetch('/api/auth/mfa/disable', { method: 'POST' })
    await supabase.auth.refreshSession()
    await refresh()
  } catch (e) {
    error.value = errText(e, 'Could not turn off two-factor authentication')
  } finally {
    busy.value = false
  }
}

const copyCodes = async () => {
  await navigator.clipboard?.writeText(codes.value.join('\n'))
  copied.value = true
}
</script>

<style scoped>
.tfa { background: #020617; border: 1px solid #1e293b; border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 12px; font-size: 13px; }
.tfa-head { display: flex; justify-content: space-between; gap: 12px; }
.tfa-head h3 { font-weight: 700; color: #fff; margin: 0 0 4px; }
.tfa-head p, .muted { color: #94a3b8; margin: 0; }
.state { align-self: flex-start; padding: 2px 10px; border-radius: 999px; background: #334155; color: #cbd5e1; font-size: 11px; font-weight: 700; }
.state.on { background: #065f46; color: #6ee7b7; }
.err { color: #fb7185; margin: 0; }
.ok { color: #6ee7b7; margin: 0; }
.steps { color: #cbd5e1; padding-left: 18px; margin: 0; }
.key { color: #a5b4fc; word-break: break-all; }
.qr { width: 180px; height: 180px; background: #fff; border-radius: 8px; padding: 6px; }
.input { background: #0f172a; border: 1px solid #334155; border-radius: 10px; color: #fff; padding: 10px 12px; letter-spacing: 4px; font-size: 18px; max-width: 200px; }
.codes { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; font-family: monospace; color: #e2e8f0; list-style: none; padding: 0; margin: 0; }
.row { display: flex; gap: 8px; flex-wrap: wrap; }
.btn { background: #1e293b; color: #e2e8f0; border-radius: 10px; padding: 9px 14px; font-weight: 700; font-size: 12px; }
.btn.primary { background: #4f46e5; color: #fff; }
.btn.danger { background: #9f1239; color: #fff; }
.btn:disabled { opacity: .5; }
</style>
