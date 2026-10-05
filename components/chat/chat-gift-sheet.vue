<template>
  <div class="gift-overlay" @click.self="$emit('close')">
    <div class="gift-sheet" role="dialog" aria-label="Send a gift">
      <header class="gift-header">
        <h3>Send {{ recipientLabel }} a gift</h3>
        <button class="gift-close" aria-label="Close" @click="$emit('close')"><Icon name="x" /></button>
      </header>

      <div v-if="members?.length" class="gift-recipients" role="radiogroup" aria-label="Recipient">
        <button
          v-for="member in members"
          :key="member.userId"
          type="button"
          role="radio"
          :aria-checked="recipient === member.userId"
          class="gift-recipient"
          :class="{ selected: recipient === member.userId }"
          @click="recipient = member.userId"
        >
          <img v-if="member.avatar" :src="member.avatar" alt="" class="gift-recipient-avatar" />
          <span v-else class="gift-recipient-avatar gift-recipient-initial">{{ member.name.charAt(0).toUpperCase() }}</span>
          <span class="gift-recipient-name">{{ member.name }}</span>
        </button>
      </div>

      <p v-if="loading" class="gift-hint">Loading gifts…</p>
      <p v-else-if="!gifts.length && !error" class="gift-hint">No gifts are available right now.</p>
      <div v-else class="gift-grid">
        <button
          v-for="gift in gifts"
          :key="gift.id"
          class="gift-item"
          :class="{ selected: selected?.id === gift.id }"
          @click="selected = gift"
        >
          <img v-if="gift.icon_url" :src="gift.icon_url" alt="" class="gift-icon" />
          <Icon v-else name="gift" class="gift-icon" />
          <span class="gift-name">{{ gift.name }}</span>
          <span class="gift-cost">{{ gift.cost_credits }} PEW</span>
        </button>
      </div>

      <label class="gift-qty">
        Quantity
        <input v-model.number="quantity" type="number" min="1" max="99" />
      </label>

      <p v-if="error" class="gift-error" role="alert">{{ error }}</p>
      <p v-if="sent" class="gift-ok">Gift sent</p>

      <button class="gift-send" :disabled="!selected || !recipient || sending || sent" @click="send">
        {{ sending ? 'Sending…' : !recipient ? 'Pick who to gift' : selected ? `Send for ${total} PEW` : 'Pick a gift' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Icon from '@/components/ui/icon.vue'
import type { ChatMember } from '~/types/chat'

interface CatalogGift {
  id: string
  name: string
  cost_credits: number
  icon_url: string | null
}

const props = defineProps<{
  chatId: string
  /** Fixed recipient (direct chats). */
  recipientId?: string
  recipientName?: string
  /** Pickable recipients (group chats). */
  members?: ChatMember[]
}>()

const emit = defineEmits<{ close: [], sent: [] }>()

const recipient = ref(props.recipientId ?? (props.members?.length === 1 ? props.members[0]!.userId : ''))
const recipientLabel = computed(() =>
  props.recipientName
  || props.members?.find(member => member.userId === recipient.value)?.name
  || 'someone')

const gifts = ref<CatalogGift[]>([])
const selected = ref<CatalogGift | null>(null)
const quantity = ref(1)
const loading = ref(true)
const sending = ref(false)
const sent = ref(false)
const error = ref('')

const safeQuantity = computed(() => Math.min(99, Math.max(1, Math.floor(quantity.value || 1))))
const total = computed(() => (selected.value ? Number(selected.value.cost_credits) * safeQuantity.value : 0))

onMounted(async () => {
  try {
    const response = await $fetch<{ data: CatalogGift[] }>('/api/pewgift/types')
    gifts.value = response.data ?? []
  } catch {
    error.value = 'Could not load gifts'
  } finally {
    loading.value = false
  }
})

const send = async () => {
  if (!selected.value || !recipient.value) return
  sending.value = true
  error.value = ''
  try {
    await $fetch('/api/pewgift/send-to-chat', {
      method: 'POST',
      body: {
        chatId: props.chatId,
        recipientId: recipient.value,
        giftTypeId: selected.value.id,
        quantity: safeQuantity.value
      }
    })
    sent.value = true
    emit('sent')
    setTimeout(() => emit('close'), 1200)
  } catch (err: unknown) {
    const detail = (err as { data?: { statusMessage?: string } })?.data?.statusMessage
    error.value = detail || 'Failed to send gift'
  } finally {
    sending.value = false
  }
}
</script>

<style scoped>
.gift-overlay {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(0, 0, 0, 0.55);
}
.gift-sheet {
  width: min(460px, 100vw);
  max-height: 85vh;
  overflow-y: auto;
  padding: 1rem 1rem calc(1rem + env(safe-area-inset-bottom));
  border-radius: 16px 16px 0 0;
  background: var(--color-bg-primary, #fff);
  color: var(--color-text-primary, #111);
}
@media (min-width: 640px) {
  .gift-overlay { align-items: center; }
  .gift-sheet { border-radius: 16px; }
}
.gift-header { display: flex; align-items: center; justify-content: space-between; }
.gift-header h3 { margin: 0; font-size: 1rem; }
.gift-close { border: 0; background: none; cursor: pointer; color: inherit; }
.gift-recipients { display: flex; gap: 0.5rem; overflow-x: auto; padding: 0.75rem 0 0.25rem; }
.gift-recipient {
  display: flex; flex-direction: column; align-items: center; gap: 0.25rem;
  min-width: 64px; padding: 0.4rem; border: 2px solid transparent; border-radius: 12px;
  background: none; color: inherit; cursor: pointer;
}
.gift-recipient.selected { border-color: var(--color-primary, #6366f1); }
.gift-recipient-avatar { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; }
.gift-recipient-initial {
  display: flex; align-items: center; justify-content: center;
  background: var(--color-bg-secondary, #e5e7eb); font-weight: 700;
}
.gift-recipient-name { font-size: 0.7rem; max-width: 64px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.gift-hint { color: var(--color-text-muted, #6b7280); font-size: 0.875rem; }
.gift-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(92px, 1fr));
  gap: 0.5rem;
  margin: 0.75rem 0;
}
.gift-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.6rem 0.4rem;
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 12px;
  background: none;
  color: inherit;
  cursor: pointer;
}
.gift-item.selected { border-color: #3b82f6; background: rgba(59, 130, 246, 0.1); }
.gift-icon { width: 36px; height: 36px; object-fit: contain; }
.gift-name { font-size: 0.8rem; font-weight: 600; text-align: center; }
.gift-cost { font-size: 0.75rem; color: var(--color-text-muted, #6b7280); }
.gift-qty { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; }
.gift-qty input {
  width: 4.5rem;
  padding: 0.35rem 0.5rem;
  border: 1px solid var(--color-border, #d1d5db);
  border-radius: 8px;
  background: transparent;
  color: inherit;
}
.gift-error { color: #dc2626; font-size: 0.875rem; }
.gift-ok { color: #16a34a; font-size: 0.875rem; }
.gift-send {
  width: 100%;
  margin-top: 0.75rem;
  padding: 0.75rem;
  border: 0;
  border-radius: 10px;
  background: #3b82f6;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}
.gift-send:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
