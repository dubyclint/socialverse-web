<!-- FILE: /components/layout/wallet-widget.vue - FIXED FOR SSR HYDRATION -->
<!-- ============================================================================
     WALLET WIDGET - FIXED: All user wallet data wrapped in ClientOnly
     ✅ FIXED: Wallet balance wrapped
     ✅ FIXED: Transaction data wrapped
     ============================================================================ -->

<template>
  <!-- ✅ FIXED: Wrap entire widget in ClientOnly -->
  <ClientOnly>
    <div class="wallet-widget">
      <!-- Wallet Toggle Button -->
      <button 
        @click="showWallet = !showWallet" 
        class="wallet-toggle"
        :class="{ active: showWallet }"
      >
        <Icon name="wallet" size="20" />
        <span class="wallet-balance">${{ formatNumber(totalBalance) }}</span>
        <div v-if="pendingTransactions > 0" class="pending-indicator">
          {{ pendingTransactions }}
        </div>
        <div v-if="hasNotifications" class="notification-dot"></div>
      </button>

      <!-- Wallet Dropdown -->
      <div v-if="showWallet" class="wallet-dropdown">
        <div class="wallet-header">
          <h3>My Wallet</h3>
          <div class="wallet-actions">
            <button @click="refreshBalances" class="refresh-btn" :disabled="refreshing">
              <Icon :name="refreshing ? 'loader' : 'refresh-cw'" size="16" />
            </button>
            <button @click="goToWallet" class="expand-btn">
              <Icon name="external-link" size="16" />
            </button>
          </div>
        </div>

        <!-- Balance Summary -->
        <div class="balance-summary">
          <div class="balance-item">
            <span class="balance-label">Available</span>
            <span class="balance-value">${{ formatNumber(availableBalance) }}</span>
          </div>
          <div class="balance-item">
            <span class="balance-label">Pending</span>
            <span class="balance-value pending">${{ formatNumber(pendingBalance) }}</span>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="quick-actions">
          <button @click="showDepositModal = true" class="action-btn deposit">
            <Icon name="plus-circle" size="16" />
            <span>Deposit</span>
          </button>
          <button @click="showWithdrawModal = true" class="action-btn withdraw">
            <Icon name="minus-circle" size="16" />
            <span>Withdraw</span>
          </button>
          <button @click="showTransferModal = true" class="action-btn transfer">
            <Icon name="arrow-right-circle" size="16" />
            <span>Transfer</span>
          </button>
        </div>

        <!-- Recent Transactions -->
        <div class="recent-transactions">
          <div class="transactions-header">
            <h4>Recent Transactions</h4>
            <button @click="goToWallet" class="view-all-btn">View All</button>
          </div>
          <div v-if="recentTransactions.length > 0" class="transactions-list">
            <div 
              v-for="tx in recentTransactions" 
              :key="tx.id" 
              class="transaction-item"
            >
              <div class="tx-icon" :class="tx.type">
                <Icon :name="getTransactionIcon(tx.type)" size="14" />
              </div>
              <div class="tx-details">
                <p class="tx-description">{{ tx.description }}</p>
                <p class="tx-date">{{ formatDate(tx.date) }}</p>
              </div>
              <div class="tx-amount" :class="tx.type">
                {{ tx.type === 'income' ? '+' : '-' }}${{ tx.amount.toFixed(2) }}
              </div>
            </div>
          </div>
          <div v-else class="empty-transactions">
            <Icon name="inbox" size="24" />
            <p>No recent transactions</p>
          </div>
        </div>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// State
const showWallet = ref(false)
const refreshing = ref(false)
const showDepositModal = ref(false)
const showWithdrawModal = ref(false)
const showTransferModal = ref(false)

// Wallet Data
const totalBalance = ref(1.50)
const availableBalance = ref(1100.50)
const pendingBalance = ref(150.00)
const pendingTransactions = ref(2)
const hasNotifications = ref(true)

