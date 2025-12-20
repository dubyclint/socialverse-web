<!-- FILE: /pages/wallet.vue - WALLET MANAGEMENT PAGE -->
<!-- Protected route - requires authentication -->

<template>
  <div class="wallet-container">
    <!-- Page Header -->
    <div class="page-header">
      <h1>💰 My Wallet</h1>
      <p class="subtitle">Manage your balance and transactions</p>
    </div>

    <!-- ✅ WRAPPED WITH ClientOnly TO PREVENT HYDRATION MISMATCH -->
    <ClientOnly>
      <!-- Wallet Summary Cards -->
      <div class="wallet-summary">
        <div class="summary-card balance-card">
          <div class="card-icon">💵</div>
          <div class="card-content">
            <p class="card-label">Total Balance</p>
            <h class="card-value">${{ totalBalance.toFixed(2) }}</h2>
          </div>
        </div>

        <div class="summary-card income-card">
          <div class="card-icon">📈</div>
          <div class="card-content">
            <p class="card-label">Total Income</p>
            <h2 class="card-value">${{ totalIncome.toFixed(2) }}</h2>
          </div>
        </div>

        <div class="summary-card spent-card">
          <div class="card-icon">📉</div>
          <div class="card-content">
            <p class="card-label">Total Spent</p>
            <h2 class="card-value">${{ totalSpent.toFixed(2) }}</h2>
          </div>
        </div>

        <div class="summary-card pending-card">
          <div class="card-icon">⏳</div>
          <div class="card-content">
            <p class="card-label">Pending</p>
            <h2 class="card-value">${{ pendingAmount.toFixed(2) }}</h2>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="wallet-actions">
        <button class="btn btn-primary" @click="showDepositModal = true">
          <span>➕</span> Add Funds
        </button>
        <button class="btn btn-secondary" @click="showWithdrawModal = true">
          <span>➖</span> Withdraw
        </button>
        <button class="btn btn-tertiary" @click="showTransferModal = true">
          <span>🔄</span> Transfer
        </button>
      </div>

      <!-- Tabs -->
      <div class="wallet-tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab"
          :class="['tab-button', { active: activeTab === tab }]"
          @click="activeTab = tab"
        >
          {{ tab }}
        </button>
      </div>

      <!-- Transaction History -->
      <div v-if="activeTab === 'Transactions'" class="transactions-section">
        <h3>📋 Transaction History</h3>
        <div v-if="transactions.length > 0" class="transactions-list">
          <div v-for="tx in transactions" :key="tx.id" class="transaction-item">
            <div class="tx-icon" :class="tx.type">
              {{ tx.icon }}
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
        <div v-else class="empty-state">
          <p>No transactions yet</p>
        </div>
      </div>

      <!-- Payment Methods -->
      <div v-if="activeTab === 'Payment Methods'" class="payment-methods-section">
        <h3>💳 Payment Methods</h3>
        <div class="payment-methods-list">
          <div v-for="method in paymentMethods" :key="method.id" class="payment-method-item">
            <div class="method-icon">{{ method.icon }}</div>
            <div class="method-details">
              <p class="method-name">{{ method.name }}</p>
              <p class="method-info">{{ method.info }}</p>
            </div>
            <button class="btn-small btn-remove" @click="removePaymentMethod(method.id)">
              Remove
            </button>
          </div>
        </div>
        <button class="btn btn-primary" @click="showAddPaymentModal = true">
          <span>➕</span> Add Payment Method
        </button>
      </div>

      <!-- Withdrawal History -->
      <div v-if="activeTab === 'Withdrawals'" class="withdrawals-section">
        <h3>🏦 Withdrawal History</h3>
        <div v-if="withdrawals.length > 0" class="withdrawals-list">
          <div v-for="withdrawal in withdrawals" :key="withdrawal.id" class="withdrawal-item">
            <div class="withdrawal-status" :class="withdrawal.status">
              {{ withdrawal.status }}
            </div>
            <div class="withdrawal-details">
              <p class="withdrawal-amount">${{ withdrawal.amount.toFixed(2) }}</p>
              <p class="withdrawal-date">{{ formatDate(withdrawal.date) }}</p>
            </div>
            <p class="withdrawal-method">{{ withdrawal.method }}</p>
          </div>
        </div>
        <div v-else class="empty-state">
          <p>No withdrawals yet</p>
        </div>
      </div>

      <!-- Referral Earnings -->
      <div v-if="activeTab === 'Referrals'" class="referrals-section">
        <h3>🎁 Referral Earnings</h3>
        <div class="referral-stats">
          <div class="stat-card">
            <p class="stat-label">Total Referrals</p>
            <p class="stat-value">{{ totalReferrals }}</p>
          </div>
          <div class="stat-card">
            <p class="stat-label">Referral Earnings</p>
            <p class="stat-value">${{ referralEarnings.toFixed(2) }}</p>
          </div>
        </div>
        <div class="referral-code">
          <p class="referral-label">Your Referral Code:</p>
          <div class="code-display">
            <input type="text" :value="referralCode" readonly class="code-input" />
            <button class="btn-copy" @click="copyReferralCode">📋 Copy</button>
          </div>
        </div>
      </div>
    </ClientOnly>
    <!-- ✅ END OF ClientOnly WRAPPER -->
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

