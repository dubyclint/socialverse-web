<!-- Admin escrow console over the P2P trade book. -->
<template>
  <div class="admin-escrow">
    <div class="escrow-header">
      <h3>🛡️ Escrow Management</h3>
      <div class="header-actions">
        <select v-model="statusFilter" class="form-input" @change="loadTrades">
          <option value="funded">Funded</option>
            <option value="disputed">Disputed</option>
          <option value="released">Released</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button class="btn btn-secondary" :disabled="loading" @click="loadTrades">
          {{ loading ? 'Loading...' : 'Refresh' }}
        </button>
      </div>
    </div>

    <div v-if="error" class="alert alert-error"><p>{{ error }}</p></div>

    <div class="deals-section">
      <div v-if="trades.length === 0" class="empty-state"><p>No escrow trades in this state</p></div>

      <ul v-else class="deals-list">
        <li v-for="trade in trades" :key="trade.id" class="deal-item">
          <div class="deal-info">
            <div class="deal-header">
              <span class="deal-id">Trade {{ trade.trade_id.slice(0, 8) }}</span>
              <span class="trade-id">{{ formatDate(trade.timestamp) }}</span>
            </div>
            <div class="deal-details">
              <span class="amount">💰 {{ trade.amount }} PEW</span>
              <span class="status">buyer {{ trade.buyer_id.slice(0, 8) }} · seller {{ trade.seller_id.slice(0, 8) }}</span>
            </div>
          </div>
          <div class="deal-actions">
            <button
              class="btn btn-sm btn-success"
              :disabled="processing === trade.id || trade.is_released || trade.is_refunded"
              @click="settle(trade.id, 'release')"
            >
              {{ processing === trade.id ? '...' : 'Release to buyer' }}
            </button>
            <button
              class="btn btn-sm btn-danger"
              :disabled="processing === trade.id || trade.is_released || trade.is_refunded"
              @click="settle(trade.id, 'refund')"
            >
              {{ processing === trade.id ? '...' : 'Refund seller' }}
            </button>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
interface EscrowTradeView {
  id: string
  trade_id: string
  buyer_id: string
  seller_id: string
  amount: number
  token: string
  is_released: boolean
  is_refunded: boolean
  timestamp: string
  updated_at: string
}

const trades = ref<EscrowTradeView[]>([])
const statusFilter = ref('funded')
const loading = ref(false)
const processing = ref<string | null>(null)
const error = ref('')

function message(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'statusMessage' in err) {
    return String((err as { statusMessage?: string }).statusMessage ?? fallback)
  }
  return fallback
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString()
}

async function loadTrades() {
  loading.value = true
  error.value = ''
  try {
    const res = await $fetch<{ data: { trades: EscrowTradeView[] } }>('/api/escrow', {
      query: { status: statusFilter.value, limit: 50 }
    })
    trades.value = res.data.trades
  } catch (err) {
    error.value = message(err, 'Failed to load escrow trades')
  } finally {
    loading.value = false
  }
}

async function settle(tradeId: string, action: 'release' | 'refund') {
  processing.value = tradeId
  error.value = ''
  try {
    await $fetch('/api/escrow', { method: 'PUT', body: { tradeId, action } })
    await loadTrades()
  } catch (err) {
    error.value = message(err, `Failed to ${action} the trade`)
  } finally {
    processing.value = null
  }
}

onMounted(loadTrades)
</script>

<style scoped>
.admin-escrow { padding: 1.5rem; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); }
.escrow-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
.escrow-header h3 { margin: 0; font-size: 1.3rem; color: #333; }
.header-actions { display: flex; gap: 0.5rem; }
.alert { padding: 1rem; border-radius: 4px; margin-bottom: 1rem; }
.alert-error { background: #fee; border: 1px solid #fcc; color: #c33; }
.form-input { padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; font-size: 0.9rem; }
.empty-state { text-align: center; padding: 2rem; color: #999; background: #f9f9f9; border-radius: 4px; }
.deals-list { list-style: none; padding: 0; margin: 0; }
.deal-item { padding: 1rem; margin-bottom: 0.75rem; background: #f9f9f9; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #eee; }
.deal-info { flex: 1; }
.deal-header { display: flex; gap: 1rem; margin-bottom: 0.5rem; }
.deal-id { font-weight: bold; color: #333; }
.trade-id { color: #666; font-size: 0.9rem; }
.deal-details { display: flex; gap: 1rem; font-size: 0.9rem; }
.amount { color: #28a745; font-weight: 500; }
.status { color: #666; }
.deal-actions { display: flex; gap: 0.5rem; }
.btn { padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer; font-size: 0.9rem; font-weight: 500; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-success { background: #28a745; color: white; }
.btn-danger { background: #dc3545; color: white; }
.btn-secondary { background: #6c757d; color: white; }
.btn-sm { padding: 0.35rem 0.75rem; font-size: 0.85rem; }
</style>
