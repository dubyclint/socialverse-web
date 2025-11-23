<template>
  <div class="agents-monitoring">
    <div class="page-header">
      <h2>🤖 Agent Availability & Status</h2>
      <div class="header-stats">
        <div class="stat-box">
          <span class="stat-label">Online Agents</span>
          <span class="stat-value online">{{ onlineCount }}</span>
        </div>
        <div class="stat-box">
          <span class="stat-label">Offline Agents</span>
          <span class="stat-value offline">{{ offlineCount }}</span>
        </div>
        <div class="stat-box">
          <span class="stat-label">Total Sessions</span>
          <span class="stat-value">{{ totalSessions }}</span>
        </div>
      </div>
    </div>

    <div class="agents-container">
      <div v-if="agents.length > 0" class="agents-list">
        <div 
          v-for="agent in agents" 
          :key="agent.agentId" 
          class="agent-card"
          :class="{ 'agent-offline': !agent.online }"
        >
          <div class="agent-header">
            <div class="agent-status">
              <span 
                class="status-indicator" 
                :class="agent.online ? 'online' : 'offline'"
              ></span>
              <span class="agent-id">{{ agent.agentId }}</span>
            </div>
            <span class="status-badge" :class="agent.online ? 'online' : 'offline'">
              {{ agent.online ? '🟢 Online' : '🔴 Offline' }}
            </span>
          </div>

          <div class="agent-details">
            <div class="detail-row">
              <span class="detail-label">Sessions:</span>
              <span class="detail-value">
                {{ agent.currentSessions }}/{{ agent.maxSessions }}
              </span>
              <div class="session-bar">
                <div 
                  class="session-fill" 
                  :style="{ width: (agent.currentSessions / agent.maxSessions * 100) + '%' }"
                ></div>
              </div>
            </div>

            <div v-if="agent.lastActive" class="detail-row">
              <span class="detail-label">Last Active:</span>
              <span class="detail-value">{{ formatTime(agent.lastActive) }}</span>
            </div>

            <div v-if="agent.responseTime" class="detail-row">
              <span class="detail-label">Avg Response Time:</span>
              <span class="detail-value">{{ agent.responseTime }}ms</span>
            </div>
          </div>

          <div class="agent-actions">
            <button 
              @click="viewAgentDetails(agent)" 
              class="btn btn-sm btn-outline"
            >
              View Details
            </button>
            <button 
              v-if="agent.online"
              @click="sendMessage(agent)" 
              class="btn btn-sm btn-primary"
            >
              Send Message
            </button>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <p>No agents found</p>
      </div>
    </div>

    <!-- Agent Details Modal -->
    <div v-if="selectedAgent" class="modal-overlay" @click="selectedAgent = null">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Agent Details: {{ selectedAgent.agentId }}</h3>
          <button @click="selectedAgent = null" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="detail-section">
            <h4>Status Information</h4>
            <p><strong>Status:</strong> {{ selectedAgent.online ? 'Online' : 'Offline' }}</p>
            <p><strong>Current Sessions:</strong> {{ selectedAgent.currentSessions }}/{{ selectedAgent.maxSessions }}</p>
            <p v-if="selectedAgent.lastActive"><strong>Last Active:</strong> {{ formatTime(selectedAgent.lastActive) }}</p>
            <p v-if="selectedAgent.responseTime"><strong>Avg Response Time:</strong> {{ selectedAgent.responseTime }}ms</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['route-guard', 'language-check', 'security-middleware'],
  layout: 'default'
})

import { ref, computed, onMounted, onUnmounted } from 'vue'

const agents = ref([])
const selectedAgent = ref(null)
let refreshInterval = null

const onlineCount = computed(() => 
  agents.value.filter(a => a.online).length
)

const offlineCount = computed(() => 
  agents.value.filter(a => !a.online).length
)

const totalSessions = computed(() => 
  agents.value.reduce((sum, a) => sum + a.currentSessions, 0)
)

async function fetchAgents() {
  try {
    const res = await fetch('/api/support/agent-status')
    agents.value = await res.json()
  } catch (error) {
    console.error('Failed to fetch agents:', error)
  }
}

function formatTime(timestamp) {
  if (!timestamp) return 'N/A'
  const date = new Date(timestamp)
  return date.toLocaleString()
}

function viewAgentDetails(agent) {
  selectedAgent.value = agent
}

async function sendMessage(agent) {
  const message = prompt(`Send message to ${agent.agentId}:`)
  if (message) {
    try {
      await fetch(`/api/support/agent/${agent.agentId}/message`, {
        method: 'POST',
        body: JSON.stringify({ message }),
        headers: { 'Content-Type': 'application/json' }
      })
      alert('Message sent successfully')
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }
}

onMounted(() => {
  fetchAgents()
  // Refresh agent status every 10 seconds
  refreshInterval = setInterval(fetchAgents, 10000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>

<style scoped>
.agents-monitoring {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h2 {
  margin: 0 0 1.5rem 0;
  color: #1f2937;
  font-size: 1.75rem;
}

.header-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.stat-box {
  background: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
}

.stat-value.online {
  color: #10b981;
}

.stat-value.offline {
  color: #ef4444;
}

.agents-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
}

.agents-list {
  display: grid;
  gap: 1rem;
}

.agent-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
  background: #f9fafb;
  transition: all 0.2s;
}

.agent-card:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border-color: #3b82f6;
}

.agent-card.agent-offline {
  opacity: 0.7;
}

.agent-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.agent-status {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
}

.status-indicator.online {
  background: #10b981;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
}

.status-indicator.offline {
  background: #ef4444;
}

.agent-id {
  font-weight: 600;
  color: #1f2937;
  font-size: 1.1rem;
}

.status-badge {
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  font-weight: 500;
  font-size: 0.9rem;
}

.status-badge.online {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.offline {
  background: #fee2e2;
  color: #991b1b;
}

.agent-details {
  margin-bottom: 1rem;
  display: grid;
  gap: 0.75rem;
}

.detail-row {
  display: grid;
  grid-template-columns: 150px 1fr;
  gap: 1rem;
  align-items: center;
}

.detail-label {
  color: #6b7280;
  font-weight: 500;
  font-size: 0.9rem;
}

.detail-value {
  color: #1f2937;
  font-weight: 500;
}

.session-bar {
  grid-column: 2;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.session-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #1d4ed8);
  transition: width 0.3s ease;
}

.agent-actions {
  display: flex;
  gap: 0.75rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.btn-sm {
  padding: 0.4rem 0.8rem;
  font-size: 0.85rem;
}

.btn-outline {
  background: white;
  border: 1px solid #d1d5db;
  color: #374151;
}

.btn-outline:hover {
  background: #f3f4f6;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.empty-state {
  text-align: center;
  padding: 3rem 2rem;
  color: #6b7280;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  color: #1f2937;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
}

.modal-body {
  padding: 1.5rem;
}

.detail-section {
  margin-bottom: 1.5rem;
}

.detail-section h4 {
  margin: 0 0 1rem 0;
  color: #1f2937;
}

.detail-section p {
  margin: 0.5rem 0;
  color: #374151;
}

@media (max-width: 768px) {
  .agents-monitoring {
    padding: 1rem;
  }

  .header-stats {
    grid-template-columns: 1fr;
  }

  .agent-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .detail-row {
    grid-template-columns: 1fr;
  }

  .session-bar {
    grid-column: 1;
  }

  .agent-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
}
</style>