definePageMeta({
  middleware: ['auth', 'language-check'],
  layout: 'default'
})

// State
const activeTab = ref('Transactions')
const showDepositModal = ref(false)
const showWithdrawModal = ref(false)
const showTransferModal = ref(false)
const showAddPaymentModal = ref(false)

// Wallet Data
const totalBalance = ref(.50)
const totalIncome = ref(5000.00)
const totalSpent = ref(3749.50)
const pendingAmount = ref(150.00)

// Tabs
const tabs = ['Transactions', 'Payment Methods', 'Withdrawals', 'Referrals']

// Sample Transactions
const transactions = ref([
  { id: 1, type: 'income', description: 'Stream Earnings', amount: 250, date: new Date(), icon: '📺' },
  { id: 2, type: 'expense', description: 'Purchase Gift', amount: 50, date: new Date(Date.now() - 86400000), icon: '🎁' },
  { id: 3, type: 'income', description: 'Referral Bonus', amount: 100, date: new Date(Date.now() - 172800000), icon: '🎯' },
  { id: 4, type: 'expense', description: 'Subscription', amount: 9.99, date: new Date(Date.now() - 259200000), icon: '📦' },
])

// Payment Methods
const paymentMethods = ref([
  { id: 1, name: 'Visa Card', info: '**** **** **** 4242', icon: '💳' },
  { id: 2, name: 'PayPal', info: 'user@example.com', icon: '🅿️' },
])

// Withdrawals
const withdrawals = ref([
  { id: 1, amount: 500, date: new Date(Date.now() - 604800000), method: 'Bank Transfer', status: 'completed' },
  { id: 2, amount: 200, date: new Date(Date.now() - 432000000), method: 'PayPal', status: 'completed' },
  { id: 3, amount:, date: new Date(Date.now() - 86400000), method: 'Bank Transfer', status: 'pending' },
])

// Referral Data
const totalReferrals = ref(12)
const referralEarnings = ref(450.00)
const referralCode = ref('SOCIALVERSE024')

// Methods
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const removePaymentMethod = (id) => {
  paymentMethods.value = paymentMethods.value.filter(m => m.id !== id)
}

const copyReferralCode = () => {
  navigator.clipboard.writeText(referralCode.value)
  alert('Referral code copied!')
}
</script>

<style scoped>
.wallet-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 2.5rem;
  margin:0 0.5rem 0;
  color: #333;
}

.subtitle {
  color: #666;
  font-size: 1.1rem;
  margin: 0;
}

.wallet-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.summary-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.card-icon {
  font-size: 2.5rem;
}

.card-content {
  flex: 1;
}

.card-label {
  color: #666;
  font-size: 0.9rem;
  margin: 0;
}

.card-value {
  font-size: 1.8rem;
  margin: 0.5rem 0 0 0;
  color: #333;
}

.balance-card {
  border-left: 4px solid #3b82f6;
}

.income-card {
  border-left: 4px solid #10b981;
}

