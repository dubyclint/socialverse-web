<!-- KYC identity review: queue, fee + sentence, direct assign / revoke (admin). KYC is private; badges are separate. -->
<template>
  <div class="sa">
    <header class="sa-top">
      <NuxtLink to="/admin" class="sa-back"><Icon name="arrow-left" size="18" /> Control</NuxtLink>
      <h1>KYC identity</h1>
    </header>
    <nav class="sa-tabs">
      <button v-for="t in TABS" :key="t.value" :class="{ active: tab === t.value }" @click="tab = t.value">{{ t.label }}</button>
    </nav>
    <p v-if="error" class="sa-error">{{ error }}</p>
    <p v-if="notice" class="sa-ok">{{ notice }}</p>

    <template v-if="tab === 'settings'">
      <div class="sa-card">
        <label class="sa-muted">KYC fee (PEW, charged on approval for both methods)</label>
        <input v-model.number="settings.fee_pew" class="sa-input" type="number" min="0" step="0.01" style="width:120px" />
        <label class="sa-muted" style="display:block;margin-top:10px">Sentence applicants write on paper and hold next to their face. Placeholders: {name} {residence} {id_type} {id_number} {signature} {date}</label>
        <textarea v-model="settings.sentence" class="sa-input" rows="4" style="width:100%" />
        <button class="sa-btn" :disabled="busy" style="margin-top:8px" @click="saveSettings">Save</button>
      </div>
    </template>

    <template v-else-if="tab === 'assign'">
      <div class="sa-card">
        <p class="sa-muted">Admins only. Assign skips the fee.</p>
        <div class="sa-row">
          <input v-model="assign.username" class="sa-input" placeholder="@username" />
          <input v-model="assign.legalName" class="sa-input" placeholder="Legal full name" />
          <input v-model="assign.note" class="sa-input" placeholder="Reason (for revoke)" />
        </div>
        <div class="sa-row" style="margin-top:8px">
          <button class="sa-btn ok" :disabled="busy" @click="direct('assign')">Assign KYC</button>
          <button class="sa-btn danger" :disabled="busy" @click="direct('revoke')">Revoke KYC</button>
        </div>
      </div>
    </template>

    <template v-else>
      <p v-if="loading" class="sa-muted">Loading…</p>
      <p v-else-if="!items.length" class="sa-muted">Nothing here.</p>
      <div v-for="r in items" :key="r.id" class="sa-card">
        <div class="sa-row">
          <div class="sa-who">
            <img :src="r.user?.avatar_url || '/default-avatar.svg'" alt="" />
            <div>
              <div class="sa-name">{{ r.full_name }}</div>
              <div class="sa-muted">@{{ r.user?.username }} · {{ r.method }} · {{ r.status }} · {{ new Date(r.created_at).toLocaleString() }}</div>
            </div>
          </div>
          <div class="sa-muted">Fee {{ r.fee_pew }} PEW · balance {{ r.balance }}<span v-if="r.pay_later"> · pay later</span></div>
        </div>
        <dl v-if="r.method === 'manual'" class="kyc-dl">
          <dt>ID</dt><dd>{{ r.id_type }} · {{ r.id_number }}</dd>
          <dt>Residence</dt><dd>{{ r.residence }}</dd>
          <dt>Signature</dt><dd>{{ r.signature }} · {{ r.signed_on }}</dd>
          <dt>Sentence</dt><dd>{{ r.sentence }}</dd>
        </dl>
        <a v-if="r.photo_url" :href="r.photo_url" target="_blank" rel="noopener"><img :src="r.photo_url" alt="Sentence photo" class="kyc-photo" /></a>
        <p v-if="r.review_note" class="sa-muted">Note: {{ r.review_note }}</p>
        <div v-if="tab === 'pending'" class="sa-row" style="margin-top:8px">
          <input v-model="notes[r.id]" class="sa-input" placeholder="Reason (required to reject)" style="flex:1" />
          <button class="sa-btn ok" :disabled="busy" @click="act(r.id, 'approve')">Approve &amp; charge</button>
          <button class="sa-btn danger" :disabled="busy" @click="act(r.id, 'reject')">Reject</button>
          <button v-if="r.balance < r.fee_pew && !r.pay_later" class="sa-btn secondary" :disabled="busy" @click="notes[r.id] = 'Low PEW balance for KYC fee'; act(r.id, 'reject')">Reject: low balance</button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import '~/assets/css/staff-admin.css'

definePageMeta({ middleware: ['auth', 'route-guard'], layout: 'default' })

interface Row {
  id: string, user_id: string, method: string, status: string, full_name: string, id_type?: string, id_number?: string,
  residence?: string, signature?: string, signed_on?: string, sentence?: string, fee_pew: number, pay_later: boolean,
  review_note?: string, created_at: string, balance: number, photo_url: string | null, user: { username: string, avatar_url: string | null } | null
}
const TABS = [
  { value: 'pending', label: 'Queue' }, { value: 'approved', label: 'Approved' }, { value: 'rejected', label: 'Rejected' },
  { value: 'settings', label: 'Fee & sentence' }, { value: 'assign', label: 'Assign / revoke' }
] as const
const tab = ref<typeof TABS[number]['value']>('pending')
const items = ref<Row[]>([])
const settings = reactive({ fee_pew: 1.4, sentence: '' })
const assign = reactive({ username: '', legalName: '', note: '' })
const notes = reactive<Record<string, string>>({})
const loading = ref(false)
const busy = ref(false)
const error = ref('')
const notice = ref('')
const msg = (e: unknown) => (e as { data?: { statusMessage?: string } })?.data?.statusMessage || 'Something went wrong'

const load = async () => {
  if (tab.value === 'assign') return
  loading.value = true
  error.value = ''
  try {
    const r = await $fetch<{ items: Row[], settings: { fee_pew: number, sentence: string } }>('/api/admin/kyc', { query: { status: tab.value === 'settings' ? 'pending' : tab.value } })
    items.value = r.items
    Object.assign(settings, r.settings)
  } catch (e) { error.value = msg(e) } finally { loading.value = false }
}
const run = async (fn: () => Promise<unknown>, ok: string) => {
  busy.value = true; error.value = ''; notice.value = ''
  try { await fn(); notice.value = ok; await load() } catch (e) { error.value = msg(e) } finally { busy.value = false }
}
const act = (id: string, action: 'approve' | 'reject') =>
  run(() => $fetch('/api/admin/kyc/action', { method: 'POST', body: { action, requestId: id, note: notes[id] } }), action === 'approve' ? 'Approved and charged' : 'Rejected')
const direct = (action: 'assign' | 'revoke') =>
  run(() => $fetch('/api/admin/kyc/action', { method: 'POST', body: { action, ...assign } }), action === 'assign' ? 'KYC assigned' : 'KYC revoked')
const saveSettings = () => run(() => $fetch('/api/admin/kyc/settings', { method: 'PUT', body: settings }), 'Saved')

watch(tab, load)
onMounted(load)
</script>

<style scoped>
.kyc-dl { display: grid; grid-template-columns: 90px 1fr; gap: 4px 10px; font-size: .85rem; margin: 10px 0; }
.kyc-dl dt { color: var(--text-secondary, #6b7280); }
.kyc-dl dd { margin: 0; word-break: break-word; }
.kyc-photo { max-width: 260px; max-height: 260px; border-radius: 8px; object-fit: contain; }
</style>
