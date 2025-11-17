<template>
  <div>
    <h2>Fee Settings Dashboard</h2>
    <form @submit.prevent="saveFee">
      <label>Fee Type</label>
      <select v-model="fee.type">
        <option value="p2p">P2P Trading</option>
        <option value="match">Match Engine</option>
        <option value="rankHide">Rank Hide</option>
        <option value="monetization">Monetization Revenue</option>
      </select>

      <div v-if="fee.type === 'p2p'">
        <label>Maker %</label>
        <input type="number" v-model.number="fee.makerPercent" />
        <label>Taker %</label>
        <input type="number" v-model.number="fee.takerPercent" />
      </div>

      <div v-if="fee.type === 'match' || fee.type === 'rankHide'">
        <label>Flat Fee (USDT)</label>
        <input type="number" v-model.number="fee.flatFee" />
      </div>

      <div v-if="fee.type === 'monetization'">
        <label>User Revenue Share %</label>
        <input type="number" v-model.number="fee.userRevenueShare" />
      </div>

      <button type="submit">Save Fee</button>
    </form>

    <h3>Current Fee Settings</h3>
    <ul>
      <li v-for="f in fees" :key="f.type">
        <strong>{{ f.type }}</strong> → 
        <span v-if="f.makerPercent">Maker: {{ f.makerPercent }}%</span>
        <span v-if="f.takerPercent">Taker: {{ f.takerPercent }}%</span>
        <span v-if="f.flatFee">Flat: {{ f.flatFee }} USDT</span>
        <span v-if="f.userRevenueShare">Revenue Share: {{ f.userRevenueShare }}%</span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['route-guard', 'language-check', 'security-middleware'],
  layout: 'default'
})
 
import { ref, onMounted } from 'vue'

const fee = ref({
  type: '',
  makerPercent: null,
  takerPercent: null,
  flatFee: null,
  userRevenueShare: null
})

const fees = ref([])

async function fetchFees() {
  const res = await fetch('/api/admin/fee-settings')
  fees.value = await res.json()
}

async function saveFee() {
  await fetch('/api/admin/feeSettings', {
    method: 'POST',
    body: JSON.stringify(fee.value),
    headers: { 'Content-Type': 'application/json' }
  })
  fetchFees()
}

onMounted(fetchFees)
</script>
