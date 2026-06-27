<template>
  <div>
    <h3>Manage Ranks</h3>
    <ul>
      <li v-for="r in ranks" :key="r.rank">
        {{ r.rank }} - {{ r.points }} pts
        <button @click="remove(r.rank)">🗑️</button>
        <input type="number" v-model="r.points" @change="update(r.rank, r.points)" />
      </li>
    </ul>
    <input v-model="newRank" placeholder="New Rank" />
    <input v-model.number="newPoints" placeholder="Points" />
    <button @click="add">Add Rank</button>

    <h4>Rank Hide Settings</h4>
    <label>Fee (USDT)</label>
    <input type="number" v-model="fee" @change="updateSetting('hideFee', fee)" />
    <label>Validity (days)</label>
    <input type="number" v-model="duration" @change="updateSetting('hideDuration', duration)" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
const ranks = ref([])
const newRank = ref('')
const newPoints = ref(0)
const fee = ref(10)
const duration = ref(90)

onMounted(async () => {
  const res = await fetch('/api/rank/config')
  ranks.value = await res.json()
  const settings = await fetch('/api/rank/settings').then(r => r.json())
  fee.value = settings.find(s => s.key === 'hideFee')?.value || 10
  duration.value = settings.find(s => s.key === 'hideDuration')?.value || 90
})

async function add() {
  await fetch('/api/rank/config', {
    method: 'POST',
    body: JSON.stringify({ action: 'add', rank: newRank.value, points: newPoints.value }),
    headers: { 'Content-Type': 'application/json' }
  })
  newRank.value = ''
  newPoints.value = 0
  await refresh()
}

async function remove(rank) {
  await fetch('/api/rank/config', {
    method: 'POST',
    body: JSON.stringify({ action: 'remove', rank }),
    headers: { 'Content-Type': 'application/json' }
  })
  await refresh()
}

async function update(rank, points) {
  await fetch('/api/rank/config', {
    method: 'POST',
    body: JSON.stringify({ action: 'update', rank, points }),
    headers: { 'Content-Type': 'application/json' }
  })
}

async function updateSetting(key, value) {
  await fetch('/api/rank/settings', {
    method: 'POST',
    body: JSON.stringify({ key, value }),
    headers: { 'Content-Type': 'application/json' }
  })
}

async function refresh() {
  const res = await fetch('/api/rank/config')
  ranks.value = await res.json()
}
</script>