.spent-card {
  border-left: 4px solid #ef4444;
}

.pending-card {
  border-left: 4px solid #f59e0b;
}

.wallet-actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
  transform: translateY(-2px);
}

.btn-secondary {
  background: #10b981;
  color: white;
}

.btn-secondary:hover {
  background: #059669;
  transform: translateY(-2px);
}

.btn-tertiary {
  background: #8b5cf6;
  color: white;
}

.btn-tertiary:hover {
  background: #7c3aed;
  transform: translateY(-2px);
}

.wallet-tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 2px solid #e5e7eb;
}

.tab-button {
  background: none;
  border: none;
  padding: 1rem;
  cursor: pointer;
  font-weight: 600;
  color: #666;
  border-bottom: 3px solid transparent;
  transition: all 0.3s ease;
}

.tab-button.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
}

.tab-button:hover {
  color: #333;
}

.transactions-section,
.payment-methods-section,
.withdrawals-section,
.referrals-section {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.transactions-section h3,
.payment-methods-section h3,
.withdrawals-section h3,
.referrals-section h3 {
  margin-top: 0;
  color: #333;
}

.transactions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.transaction-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.transaction-item:hover {
  background: #f3f4f6;
}

.tx-icon {
  font-size: 1.5rem;
}

.tx-details {
  flex: 1;
}

.tx-description {
  margin: 0;
  font-weight: 600;
  color: #333;
}

.tx-date {
  margin: 0.rem 0 0 0;
  color: #999;
  font-size: 0.9rem;
}

.tx-amount {
  font-weight: 600;
  font-size: 1.1rem;
}

.tx-amount.income {
  color: #10b981;
}

.tx-amount.expense {
  color: #ef4444;
}

.empty-state {
  text-align: center;
  padding: rem;
  color: #999;
}

.payment-methods-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.payment-method-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
}

.method-icon {
  font-size: 1.5rem;
}

.method-details {
  flex: 1;
}

.method-name {
  margin: 0;
  font-weight: 600;
  color: #333;
}

.method-info {
  margin: 0.25rem 0 0 0;
  color: #999;
  font-size: 0.9rem;
}

.btn-small {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
}

.btn-remove {
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-remove:hover {
  background: #dc2626;
}

.withdrawals-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.withdrawal-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
}

.withdrawal-status {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.85rem;
  text-transform: uppercase;
}

.withdrawal-status.completed {
  background: #d1fae5;
  color: #065f46;
}

.withdrawal-status.pending {
  background: #fef3c7;
  color: #92400e;
}

.withdrawal-details {
  flex: 1;
}

.withdrawal-amount {
  margin: 0;
  font-weight: 600;
  color: #333;
  font-size: 1.1rem;
}

.withdrawal-date {
  margin: 0.25rem 0 0 0;
  color: #999;
  font-size: 0.9rem;
}

.withdrawal-method {
  margin: 0;
  color: #666;
}

.referral-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: #f9fafb;
  padding: 1.5rem;
  border-radius: 8px;
  text-align: center;
}

.stat-label {
  color: #666;
  margin: 0;
  font-size: 0.9rem;
}

.stat-value {
  margin: 0.5rem 0 0 0;
  font-size: 1.8rem;
  font-weight: 600;
  color: #333;
}

.referral-code {
  background: #f9fafb;
  padding: 1.5rem;
  border-radius: 8px;
}

.referral-label {
  margin: 0 0 1rem 0;
  color: #666;
  font-weight: 600;
}

.code-display {
  display: flex;
  gap: 0.5rem;
}

.code-input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-family: monospace;
  font-weight: 600;
}

.btn-copy {
  padding: 0.75rem 1.5rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-copy:hover {
  background: #2563eb;
}

@media (max-width: 768px) {
  .wallet-container {
    padding: 1rem;
  }

  .page-header h1 {
    font-size: 1.8rem;
  }

  .wallet-summary {
    grid-template-columns: 1fr;
  }

  .wallet-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }

  .wallet-tabs {
    flex-wrap: wrap;
  }

  .code-display {
    flex-direction: column;
  }
}
</style>
