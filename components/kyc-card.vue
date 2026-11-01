<!-- Private identity verification (KYC). Only the owner sees this. -->
<template>
  <section id="kyc" class="vcard">
    <div class="vhead"><h3>Identity (KYC)</h3><span v-if="kyc?.status === 'verified'" class="ok-pill">Verified · private</span></div>
    <p v-if="loading" class="muted">Loading…</p>
    <template v-else-if="kyc?.status === 'verified'">
      <p class="muted">Legal name: <strong>{{ kyc.legal_name }}</strong>. Used for P2P and withdrawals. Only you can see this.</p>
    </template>
    <p v-else-if="kyc?.status === 'pending'" class="muted">Your KYC is under review.</p>
    <template v-else>
      <p v-if="request?.status === 'rejected' || kyc?.status === 'revoked'" class="error">
        {{ kyc?.status === 'revoked' ? 'Your KYC was revoked' : 'Last KYC was not approved' }}<span v-if="request?.review_note">: {{ request.review_note }}</span>. You can apply again.
      </p>
      <p class="muted">KYC verifies your legal name for withdrawals and P2P. Fee: {{ settings?.fee_pew }} PEW (charged on approval).</p>
      <div class="warn"><strong>Important:</strong> Viorp may ask for extra verification through Support chat, chat messages, email, or a live voice or video call.</div>
      <div class="modes">
        <button type="button" :class="['mode', { active: mode === 'manual' }]" @click="mode = 'manual'">Manual</button>
        <button v-if="diditEnabled" type="button" :class="['mode', { active: mode === 'didit' }]" @click="mode = 'didit'">Fast (automatic)</button>
      </div>
      <form class="vform" @submit.prevent="submit">
        <input v-model="form.fullName" class="inp" placeholder="Full legal name (as on your ID)" autocomplete="name" required />
        <template v-if="mode === 'manual'">
          <select v-model="form.idType" class="inp" required>
            <option value="" disabled>Government ID type</option>
            <option v-for="t in ID_TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
          </select>
          <input v-model="form.idNumber" class="inp" placeholder="ID number" required />
          <input v-model="form.residence" class="inp" placeholder="Resident of (city, country)" required />
          <input v-model="form.signature" class="inp" placeholder="Signature (type your name)" required />
          <input v-model="form.signedOn" class="inp" type="date" required />
          <p class="muted">Write this on paper, hold it close to your face, take a photo and upload it:</p>
          <blockquote class="sentence">{{ sentence }}</blockquote>
          <input type="file" accept="image/jpeg,image/png,image/webp" @change="upload" />
          <p v-if="photoPath" class="muted">Photo uploaded.</p>
        </template>
        <label v-if="lowBalance" class="tiny"><input v-model="form.payLater" type="checkbox" class="tick" /> My balance is {{ balance }} PEW. Pay the fee later: it becomes a negative balance paid from my next deposit or gift.</label>
        <p v-if="lowBalance && mode === 'didit' && !form.payLater" class="muted">Or use Manual: you can submit now, and the fee is charged when it's approved.</p>
        <label class="tiny"><input v-model="form.accept" type="checkbox" class="tick" /> I confirm these details are true and agree to the <NuxtLink to="/terms-and-policy">Terms</NuxtLink>.</label>
        <p v-if="err" class="error">{{ err }}</p>
        <button type="submit" class="btn" :disabled="busy || uploading || !form.accept">{{ busy ? 'Sending…' : mode === 'didit' ? 'Start verification' : 'Submit KYC' }}</button>
      </form>
    </template>
  </section>
</template>

