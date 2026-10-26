<template>
  <div class="rp">
    <div class="card">
      <h1>Set a new password</h1>
      <p v-if="linkError" class="err">{{ linkError }} <NuxtLink to="/auth/forgot-password">Request a new link</NuxtLink></p>
      <template v-else-if="!done">
        <p class="sub">You can change your password once a month.</p>
        <label class="field"><span>New password</span><input v-model="password" type="password" autocomplete="new-password" /></label>
        <label class="field"><span>Confirm password</span><input v-model="confirm" type="password" autocomplete="new-password" /></label>
        <button class="btn" :disabled="busy || !password || password !== confirm" @click="submit">{{ busy ? 'Saving…' : 'Save password' }}</button>
        <p v-if="password && confirm && password !== confirm" class="err">Passwords don't match.</p>
        <p v-if="error" class="err">{{ error }}</p>
      </template>
      <template v-else>
        <p class="ok">Password changed. Sign in with your new password.</p>
        <NuxtLink to="/signin" class="btn">Go to sign in</NuxtLink>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const token = ref('')
const linkError = ref('')
const password = ref('')
const confirm = ref('')
const busy = ref(false)
const error = ref('')
const done = ref(false)

onMounted(() => {
  const hash = new URLSearchParams(window.location.hash.slice(1))
  const query = new URLSearchParams(window.location.search)
  const err = hash.get('error_description') || query.get('error_description')
  if (err) { linkError.value = err.replace(/\+/g, ' '); return }
  token.value = hash.get('access_token') || ''
  if (!token.value || (hash.get('type') && hash.get('type') !== 'recovery')) linkError.value = 'This reset link is invalid or has expired.'
  history.replaceState(null, '', window.location.pathname)
})

async function submit() {
  busy.value = true; error.value = ''
  try {
    await $fetch('/api/auth/password/update', { method: 'POST', body: { accessToken: token.value, password: password.value } })
    done.value = true
    await useSupabaseClient().auth.signOut().catch(() => {})
  } catch (e) {
    error.value = (e as { data?: { statusMessage?: string } })?.data?.statusMessage || 'Could not change the password'
  } finally { busy.value = false }
}
</script>

<style scoped>
.rp { min-height: 100dvh; display: grid; place-items: center; padding: 16px; background: #020617; color: #e2e8f0; }
.card { width: 100%; max-width: 400px; background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 20px; display: flex; flex-direction: column; gap: 10px; }
h1 { font-size: 20px; margin: 0; }
.sub { font-size: 13px; color: #94a3b8; margin: 0; }
.field { display: flex; flex-direction: column; gap: 4px; }
.field span { font-size: 12px; color: #94a3b8; }
.field input { background: #020617; border: 1px solid #334155; border-radius: 10px; padding: 10px 12px; color: #f8fafc; font-size: 16px; }
.btn { display: block; text-align: center; background: #4f46e5; color: #fff; border: 0; border-radius: 10px; padding: 10px; font-weight: 600; }
.btn:disabled { opacity: .5; }
.err { color: #fca5a5; font-size: 13px; margin: 0; }
.err a { color: #a5b4fc; }
.ok { color: #86efac; font-size: 14px; margin: 0; }
</style>
