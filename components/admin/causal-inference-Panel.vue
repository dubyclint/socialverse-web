<template>
  <div class="causal-inference-panel">
    <div class="panel-header">
      <h2>Causal Inference & Incrementality Testing</h2>
      <button @click="createNewExperiment" class="btn-primary">
        Create New Experiment
      </button>
    </div>

    <!-- Configuration Section -->
    <div class="config-section">
      <h3>Global Configuration</h3>
      <div class="config-grid">
        <div class="config-item">
          <label>Ghost Ad Rate</label>
          <input 
            type="number" 
            min="0.01" 
            max="0.2" 
            step="0.01"
            v-model.number="localConfig.ghostRate"
            @change="updateConfig"
          >
          <small>{{ (localConfig.ghostRate * 100).toFixed(1) }}% of impressions</small>
        </div>

        <div class="config-item">
          <label>Min Experiment Size</label>
          <input 
            type="number" 
            min="100" 
            max="10000" 
            step="100"
            v-model.number="localConfig.minExperimentSize"
            @change="updateConfig"
          >
          <small>Minimum users required per experiment</small>
        </div>

        <div class="config-item">
          <label>Confidence Level</label>
          <select v-model.number="localConfig.confidenceLevel" @change="updateConfig">
            <option value="0.90">90%</option>
            <option value="0.95">95%</option>
            <option value="0.99">99%</option>
          </select>
        </div>

        <div class="config-item">
          <label>Min Detectable Effect</label>
          <input 
            type="number" 
            min="0.01" 
            max="0.5" 
            step="0.01"
            v-model.number="localConfig.minDetectableEffect"
            @change="updateConfig"
          >
          <small>{{ (localConfig.minDetectableEffect * 100).toFixed(1) }}% lift</small>
        </div>
      </div>
    </div>

    <!-- Active Experiments -->
    <div class="experiments-section">
      <h3>Active Experiments</h3>
      <div v-if="activeExperiments.length === 0" class="empty-state">
        No active experiments. Create one to get started.
      </div>
      <div v-else class="experiments-grid">
        <div v-for="experiment in activeExperiments" :key="experiment.id" class="experiment-card">
          <div class="experiment-header">
            <h4>{{ experiment.campaignName || `Campaign ${experiment.campaignId}` }}</h4>
            <span class="experiment-status active">Active</span>
          </div>

          <div class="experiment-metrics">
            <div class="metric-row">
              <span>Progress:</span>
              <span>{{ experiment.currentUsers.toLocaleString() }} / {{ experiment.targetUsers.toLocaleString() }} users</span>
            </div>
            <div class="metric-row">
              <span>Duration:</span>
              <span>{{ experiment.daysElapsed }} / {{ experiment.duration }} days</span>
            </div>
          </div>

          <div class="experiment-results">
            <div class="result-metric">
              <span class="metric-label">Incrementality:</span>
              <span class="metric-value" :class="getIncrementalityClass(experiment.results.incrementality)">
                {{ (experiment.results.incrementality * 100).toFixed(1) }}%
              </span>
            </div>
            <div class="result-metric">
              <span class="metric-label">Revenue Lift:</span>
              <span class="metric-value" :class="getRevenueClass(experiment.results.revenueIncrementality)">
                ${{ experiment.results.revenueIncrementality.toFixed(2) }} RPM
              </span>
            </div>
          </div>

          <div class="experiment-actions">
            <button @click="viewExperimentDetails(experiment)" class="btn-secondary">
              View Details
            </button>
            <button @click="stopExperiment(experiment.id)" class="btn-danger">
              Stop Experiment
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Completed Experiments -->
    <div class="completed-section">
      <h3>Recent Completed Experiments</h3>
      <div class="completed-table">
        <table>
          <thead>
            <tr>
              <th>Campaign</th>
              <th>Duration</th>
              <th>Sample Size</th>
              <th>Incrementality</th>
              <th>Revenue Impact</th>
              <th>Significance</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="experiment in completedExperiments" :key="experiment.id">
              <td>{{ experiment.campaignName || `Campaign ${experiment.campaignId}` }}</td>
              <td>{{ experiment.duration }} days</td>
              <td>{{ (experiment.totalUsers || 0).toLocaleString() }}</td>
              <td>
                <span :class="getIncrementalityClass(experiment.incrementality)">
                  {{ (experiment.incrementality * 100).toFixed(1) }}%
                </span>
              </td>
              <td>
                <span :class="getRevenueClass(experiment.revenueImpact)">
                  ${{ experiment.revenueImpact.toFixed(2) }}
                </span>
              </td>
              <td>
                <span :class="experiment.isSignificant ? 'significant' : 'not-significant'">
                  {{ experiment.isSignificant ? '✓' : '✗' }}
                </span>
              </td>
              <td>
                <button @click="viewExperimentDetails(experiment)" class="btn-link">
                  View Report
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create Experiment Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click="closeCreateModal">
      <div class="modal-content" @click.stop>
        <h3>Create New Incrementality Experiment</h3>
        
        <form @submit.prevent="submitNewExperiment">
          <div class="form-group">
            <label>Campaign</label>
            <select v-model="newExperiment.campaignId" required>
              <option value="">Select Campaign</option>
              <option v-for="campaign in availableCampaigns" :key="campaign.id" :value="campaign.id">
                {{ campaign.name }} (Budget: ${{ campaign.dailyBudget }})
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>Control Group Size</label>
            <input 
              type="number" 
              min="0.01" 
              max="0.2" 
              step="0.01"
              v-model.number="newExperiment.controlRate"
              required
            >
            <small>{{ (newExperiment.controlRate * 100).toFixed(1) }}% of eligible users</small>
          </div>

          <div class="form-group">
            <label>Experiment Duration (days)</label>
            <input 
              type="number" 
              min="7" 
              max="60"
              v-model.number="newExperiment.duration"
              required
            >
          </div>

          <div class="form-group">
            <label>Minimum Sample Size</label>
            <input 
              type="number" 
              min="100" 
              max="10000"
              v-model.number="newExperiment.minSampleSize"
              required
            >
          </div>

          <div class="form-actions">
            <button type="button" @click="closeCreateModal" class="btn-secondary">
              Cancel
            </button>
            <button type="submit" class="btn-primary">
              Create Experiment
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'

