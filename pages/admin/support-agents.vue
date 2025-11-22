<template>
  <div>
    <h2>Support Agent Assignment</h2>
    <form @submit.prevent="saveAgent">
      <input v-model="agent.agentId" placeholder="Agent ID" />
      <input v-model="agent.name" placeholder="Name" />
      <input v-model="agent.contact" placeholder="Contact Info" />
      <select v-model="agent.method">
        <option value="native">Native Chat</option>
        <option value="widget">Widget</option>
        <option value="redirect">Redirect</option>
      </select>
      <input v-model="agent.region" placeholder="Region (optional)" />
      <label>Assigned Features</label>
      <input v-model="agent.assignedFeatures" placeholder="Comma-separated features" />
      <label><input type="checkbox" v-model="agent.active" /> Active</label>
      <button type="submit">Save Agent</button>
    </form>

    <h3>Active Agents</h3>
    <ul>
      <li v-for="a in agents" :key="a.agentId">
        {{ a.name }} → {{ a.method }} ({{ a.region || 'Global' }}) [{{ a.assignedFeatures.join(', ') }}]
        <button @click="removeAgent(a.agentId)">Remove</button>
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

const agent = ref({
  agentId: '',
  name: '',
  contact: '',
  method: 'native',
  region: '',
  assignedFeatures: [],
  active: true
})

const agents = ref([])

async function fetchAgents() {
  const res = await fetch('/api/admin/supportAgents')
  agents.value = await res.json()
}

async function saveAgent() {
  agent.value.assignedFeatures = agent.value.assignedFeatures.split(',').map(f => f.trim())
  await fetch('/api/admin/supportAgents', {
    method: 'POST',
    body: JSON.stringify(agent.value),
    headers: { 'Content-Type': 'application/json' }
  })
  fetchAgents()
}

async function removeAgent(agentId) {
  await fetch('/api/admin/supportAgents', {
    method: 'DELETE',
    body: JSON.stringify({ agentId }),
    headers: { 'Content-Type': 'application/json' }
  })
  fetchAgents()
}

onMounted(fetchAgents)
</script>
