<template>
  <div class="ad-slots">
    <header class="page-header">
      <h1>External Ad Slots</h1>
      <p>
        Placements used when in-app inventory cannot fill an ad slot. Up to three can be active;
        the viewer gets the placement matching the most of their interests, ties broken by bid.
      </p>
    </header>

    <p v-if="error" class="alert error">{{ error }}</p>
    <p v-if="notice" class="alert ok">{{ notice }}</p>

    <form class="slot-form" @submit.prevent="save">
      <div class="grid">
        <label>
          <span>Label</span>
          <input v-model="form.label" required placeholder="AdSense — feed inline">
        </label>
        <label>
          <span>Provider</span>
          <select v-model="form.provider">
            <option v-for="p in providers" :key="p" :value="p">{{ p }}</option>
          </select>
        </label>
        <label>
          <span>Publisher / client ID</span>
          <input v-model="form.clientId" required placeholder="ca-pub-0000000000000000">
        </label>
        <label>
          <span>Slot / placement ID</span>
          <input v-model="form.slotId" required placeholder="1234567890">
        </label>
        <label>
          <span>Bid per 1000 impressions</span>
          <input v-model.number="form.bidPerMille" type="number" min="0" step="0.01">
        </label>
        <label class="checkbox">
          <input v-model="form.isActive" type="checkbox">
          <span>Active</span>
        </label>
      </div>

      <fieldset class="interests">
        <legend>Target interests (none selected = shown to everyone)</legend>
        <label v-for="interest in interests" :key="interest.id" class="interest-chip">
          <input v-model="form.interestIds" type="checkbox" :value="interest.id">
          <span>{{ interest.name }}</span>
        </label>
      </fieldset>

      <div class="actions">
        <button type="submit" :disabled="saving">{{ form.id ? 'Update slot' : 'Add slot' }}</button>
        <button v-if="form.id" type="button" class="ghost" @click="resetForm">Cancel</button>
      </div>
    </form>

    <table v-if="slots.length" class="slot-table">
      <thead>
        <tr>
          <th>Label</th>
          <th>Provider</th>
          <th>Client</th>
          <th>Slot</th>
          <th>Bid/1k</th>
          <th>Interests</th>
          <th>Active</th>
          <th />
        </tr>
      </thead>
      <tbody>
        <tr v-for="slot in slots" :key="slot.id">
          <td>{{ slot.label }}</td>
          <td>{{ slot.provider }}</td>
          <td class="mono">{{ slot.client_id }}</td>
          <td class="mono">{{ slot.slot_id }}</td>
          <td>{{ Number(slot.bid_per_mille).toFixed(2) }}</td>
          <td>{{ (slot.interest_ids || []).length || 'all' }}</td>
          <td>{{ slot.is_active ? 'yes' : 'no' }}</td>
          <td class="row-actions">
            <button type="button" @click="edit(slot)">Edit</button>
            <button type="button" class="danger" @click="remove(slot.id)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>
    <p v-else-if="!loading" class="empty">No external slots registered — the fallback renders nothing.</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'

definePageMeta({
  middleware: ['auth', 'profile-completion'],
  layout: 'default'
})

useHead({ title: 'External Ad Slots' })

interface SlotRow {
  id: string
  label: string
  provider: string
  client_id: string
  slot_id: string
  interest_ids: string[] | null
  bid_per_mille: number
  is_active: boolean
}

interface Interest {
  id: string
  name: string
}

const providers = ['adsense', 'meta', 'taboola', 'outbrain', 'custom']

const slots = ref<SlotRow[]>([])
const interests = ref<Interest[]>([])
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const notice = ref('')

const form = reactive({
  id: '' as string,
  label: '',
  provider: 'adsense',
  clientId: '',
  slotId: '',
  bidPerMille: 0,
  isActive: true,
  interestIds: [] as string[]
})