// Recent Transactions
const recentTransactions = ref([
  { id: 1, type: 'income', description: 'Payment received', amount: 100, date: new Date() },
  { id: 2, type: 'expense', description: 'Purchase', amount: 50, date: new Date(Date.now() - 86400000) },
  { id: 3, type: 'income', description: 'Refund', amount: 25, date: new Date(Date.now() - 172800000) }
])

// Methods
const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toFixed(2)
}

const formatDate = (date) => {
  const now = new Date()
  const diff = now - date
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString()
}

const getTransactionIcon = (type) => {
  return type === 'income' ? 'arrow-down-left' : 'arrow-up-right'
}

const refreshBalances = async () => {
  refreshing.value = true
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000))
  refreshing.value = false
}

const goToWallet = () => {
  router.push('/wallet')
  showWallet.value = false
}
</script>

<style scoped>
.wallet-widget {
  position: relative;
}

.wallet-toggle {
  display: flex;
  align-items: center;
  gap: .5rem;
  padding: 0.5rem 1rem;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 8px;
  color: #b82f6;
  cursor: pointer;
  transition: alls;
  position: relative;
}

.wallet-toggle:hover {
  background: rgba(59, 130, 246, 0.2);
  border-color: #3b82f6;
}

.wallet-toggle.active {
  background: #3b82f6;
  color: white;
}

.wallet-balance {
  font-weight: 600;
  font-size: 0.875rem;
}

.pending-indicator {
  position: absolute;
  top: -px;
  right: -8px;
  background: #ef4444;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: bold;
}

.notification-dot {
  position: absolute;
  top: -px;
  right: -4px;
  width: 8px;
  height: 8px;
  background: #10b981;
  border-radius: 50%;
  border: 2px solid white;
}

.wallet-dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  width: 350px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  overflow: hidden;
}

.wallet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.wallet-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
}

.wallet-actions {
  display: flex;
  gap: 0.5rem;
}

.refresh-btn,
.expand-btn {
  padding: 0.5rem;
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  border-radius: 6px;
  transition: all s;
}

.refresh-btn:hover,
.expand-btn:hover {
  background: #f3f4f6;
  color: #111827;
}

.balance-summary {
  padding: 1rem;
  background: #f9fafb;
}

.balance-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.balance-item:last-child {
  margin-bottom: 0;
}

.balance-label {
  font-size: 0.875rem;
  color: #6b7280;
}

.balance-value {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
}

.balance-value.pending {
  color: #f59e0b;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.75rem;
  background: none;
  border: 1px solid #e5e7eb;
  border-radius:px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 0.75rem;
  color: #6b7280;
}

.action-btn:hover {
  border-color: #3b82f6;
  color: #3b82f6;
  background: rgba(59, 130, 246, 0.05);
}

.recent-transactions {
  padding: 1rem;
}

.transactions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.transactions-header h4 {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
}

.view-all-btn {
  background: none;
  border: none;
  color: #3b82f6;
  font-size: 0.75rem;
  cursor: pointer;
  font-weight: 500;
}

.transactions-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.transaction-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  border-radius: 6px;
  transition: background 0.3s;
}

.transaction-item:hover {
  background: #f9fafb;
}

.tx-icon {
  width:px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.tx-icon.income {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.tx-icon.expense {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.tx-details {
  flex: 1;
}

.tx-description {
  font-size: 0.875rem;
  font-weight: 500;
  color: #111827;
  margin: 0 0 0.125rem 0;
}

.tx-date {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0;
}

.tx-amount {
  font-size: 0.875rem;
  font-weight: 600;
}

.tx-amount.income {
  color: #10b981;
}

.tx-amount.expense {
  color: #ef4444;
}

.empty-transactions {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem rem;
  color: #9ca3af;
}

.empty-transactions p {
  margin-top: 0.5rem;
  font-size: 0.875rem;
}
</style>