<script setup lang="ts">
interface Kyc { status: string, legal_name: string | null }
interface Status { kyc: Kyc, settings: { fee_pew: number, sentence: string }, request: { status: string, review_note: string | null } | null, balance: number, didit_enabled: boolean }
const ID_TYPES = [
  { value: 'national_id', label: 'National ID' }, { value: 'passport', label: 'Passport' },
  { value: 'drivers_license', label: "Driver's licence" }, { value: 'voters_card', label: "Voter's card" },
  { value: 'residence_permit', label: 'Residence permit' }
]
const loading = ref(true)
const busy = ref(false)
const uploading = ref(false)
const err = ref('')
const kyc = ref<Kyc | null>(null)
const settings = ref<Status['settings'] | null>(null)
const request = ref<Status['request']>(null)
const balance = ref(0)
const diditEnabled = ref(false)
const mode = ref<'manual' | 'didit'>('manual')
const photoPath = ref('')
const form = reactive({ fullName: '', idType: '', idNumber: '', residence: '', signature: '', signedOn: new Date().toISOString().slice(0, 10), payLater: false, accept: false })
const lowBalance = computed(() => settings.value ? balance.value < settings.value.fee_pew : false)
const idLabel = computed(() => ID_TYPES.find(t => t.value === form.idType)?.label || '____')
const sentence = computed(() => (settings.value?.sentence || '')
  .replace('{name}', form.fullName || '____').replace('{residence}', form.residence || '____')
  .replace('{id_type}', idLabel.value).replace('{id_number}', form.idNumber || '____')
  .replace('{signature}', form.signature || '____').replace('{date}', form.signedOn || '____'))
const msg = (e: unknown) => (e as { data?: { statusMessage?: string } })?.data?.statusMessage || 'Something went wrong'

const load = async () => {
  try {
    const s = await $fetch<Status>('/api/kyc/status')
    kyc.value = s.kyc; settings.value = s.settings; request.value = s.request; balance.value = s.balance; diditEnabled.value = s.didit_enabled
  } finally { loading.value = false }
}
const upload = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  uploading.value = true; err.value = ''
  try {
    const fd = new FormData(); fd.append('file', file)
    photoPath.value = (await $fetch<{ path: string }>('/api/verification/document', { method: 'POST', body: fd })).path
  } catch (x) { err.value = msg(x) } finally { uploading.value = false }
}
const submit = async () => {
  busy.value = true; err.value = ''
  try {
    if (mode.value === 'didit') {
      const r = await $fetch<{ url: string }>('/api/kyc/didit-session', { method: 'POST', body: { fullName: form.fullName, payLater: form.payLater, acceptTerms: form.accept } })
      window.location.href = r.url
      return
    }
    await $fetch('/api/kyc/manual', { method: 'POST', body: { ...form, sentencePhotoPath: photoPath.value, acceptTerms: form.accept } })
    await load()
  } catch (x) { err.value = msg(x) } finally { busy.value = false }
}
onMounted(load)
</script>

<style scoped>
.vcard { background: var(--bg-card, #fff); border: 1px solid var(--border-color, #e5e7eb); border-radius: 12px; padding: 14px; margin: 12px 0; }
.vhead { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.vhead h3 { margin: 0; font-size: 1rem; }
.ok-pill { font-size: .72rem; background: #059669; color: #fff; border-radius: 999px; padding: 2px 8px; }
.warn { background: #7f1d1d22; border: 1px solid #dc2626; color: #dc2626; border-radius: 8px; padding: 8px 10px; font-size: .82rem; font-weight: 700; margin: 8px 0; }
.modes { display: flex; gap: 6px; margin: 8px 0; }
.mode { padding: 6px 12px; border-radius: 999px; border: 1px solid var(--border-color, #e5e7eb); background: transparent; color: inherit; font-size: .82rem; cursor: pointer; }
.mode.active { background: #7c3aed; border-color: #7c3aed; color: #fff; }
.vform { display: flex; flex-direction: column; gap: 8px; }
.inp { width: 100%; padding: 8px 10px; border-radius: 8px; border: 1px solid var(--border-color, #e5e7eb); background: transparent; color: inherit; font-size: .88rem; }
.sentence { margin: 0; padding: 8px 10px; border-left: 3px solid #7c3aed; font-size: .85rem; font-style: italic; }
.tiny { display: flex; align-items: flex-start; gap: 6px; font-size: .75rem; color: var(--text-secondary, #6b7280); line-height: 1.35; }
.tick { appearance: none; -webkit-appearance: none; flex-shrink: 0; width: 12px !important; height: 12px !important; min-height: 12px !important; margin-top: 2px; border: 1px solid #94a3b8; border-radius: 3px; cursor: pointer; }
.tick:checked { background: #7c3aed; border-color: #7c3aed; }
.btn { padding: 8px 14px; border-radius: 8px; border: 0; background: #7c3aed; color: #fff; cursor: pointer; }
.btn:disabled { opacity: .6; }
.muted { color: var(--text-secondary, #6b7280); font-size: .85rem; margin: 4px 0; }
.error { color: #dc2626; font-size: .85rem; margin: 4px 0; }
</style>