const resetForm = () => {
  form.id = ''
  form.label = ''
  form.provider = 'adsense'
  form.clientId = ''
  form.slotId = ''
  form.bidPerMille = 0
  form.isActive = true
  form.interestIds = []
}

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    const [slotRes, interestRes] = await Promise.all([
      $fetch<{ data: SlotRow[] }>('/api/admin/external-ad-slots'),
      $fetch<{ data?: Interest[] } | Interest[]>('/api/admin/interests/list')
    ])
    slots.value = slotRes.data ?? []
    interests.value = Array.isArray(interestRes) ? interestRes : interestRes.data ?? []
  } catch (err) {
    error.value = (err as { data?: { statusMessage?: string } })?.data?.statusMessage
      || 'Failed to load ad slots'
  } finally {
    loading.value = false
  }
}

const save = async () => {
  saving.value = true
  error.value = ''
  notice.value = ''
  try {
    await $fetch('/api/admin/external-ad-slots', {
      method: 'POST',
      body: {
        id: form.id || undefined,
        label: form.label,
        provider: form.provider,
        clientId: form.clientId,
        slotId: form.slotId,
        bidPerMille: form.bidPerMille,
        isActive: form.isActive,
        interestIds: form.interestIds
      }
    })
    notice.value = 'Saved — the feed starts serving this placement immediately.'
    resetForm()
    await load()
  } catch (err) {
    error.value = (err as { data?: { statusMessage?: string } })?.data?.statusMessage
      || 'Failed to save slot'
  } finally {
    saving.value = false
  }
}

const edit = (slot: SlotRow) => {
  form.id = slot.id
  form.label = slot.label
  form.provider = slot.provider
  form.clientId = slot.client_id
  form.slotId = slot.slot_id
  form.bidPerMille = Number(slot.bid_per_mille)
  form.isActive = slot.is_active
  form.interestIds = [...(slot.interest_ids ?? [])]
}

const remove = async (id: string) => {
  error.value = ''
  try {
    await $fetch('/api/admin/external-ad-slots', { method: 'DELETE', query: { id } })
    await load()
  } catch (err) {
    error.value = (err as { data?: { statusMessage?: string } })?.data?.statusMessage
      || 'Failed to delete slot'
  }
}

onMounted(load)
</script>

<style scoped>
.ad-slots {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem 1rem;
  color: #e2e8f0;
}

.page-header p {
  color: #94a3b8;
  max-width: 60ch;
}

.alert {
  padding: 0.6rem 0.9rem;
  border-radius: 8px;
}

.alert.error {
  background: #7f1d1d;
}

.alert.ok {
  background: #14532d;
}

.slot-form {
  background: #111827;
  border: 1px solid #1f2937;
  border-radius: 12px;
  padding: 1.25rem;
  margin: 1rem 0 2rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}

label {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.85rem;
}

label.checkbox {
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
}

input,
select {
  background: #0b1220;
  border: 1px solid #1f2937;
  border-radius: 8px;
  padding: 0.55rem 0.7rem;
  color: inherit;
}

.interests {
  margin-top: 1.25rem;
  border: 1px solid #1f2937;
  border-radius: 10px;
  padding: 0.75rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.interest-chip {
  flex-direction: row;
  align-items: center;
  gap: 0.35rem;
}

.actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.25rem;
}

button {
  background: #2563eb;
  border: none;
  color: white;
  padding: 0.55rem 1.1rem;
  border-radius: 8px;
  cursor: pointer;
}

button.ghost {
  background: transparent;
  border: 1px solid #334155;
}

button.danger {
  background: #b91c1c;
}

.slot-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.slot-table th,
.slot-table td {
  text-align: left;
  padding: 0.6rem 0.5rem;
  border-bottom: 1px solid #1f2937;
}

.mono {
  font-family: ui-monospace, monospace;
  font-size: 0.8rem;
}

.row-actions {
  display: flex;
  gap: 0.5rem;
}

.empty {
  color: #94a3b8;
}
</style>
