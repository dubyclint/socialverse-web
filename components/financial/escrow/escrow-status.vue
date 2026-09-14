<template>
  <section class="escrow-status">
    <h3>Escrow</h3>
    <p v-if="!trade" class="empty">No active trade selected.</p>
    <template v-else>
      <dl>
        <div><dt>Status</dt><dd>{{ statusLabel }}</dd></div>
        <div><dt>Locked</dt><dd>{{ trade.amount }} Pewgift</dd></div>
        <div><dt>You pay</dt><dd>{{ trade.source_amount ?? '—' }} {{ trade.asset_code }}</dd></div>
        <div><dt>Platform fee</dt><dd>{{ trade.fee_pewgift }} Pewgift</dd></div>
        <div v-if="trade.expires_at"><dt>Expires</dt><dd>{{ new Date(trade.expires_at).toLocaleString() }}</dd></div>
      </dl>

      <div v-if="payout" class="payout">
        <h4>Seller payout details</h4>
        <p v-if="payout.kind === 'CUSTOM'">{{ payout.instructions }}</p>
        <template v-else>
          <p>{{ payout.account_name }}</p>
          <p>{{ payout.account_ref }}</p>
          <p v-if="payout.bank_name">{{ payout.bank_name }}</p>
          <p v-if="payout.network">Network: {{ payout.network }}</p>
        </template>
      </div>

      <div class="actions">
        <button v-if="isBuyer && trade.status === 'funded' && !trade.paid_declared_at" @click="run('paid')">
          I have paid
        </button>
        <button v-if="isSeller && trade.status === 'funded'" @click="run('release')">Release escrow</button>
        <button v-if="canCancel" class="ghost" @click="run('cancel')">Cancel</button>
        <button v-if="trade.status === 'funded'" class="ghost" @click="raiseDispute">Dispute</button>
      </div>
      <p v-if="error" class="error">{{ error }}</p>
    </template>
  </section>
</template>

<script setup lang="ts">
import type { P2PTrade } from '~/types/p2p'

const props = defineProps<{ tradeId?: string | null }>()

const user = useSupabaseUser()
const { act, loadTrade, error } = useP2p()
const trade = ref<P2PTrade | null>(null)

const payout = computed(() => trade.value?.seller_payment_methods ?? null)
const isBuyer = computed(() => trade.value?.buyer_id === user.value?.id)
const isSeller = computed(() => trade.value?.seller_id === user.value?.id)
const canCancel = computed(() => trade.value ? ['created', 'funded'].includes(trade.value.status) : false)

const statusLabel = computed(() => {
  if (!trade.value) return ''
  if (trade.value.status === 'funded' && trade.value.paid_declared_at) return 'Payment declared — awaiting release'
  return trade.value.status
})

async function refresh() {
  if (!props.tradeId) {
    trade.value = null
    return
  }
  trade.value = await loadTrade(props.tradeId)
}

async function run(action: 'paid' | 'release' | 'cancel', reason?: string) {
  if (!props.tradeId) return
  if (await act(props.tradeId, action, reason)) await refresh()
}

async function raiseDispute() {
  if (!props.tradeId) return
  const reason = window.prompt('Describe the problem for the admin reviewing this trade:')
  if (!reason) return
  if (await act(props.tradeId, 'dispute', reason)) await refresh()
}

watch(() => props.tradeId, refresh, { immediate: true })
</script>

<style scoped>
.escrow-status { border: 1px solid #e2e2e2; border-radius: 8px; padding: 1rem; }
dl { display: grid; gap: 0.35rem; margin: 0 0 1rem; }
dl > div { display: flex; justify-content: space-between; gap: 1rem; }
dt { color: #666; }
dd { margin: 0; font-weight: 600; }
.payout { background: #f7f7f7; border-radius: 6px; padding: 0.75rem; margin-bottom: 1rem; }
.payout p { margin: 0.1rem 0; }
.actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.ghost { background: transparent; border: 1px solid #ccc; }
.empty { color: #777; }
.error { color: #b00020; }
</style>