const props = defineProps({
  experiments: Array,
  config: Object
})

const emit = defineEmits(['update-config', 'create-experiment', 'stop-experiment'])

const localConfig = reactive({ ...props.config })
const showCreateModal = ref(false)
const availableCampaigns = ref([])

const newExperiment = reactive({
  campaignId: '',
  controlRate: 0.05,
  duration: 14,
  minSampleSize: 1000
})

const activeExperiments = computed(() => {
  return props.experiments?.filter(exp => exp.status === 'active') || []
})

const completedExperiments = computed(() => {
  return props.experiments?.filter(exp => exp.status === 'completed') || []
})

onMounted(async () => {
  await loadAvailableCampaigns()
})

async function loadAvailableCampaigns() {
  try {
    const { data } = await $fetch('/api/admin/ml/available-campaigns')
    availableCampaigns.value = data
  } catch (error) {
    console.error('Failed to load campaigns:', error)
  }
}

function updateConfig() {
  emit('update-config', { ...localConfig })
}

function createNewExperiment() {
  showCreateModal.value = true
}

function closeCreateModal() {
  showCreateModal.value = false
  Object.assign(newExperiment, {
    campaignId: '',
    controlRate: 0.05,
    duration: 14,
    minSampleSize: 1000
  })
}

async function submitNewExperiment() {
  try {
    await emit('create-experiment', { ...newExperiment })
    closeCreateModal()
  } catch (error) {
    console.error('Failed to create experiment:', error)
  }
}

function stopExperiment(experimentId) {
  if (confirm('Are you sure you want to stop this experiment? This action cannot be undone.')) {
    emit('stop-experiment', experimentId)
  }
}

function viewExperimentDetails(experiment) {
  navigateTo(`/admin/experiments/${experiment.id}`)
}

function getIncrementalityClass(incrementality) {
  if (incrementality > 0.1) return 'high-positive'
  if (incrementality > 0) return 'positive'
  if (incrementality < -0.1) return 'high-negative'
  return 'negative'
}

function getRevenueClass(revenue) {
  if (revenue > 1) return 'high-positive'
  if (revenue > 0) return 'positive'
  if (revenue < -1) return 'high-negative'
  return 'negative'
}
</script>

<style scoped>
.causal-inference-panel {
  max-width: 1200px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.config-section, .experiments-section, .completed-section {
  margin-bottom: 32px;
  padding: 24px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.config-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.experiments-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
}

.experiment-card {
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 20px;
  background: white;
}

.experiment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.experiment-status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.experiment-status.active {
  background-color: #dbeafe;
  color: #1e40af;
}

.experiment-metrics {
  margin-bottom: 16px;
}

.metric-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.experiment-results {
  margin-bottom: 16px;
  padding: 12px;
  background-color: #f9fafb;
  border-radius: 6px;
}

.result-metric {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.metric-value.high-positive {
  color: #059669;
  font-weight: 600;
}

.metric-value.positive {
  color: #10b981;
}

.metric-value.negative {
  color: #ef4444;
}

.metric-value.high-negative {
  color: #dc2626;
  font-weight: 600;
}

.metric-value.significant {
  color: #059669;
  font-weight: 600;
}

.metric-value.not-significant {
  color: #6b7280;
}

.experiment-actions {
  display: flex;
  gap: 8px;
}

.completed-table {
  overflow-x: auto;
}

.completed-table table {
  width: 100%;
  border-collapse: collapse;
}

.completed-table th,
.completed-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.completed-table th {
  font-weight: 600;
  background-color: #f9fafb;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  padding: 24px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

.btn-primary, .btn-secondary, .btn-danger, .btn-link {
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
}

.btn-secondary {
  background-color: white;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-danger {
  background-color: #ef4444;
  color: white;
}

.btn-link {
  background: none;
  color: #3b82f6;
  text-decoration: underline;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #6b7280;
}
</style>
