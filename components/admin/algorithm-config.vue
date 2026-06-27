<template>
  <div class="algorithm-config">
    <div class="config-header">
      <h2>Algorithm Configuration</h2>
      <div class="config-actions">
        <button @click="resetToDefaults" class="btn-secondary">
          Reset to Defaults
        </button>
        <button @click="saveConfig" class="btn-primary">
          Save Changes
        </button>
      </div>
    </div>

    <div class="config-sections">
      <!-- Core Algorithm Weights -->
      <div class="config-section">
        <h3>Core Algorithm Weights</h3>
        <div class="weight-controls">
          <div class="weight-item">
            <label>Engagement Weight</label>
            <div class="slider-container">
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.05"
                v-model.number="localConfig.engagementWeight"
                @input="updateWeights"
              >
              <span class="weight-value">{{ localConfig.engagementWeight }}</span>
            </div>
          </div>

          <div class="weight-item">
            <label>Revenue Weight</label>
            <div class="slider-container">
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.05"
                v-model.number="localConfig.revenueWeight"
                @input="updateWeights"
              >
              <span class="weight-value">{{ localConfig.revenueWeight }}</span>
            </div>
          </div>

          <div class="weight-item">
            <label>Diversity Weight</label>
            <div class="slider-container">
              <input 
                type="range" 
                min="0" 
                max="0.5" 
                step="0.05"
                v-model.number="localConfig.diversityWeight"
                @input="updateWeights"
              >
              <span class="weight-value">{{ localConfig.diversityWeight }}</span>
            </div>
          </div>

          <div class="weight-total">
            Total Weight: {{ totalWeight.toFixed(2) }}
            <span v-if="totalWeight !== 1.0" class="weight-warning">
              ⚠️ Weights should sum to 1.0
            </span>
          </div>
        </div>
      </div>

      <!-- Exploration Settings -->
      <div class="config-section">
        <h3>Exploration & Testing</h3>
        <div class="form-grid">
          <div class="form-group">
            <label>Exploration Rate</label>
            <input 
              type="number" 
              min="0" 
              max="0.5" 
              step="0.01"
              v-model.number="localConfig.explorationRate"
            >
            <small>Percentage of traffic for exploration (0-50%)</small>
          </div>

          <div class="form-group">
            <label>Ghost Ad Rate</label>
            <input 
              type="number" 
              min="0" 
              max="0.2" 
              step="0.01"
              v-model.number="localConfig.ghostAdRate"
            >
            <small>Percentage of impressions for causal testing</small>
          </div>

          <div class="form-group">
            <label>Quality Threshold</label>
            <input 
              type="number" 
              min="0" 
              max="1" 
              step="0.05"
              v-model.number="localConfig.qualityThreshold"
            >
            <small>Minimum quality score for content/ads</small>
          </div>
        </div>
      </div>

      <!-- Feed Composition -->
      <div class="config-section">
        <h3>Feed Composition</h3>
        <div class="form-grid">
          <div class="form-group">
            <label>Max Ads Per Feed</label>
            <input 
              type="number" 
              min="1" 
              max="10" 
              v-model.number="localConfig.maxAdsPerFeed"
            >
          </div>

          <div class="form-group">
            <label>Max Candidates</label>
            <input 
              type="number" 
              min="100" 
              max="5000" 
              step="100"
              v-model.number="localConfig.maxCandidates"
            >
            <small>Maximum candidates to consider</small>
          </div>

          <div class="form-group">
            <label>Final Feed Size</label>
            <input 
              type="number" 
              min="10" 
              max="200" 
              v-model.number="localConfig.finalFeedSize"
            >
          </div>
        </div>
      </div>

      <!-- Content Scoring -->
      <div class="config-section">
        <h3>Content Scoring Weights</h3>
        <div class="form-grid">
          <div class="form-group">
            <label>Freshness Weight</label>
            <input 
              type="number" 
              min="0" 
              max="1" 
              step="0.05"
              v-model.number="localConfig.freshnessWeight"
            >
          </div>

          <div class="form-group">
            <label>Popularity Weight</label>
            <input 
              type="number" 
              min="0" 
              max="1" 
              step="0.05"
              v-model.number="localConfig.popularityWeight"
            >
          </div>

          <div class="form-group">
            <label>Personalized Weight</label>
            <input 
              type="number" 
              min="0" 
              max="1" 
              step="0.05"
              v-model.number="localConfig.personalizedWeight"
            >
          </div>
        </div>
      </div>

      <!-- Performance Impact Prediction -->
      <div class="config-section">
        <h3>Predicted Impact</h3>
        <div class="impact-prediction">
          <div class="impact-metric">
            <span class="metric-label">Engagement Change:</span>
            <span class="metric-value" :class="impactPrediction.engagement.class">
              {{ impactPrediction.engagement.value }}
            </span>
          </div>
          <div class="impact-metric">
            <span class="metric-label">Revenue Change:</span>
            <span class="metric-value" :class="impactPrediction.revenue.class">
              {{ impactPrediction.revenue.value }}
            </span>
          </div>
          <div class="impact-metric">
            <span class="metric-label">User Satisfaction:</span>
            <span class="metric-value" :class="impactPrediction.satisfaction.class">
              {{ impactPrediction.satisfaction.value }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'

const props = defineProps({
  config: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update', 'reset'])

const localConfig = reactive({ ...props.config })

const totalWeight = computed(() => {
  return localConfig.engagementWeight + 
         localConfig.revenueWeight + 
         localConfig.diversityWeight
})

const impactPrediction = computed(() => {
  // Simple heuristic-based impact prediction
  const engagementImpact = (localConfig.engagementWeight - 0.4) * 100
  const revenueImpact = (localConfig.revenueWeight - 0.4) * 100
  const satisfactionImpact = (localConfig.diversityWeight - 0.2) * 100

  return {
    engagement: {
      value: `${engagementImpact > 0 ? '+' : ''}${engagementImpact.toFixed(1)}%`,
      class: engagementImpact > 0 ? 'positive' : engagementImpact < 0 ? 'negative' : 'neutral'
    },
    revenue: {
      value: `${revenueImpact > 0 ? '+' : ''}${revenueImpact.toFixed(1)}%`,
      class: revenueImpact > 0 ? 'positive' : revenueImpact < 0 ? 'negative' : 'neutral'
    },
    satisfaction: {
      value: `${satisfactionImpact > 0 ? '+' : ''}${satisfactionImpact.toFixed(1)}%`,
      class: satisfactionImpact > 0 ? 'positive' : satisfactionImpact < 0 ? 'negative' : 'neutral'
    }
  }
})

function updateWeights() {
  // Auto-normalize weights if they exceed 1.0
  const total = totalWeight.value
  if (total > 1.0) {
    const factor = 1.0 / total
    localConfig.engagementWeight *= factor
    localConfig.revenueWeight *= factor
    localConfig.diversityWeight *= factor
  }
}

function saveConfig() {
  emit('update', { ...localConfig })
}

function resetToDefaults() {
  emit('reset')
}

// Watch for external config changes
watch(() => props.config, (newConfig) => {
  Object.assign(localConfig, newConfig)
}, { deep: true })
</script>

<style scoped>
.algorithm-config {
  max-width: 1000px;
}

.config-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.config-header h2 {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
}

.config-actions {
  display: flex;
  gap: 12px;
}

.btn-primary, .btn-secondary {
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
  border: none;
}

.btn-primary:hover {
  background-color: #2563eb;
}

.btn-secondary {
  background-color: white;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background-color: #f9fafb;
}

.config-sections {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.config-section {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 24px;
}

.config-section h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 20px;
}

.weight-controls {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.weight-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.weight-item label {
  font-weight: 500;
  color: #374151;
  min-width: 140px;
}

.slider-container {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.slider-container input[type="range"] {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: #e5e7eb;
  outline: none;
}

.weight-value {
  font-weight: 600;
  color: #1f2937;
  min-width: 40px;
  text-align: right;
}

.weight-total {
  padding: 12px;
  background-color: #f3f4f6;
  border-radius: 6px;
  font-weight: 600;
  text-align: center;
}

.weight-warning {
  color: #f59e0b;
  margin-left: 8px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-weight: 500;
  color: #374151;
}

.form-group input {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
}

.form-group input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-group small {
  color: #6b7280;
  font-size: 12px;
}

.impact-prediction {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.impact-metric {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background-color: #f9fafb;
  border-radius: 6px;
}

.metric-label {
  font-weight: 500;
  color: #374151;
}

.metric-value {
  font-weight: 600;
}

.metric-value.positive {
  color: #10b981;
}

.metric-value.negative {
  color: #ef4444;
}

.metric-value.neutral {
  color: #6b7280;
}
</style>
