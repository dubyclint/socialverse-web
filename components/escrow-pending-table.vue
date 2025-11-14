<template>
  <div class="escrow-table">
    <h3>📋 Pending Escrow Deals</h3>

    <button @click="exportCSV" v-if="user.role === 'admin'">📤 Export to CSV</button>

    <table>
      <thead>
        <tr>
          <th @click="sortBy('tradeId')">Deal ID</th>
          <th @click="sortBy('buyerId')">Buyer</th>
          <th @click="sortBy('sellerId')">Seller</th>
          <th @click="sortBy('amount')">Amount</th>
          <th @click="sortBy('timestamp')">Created</th>
          <th>Alert</th>
          <th v-if="user.role === 'admin'">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="deal in sortedFilteredDeals"
          :key="deal._id"
          :class="{ alert: isStale(deal) || isLarge(deal) }"
        >
          <td>{{ deal.tradeId }}</td>
          <td>{{ deal.buyerId }}</td>
          <td>{{ deal.sellerId }}</td>
          <td>{{ deal.amount }}</td>
          <td>{{ formatDate(deal.timestamp) }}</td>
          <td>
            <span v-if="isStale(deal)" class="tooltip">
              ⚠️
              <span class="tooltiptext">Stale: Over 72 hours old</span>
            </span>
            <span v-if="isLarge(deal)" class="tooltip">
              💰
              <span class="tooltiptext">Large: Over 10,000 USDC</span>
            </span>
          </td>
          <td v-if="user.role === 'admin'">
            <button @click="confirmAction('release', deal.tradeId)">Release</button>
            <button @click="confirmAction('refund', deal.tradeId)">Refund</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="showModal" class="modal-overlay">
      <div class="modal">
        <h4>Confirm {{ actionType }} Deal</h4>
        <p>Are you sure you want to {{ actionType }} deal #{{ selectedDealId }}?</p>
        <button @click="executeAction">Yes, Confirm</button>
        <button @click="cancelAction">Cancel</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { useEscrowContract } from '@/composables/use-escrow-contract'
import { useToast } from '@/composables/use-toast'

const props = defineProps({
  search: String,
  status: String,
  minAmount: Number,
  maxAmount: Number,
  startDate: String,
  endDate: String
})

const user = useUserStore()
const deals = ref([])
const sortKey = ref('timestamp')
const sortAsc = ref(false)
const showModal = ref(false)
const selectedDealId = ref(null)
const actionType = ref('')

const { releaseDeal, refundDeal } = useEscrowContract()
const toast = useToast()

onMounted(async () => {
  try {
    const res = await fetch('http://localhost:3000/api/escrow/history?status=pending')
    const allDeals = await res.json()
    deals.value = allDeals
  } catch (err) {
    console.error(`Failed to load deals: ${err.message}`)
    toast.error(`Failed to load deals: ${err.message}`)
  }
})

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString()
}

function sortBy(key) {
  if (sortKey.value === key) {
    sortAsc.value = !sortAsc.value
  } else {
    sortKey.value = key
    sortAsc.value = true
  }
}

function isStale(deal) {
  const ageHours = (Date.now() - new Date(deal.timestamp)) / 36e5
  return ageHours > 72
}

function isLarge(deal) {
  return deal.amount > 10000
}

const sortedFilteredDeals = computed(() => {
  return deals.value
    .filter(d => {
      const matchesSearch =
        !props.search ||
        d.buyerId.includes(props.search) ||
        d.sellerId.includes(props.search)

      const matchesStatus =
        !props.status ||
        (props.status === 'pending' && !d.isReleased && !d.isRefunded) ||
        (props.status === 'released' && d.isReleased) ||
        (props.status === 'refunded' && d.isRefunded)

      const matchesAmount =
        (!props.minAmount || d.amount >= props.minAmount) &&
        (!props.maxAmount || d.amount <= props.maxAmount)

      const created = new Date(d.timestamp)
      const matchesDate =
        (!props.startDate || created >= new Date(props.startDate)) &&
        (!props.endDate || created <= new Date(props.endDate))

      return matchesSearch && matchesStatus && matchesAmount && matchesDate
    })
    .sort((a, b) => {
      const valA = a[sortKey.value]
      const valB = b[sortKey.value]
      return sortAsc.value
        ? valA > valB ? 1 : -1
        : valA < valB ? 1 : -1
    })
})

function confirmAction(type, id) {
  actionType.value = type
  selectedDealId.value = id
  showModal.value = true
}

function cancelAction() {
  showModal.value = false
  selectedDealId.value = null
  actionType.value = ''
}

async function executeAction() {
  try {
    if (actionType.value === 'release') {
      await releaseDeal(selectedDealId.value)
      toast.success(`✅ Deal #${selectedDealId.value} released`)
    } else if (actionType.value === 'refund') {
      await refundDeal(selectedDealId.value)
      toast.success(`✅ Deal #${selectedDealId.value} refunded`)
    }
  } catch (err) {
    console.error(`Failed to execute action: ${err.message}`)
    toast.error(`Failed to execute action: ${err.message}`)
  }
  cancelAction()
}

function exportCSV() {
  const rows = sortedFilteredDeals.value.map(d => ({
    tradeId: d.tradeId,
    buyerId: d.buyerId,
    sellerId: d.sellerId,
    amount: d.amount,
    timestamp: formatDate(d.timestamp),
    status: d.isReleased ? 'Released' : d.isRefunded ? 'Refunded' : 'Pending'
  }))

  const header = Object.keys(rows[0]).join(',')
  const body = rows.map(r => Object.values(r).join(',')).join('\n')
  const csv = `${header}\n${body}`

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.setAttribute('download', 'escrow_audit_log.csv')
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>

<style scoped>
.escrow-table {
  margin-top: 2rem;
  border: 1px solid #ccc;
  padding: 1rem;
}
table {
  width: 100%;
  border-collapse: collapse;
}
th {
  cursor: pointer;
  background-color: #f5f5f5;
}
th, td {
  padding: 0.5rem;
  border-bottom: 1px solid #ddd;
}
button {
  margin-right: 0.5rem;
}
.alert {
  background-color: #fff3cd;
}
.tooltip {
  position: relative;
  cursor: help;
  margin-right: 0.5rem;
}
.tooltiptext {
  visibility: hidden;
  width: max-content;
  background-color: #333;
  color: #fff;
  text-align: center;
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  position: absolute;
  z-index: 1;
  bottom: 125%;
  left: 50%;
  transform: translateX(-50%);
  opacity: 0;
  transition: opacity 0.3s;
}
.tooltip:hover .tooltiptext {
  visibility: visible;
  opacity: 1;
}
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}
.modal {
  background: white;
  padding: 2rem;
  border-radius: 8px;
}
</style>
