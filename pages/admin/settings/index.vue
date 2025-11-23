<template>
  <div class="admin-settings">
    <!-- Settings Tabs -->
    <div class="settings-tabs">
      <button 
        @click="activeTab = 'interests'" 
        :class="['tab-btn', { active: activeTab === 'interests' }]"
      >
        🎯 Interests
      </button>
      <button 
        @click="activeTab = 'premium'" 
        :class="['tab-btn', { active: activeTab === 'premium' }]"
      >
        💎 Premium Features
      </button>
      <button 
        @click="activeTab = 'algorithm'" 
        :class="['tab-btn', { active: activeTab === 'algorithm' }]"
      >
        ⚙️ Algorithm Config
      </button>
      <button 
        @click="activeTab = 'causal'" 
        :class="['tab-btn', { active: activeTab === 'causal' }]"
      >
        📊 Causal Inference
      </button>
    </div>

    <!-- Interests Tab -->
    <div v-show="activeTab === 'interests'" class="tab-content">
      <div class="admin-interests">
        <!-- Header Section -->
        <div class="admin-header">
          <div class="header-content">
            <h1 class="page-title">🎯 Manage Interests</h1>
            <p class="page-description">Create and manage user interest categories for better content targeting</p>
          </div>
          <div class="header-actions">
            <button @click="showAddForm = true" class="btn-primary">
              <span>+</span>
              Add New Interest
            </button>
          </div>
        </div>

        <!-- Add/Edit Form Modal -->
        <div v-if="showAddForm" class="modal-overlay" @click="closeForm">
          <div class="modal-content" @click.stop>
            <div class="modal-header">
              <h3>{{ editingInterest ? 'Edit Interest' : 'Add New Interest' }}</h3>
              <button @click="closeForm" class="close-btn">&times;</button>
            </div>
            
            <form @submit.prevent="saveInterest" class="interest-form">
              <div class="form-group">
                <label for="name">Interest Name *</label>
                <input 
                  id="name"
                  v-model="currentInterest.name" 
                  placeholder="e.g., Technology, Sports, Music"
                  required
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label for="description">Description</label>
                <textarea 
                  id="description"
                  v-model="currentInterest.description" 
                  placeholder="Brief description of this interest category"
                  rows="3"
                  class="form-textarea"
                ></textarea>
              </div>

              <div class="form-group">
                <label for="category">Category</label>
                <select v-model="currentInterest.category" class="form-select">
                  <option value="">Select a category</option>
                  <option value="entertainment">Entertainment</option>
                  <option value="technology">Technology</option>
                  <option value="sports">Sports</option>
                  <option value="lifestyle">Lifestyle</option>
                  <option value="education">Education</option>
                  <option value="business">Business</option>
                  <option value="health">Health & Fitness</option>
                  <option value="travel">Travel</option>
                  <option value="food">Food & Cooking</option>
                  <option value="arts">Arts & Culture</option>
                </select>
              </div>

              <div class="form-group">
                <label for="icon">Icon (Emoji)</label>
                <input 
                  id="icon"
                  v-model="currentInterest.icon" 
                  placeholder="🎮"
                  maxlength="2"
                  class="form-input icon-input"
                />
              </div>

              <div class="form-group">
                <label class="checkbox-label">
                  <input 
                    type="checkbox" 
                    v-model="currentInterest.isActive"
                    class="form-checkbox"
                  />
                  Active (visible to users)
                </label>
              </div>

              <div class="form-actions">
                <button type="button" @click="closeForm" class="btn-secondary">
                  Cancel
                </button>
                <button type="submit" class="btn-primary" :disabled="saving">
                  {{ saving ? 'Saving...' : (editingInterest ? 'Update Interest' : 'Create Interest') }}
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- Interests List -->
        <div class="interests-container">
          <!-- Filters -->
          <div class="filters-section">
            <div class="search-box">
              <input 
                v-model="searchQuery" 
                placeholder="Search interests..."
                class="search-input"
              />
            </div>
            <div class="filter-buttons">
              <button 
                @click="filterStatus = 'all'" 
                :class="['filter-btn', { active: filterStatus === 'all' }]"
              >
                All ({{ interests.length }})
              </button>
              <button 
                @click="filterStatus = 'active'" 
                :class="['filter-btn', { active: filterStatus === 'active' }]"
              >
                Active ({{ activeInterests.length }})
              </button>
              <button 
                @click="filterStatus = 'inactive'" 
                :class="['filter-btn', { active: filterStatus === 'inactive' }]"
              >
                Inactive ({{ inactiveInterests.length }})
              </button>
            </div>
          </div>

          <!-- Interests Grid -->
          <div v-if="filteredInterests.length > 0" class="interests-grid">
            <div 
              v-for="interest in filteredInterests" 
              :key="interest.id" 
              class="interest-card"
              :class="{ inactive: !interest.isActive }"
            >
              <div class="interest-header">
                <div class="interest-icon">{{ interest.icon || '🏷️' }}</div>
                <div class="interest-info">
                  <h4 class="interest-name">{{ interest.name }}</h4>
                  <p class="interest-category">{{ interest.category || 'Uncategorized' }}</p>
                </div>
                <div class="interest-status">
                  <span :class="['status-badge', interest.isActive ? 'active' : 'inactive']">
                    {{ interest.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </div>
              </div>

              <div class="interest-body">
                <p class="interest-description">
                  {{ interest.description || 'No description provided' }}
                </p>
                <div class="interest-stats">
                  <span class="stat">👥 {{ interest.userCount || 0 }} users</span>
                  <span class="stat">📝 {{ interest.postCount || 0 }} posts</span>
                </div>
              </div>

              <div class="interest-actions">
                <button @click="editInterest(interest)" class="btn-sm btn-outline">
                  Edit
                </button>
                <button 
                  @click="toggleInterestStatus(interest)" 
                  :class="['btn-sm', interest.isActive ? 'btn-warning' : 'btn-success']"
                >
                  {{ interest.isActive ? 'Deactivate' : 'Activate' }}
                </button>
                <button @click="deleteInterest(interest.id)" class="btn-sm btn-danger">
                  Delete
                </button>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else class="empty-state">
            <div class="empty-icon">🎯</div>
            <h3>No interests found</h3>
            <p>{{ searchQuery ? 'Try adjusting your search terms' : 'Create your first interest category to get started' }}</p>
            <button v-if="!searchQuery" @click="showAddForm = true" class="btn-primary">
              Create First Interest
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Premium Features Tab -->
    <div v-show="activeTab === 'premium'" class="tab-content">
      <div class="premium-section">
        <h2>💎 Premium Feature Toggle</h2>
        
        <form @submit.prevent="saveRule" class="premium-form">
          <div class="form-group">
            <label for="target">Target</label>
            <select v-model="rule.target" id="target" class="form-select">
              <option value="country">Country</option>
              <option value="region">Region</option>
              <option value="geo">Geo Coordinates</option>
              <option value="all">All Users</option>
            </select>
          </div>

          <div class="form-group">
            <label for="value">Value</label>
            <input 
              id="value"
              v-model="rule.value" 
              placeholder="e.g. Nigeria or 6.45,3.39" 
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label class="checkbox-group-label">Premium Features</label>
            <div class="checkbox-group">
              <label class="checkbox-item">
                <input type="checkbox" v-model="rule.features.p2p" />
                P2P Access
              </label>
              <label class="checkbox-item">
                <input type="checkbox" v-model="rule.features.matching" />
                Matching Access
              </label>
              <label class="checkbox-item">
                <input type="checkbox" v-model="rule.features.rankHide" />
                Rank Hide Access
              </label>
            </div>
          </div>

          <div class="form-group">
            <label class="checkbox-item">
              <input type="checkbox" v-model="rule.active" />
              Active
            </label>
          </div>

          <button type="submit" class="btn btn-primary btn-lg">
            Save Rule
          </button>
        </form>

        <div class="rules-list">
          <h3>Existing Rules</h3>
          <div v-if="rules.length > 0" class="rules-table">
            <div v-for="r in rules" :key="r._id" class="rule-item">
              <div class="rule-info">
                <span class="rule-target">{{ r.target }}</span>
                <span class="rule-value">{{ r.value }}</span>
                <span class="rule-features">{{ Object.keys(r.features).filter(k => r.features[k]).join(', ') }}</span>
              </div>
              <button @click="deleteRule(r)" class="btn btn-sm btn-danger">
                Delete
              </button>
            </div>
          </div>
          <div v-else class="empty-state">
            <p>No premium rules configured</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Algorithm Config Tab -->
    <div v-show="activeTab === 'algorithm'" class="tab-content">
      <div class="algorithm-section">
        <h2>⚙️ Algorithm Configuration</h2>
        <p class="section-description">Configure matching algorithm parameters</p>
        
        <form @submit.prevent="saveAlgorithmConfig" class="algorithm-form">
          <div class="form-group">
            <label for="algo-weight">Matching Weight</label>
            <input 
              id="algo-weight"
              v-model.number="algorithmConfig.matchingWeight" 
              type="number" 
              min="0" 
              max="100"
              step="0.1"
              class="form-input"
            />
            <p class="form-hint">0-100: Higher values prioritize better matches</p>
          </div>

          <div class="form-group">
            <label for="algo-threshold">Match Threshold</label>
            <input 
              id="algo-threshold"
              v-model.number="algorithmConfig.matchThreshold" 
              type="number" 
              min="0" 
              max="1"
              step="0.01"
              class="form-input"
            />
            <p class="form-hint">0-1: Minimum score required for a match</p>
          </div>

          <div class="form-group">
            <label for="algo-diversity">Diversity Factor</label>
            <input 
              id="algo-diversity"
              v-model.number="algorithmConfig.diversityFactor" 
              type="number" 
              min="0" 
              max="1"
              step="0.01"
              class="form-input"
            />
            <p class="form-hint">0-1: Balance between similarity and diversity</p>
          </div>

          <div class="form-group">
            <label class="checkbox-item">
              <input type="checkbox" v-model="algorithmConfig.enableAI" />
              Enable AI-Powered Matching
            </label>
          </div>

          <button type="submit" class="btn btn-primary btn-lg">
            Save Configuration
          </button>
        </form>
      </div>
    </div>

    <!-- Causal Inference Tab -->
    <div v-show="activeTab === 'causal'" class="tab-content">
      <div class="causal-section">
        <h2>📊 Causal Inference Panel</h2>
        <p class="section-description">Analyze causal relationships in user matching</p>

        <div class="causal-controls">
          <div class="form-group">
            <label for="causal-metric">Select Metric</label>
            <select v-model="selectedMetric" id="causal-metric" class="form-select">
              <option value="engagement">User Engagement</option>
              <option value="retention">Retention Rate</option>
              <option value="satisfaction">User Satisfaction</option>
              <option value="conversion">Conversion Rate</option>
            </select>
          </div>

          <button @click="analyzeCausal" class="btn btn-primary">
            Analyze Causal Impact
          </button>
        </div>

        <div v-if="causalAnalysis" class="causal-results">
          <h3>Analysis Results</h3>
          
          <div class="results-grid">
            <div class="result-card">
              <span class="result-label">Treatment Effect</span>
              <span class="result-value">{{ causalAnalysis.treatmentEffect.toFixed(2) }}%</span>
            </div>
            <div class="result-card">
              <span class="result-label">Confidence Interval</span>
              <span class="result-value">{{ causalAnalysis.confidenceInterval }}</span>
            </div>
            <div class="result-card">
              <span class="result-label">P-Value</span>
              <span class="result-value">{{ causalAnalysis.pValue.toFixed(4) }}</span>
            </div>
            <div class="result-card">
              <span class="result-label">Sample Size</span>
              <span class="result-value">{{ causalAnalysis.sampleSize }}</span>
            </div>
          </div>

          <div class="causal-insights">
            <h4>Key Insights</h4>
            <ul>
              <li v-for="(insight, idx) in causalAnalysis.insights" :key="idx">
                {{ insight }}
              </li>
            </ul>
          </div>
        </div>

        <div v-else class="empty-state">
          <p>Select a metric and click "Analyze Causal Impact" to view results</p>
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

import { ref, computed, onMounted } from 'vue'

// Tab Management
const activeTab = ref('interests')

// ===== INTERESTS STATE =====
const showAddForm = ref(false)
const editingInterest = ref(null)
const saving = ref(false)
const searchQuery = ref('')
const filterStatus = ref('all')

const currentInterest = ref({
  name: '',
  description: '',
  category: '',
  icon: '',
  isActive: true
})

const interests = ref([])

const activeInterests = computed(() => 
  interests.value.filter(interest => interest.isActive)
)

const inactiveInterests = computed(() => 
  interests.value.filter(interest => !interest.isActive)
)

const filteredInterests = computed(() => {
  let filtered = interests.value

  if (filterStatus.value === 'active') {
    filtered = filtered.filter(interest => interest.isActive)
  } else if (filterStatus.value === 'inactive') {
    filtered = filtered.filter(interest => !interest.isActive)
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(interest => 
      interest.name.toLowerCase().includes(query) ||
      interest.description?.toLowerCase().includes(query) ||
      interest.category?.toLowerCase().includes(query)
    )
  }

  return filtered
})

// ===== PREMIUM STATE =====
const rule = ref({
  target: 'country',
  value: '',
  features: { p2p: false, matching: false, rankHide: false },
  active: true
})

const rules = ref([])

// ===== ALGORITHM STATE =====
const algorithmConfig = ref({
  matchingWeight: 75,
  matchThreshold: 0.6,
  diversityFactor: 0.3,
  enableAI: true
})

// ===== CAUSAL INFERENCE STATE =====
const selectedMetric = ref('engagement')
const causalAnalysis = ref(null)

// ===== INTERESTS METHODS =====
const loadInterests = async () => {
  try {
    interests.value = [
      {
        id: 1,
        name: 'Technology',
        description: 'Latest tech trends, gadgets, and innovations',
        category: 'technology',
        icon: '💻',
        isActive: true,
        userCount: 1250,
        postCount: 3420
      },
      {
        id: 2,
        name: 'Gaming',
        description: 'Video games, esports, and gaming culture',
        category: 'entertainment',
        icon: '🎮',
        isActive: true,
        userCount: 890,
        postCount: 2150
      },
      {
        id: 3,
        name: 'Cooking',
        description: 'Recipes, cooking tips, and culinary adventures',
        category: 'food',
        icon: '👨‍🍳',
        isActive: false,
        userCount: 650,
        postCount: 1200
      }
    ]
  } catch (error) {
    console.error('Error loading interests:', error)
  }
}

const saveInterest = async () => {
  if (!currentInterest.value.name.trim()) return

  saving.value = true
  try {
    if (editingInterest.value) {
      const index = interests.value.findIndex(i => i.id === editingInterest.value.id)
      if (index !== -1) {
        interests.value[index] = { ...editingInterest.value, ...currentInterest.value }
      }
    } else {
      const newInterest = {
        id: Date.now(),
        ...currentInterest.value,
        userCount: 0,
        postCount: 0
      }
      interests.value.push(newInterest)
    }
    
    closeForm()
  } catch (error) {
    console.error('Error saving interest:', error)
  } finally {
    saving.value = false
  }
}

const editInterest = (interest) => {
  editingInterest.value = interest
  currentInterest.value = { ...interest }
  showAddForm.value = true
}

const toggleInterestStatus = async (interest) => {
  try {
    interest.isActive = !interest.isActive
  } catch (error) {
    console.error('Error toggling interest status:', error)
    interest.isActive = !interest.isActive
  }
}

const deleteInterest = async (id) => {
  if (!confirm('Are you sure you want to delete this interest? This action cannot be undone.')) {
    return
  }

  try {
    interests.value = interests.value.filter(interest => interest.id !== id)
  } catch (error) {
    console.error('Error deleting interest:', error)
  }
}

const closeForm = () => {
  showAddForm.value = false
  editingInterest.value = null
  currentInterest.value = {
    name: '',
    description: '',
    category: '',
    icon: '',
    isActive: true
  }
}

// ===== PREMIUM METHODS =====
const fetchRules = async () => {
  try {
    const res = await fetch('/api/admin/premium-rules')
    rules.value = await res.json()
  } catch (error) {
    console.error('Error fetching premium rules:', error)
  }
}

const saveRule = async () => {
  try {
    await fetch('/api/admin/premiumRules', {
      method: 'POST',
      body: JSON.stringify(rule.value),
      headers: { 'Content-Type': 'application/json' }
    })
    fetchRules()
    rule.value = {
      target: 'country',
      value: '',
      features: { p2p: false, matching: false, rankHide: false },
      active: true
    }
  } catch (error) {
    console.error('Error saving premium rule:', error)
  }
}

const deleteRule = async (r) => {
  try {
    await fetch('/api/admin/premium-rules', {
      method: 'DELETE',
      body: JSON.stringify({ target: r.target, value: r.value }),
      headers: { 'Content-Type': 'application/json' }
    })
    fetchRules()
  } catch (error) {
    console.error('Error deleting premium rule:', error)
  }
}

// ===== ALGORITHM METHODS =====
const saveAlgorithmConfig = async () => {
  try {
    await fetch('/api/admin/algorithm-config', {
      method: 'POST',
      body: JSON.stringify(algorithmConfig.value),
      headers: { 'Content-Type': 'application/json' }
    })
    alert('Algorithm configuration saved successfully!')
  } catch (error) {
    console.error('Error saving algorithm config:', error)
  }
}

// ===== CAUSAL INFERENCE METHODS =====
const analyzeCausal = async () => {
  try {
    const res = await fetch(`/api/admin/causal-analysis?metric=${selectedMetric.value}`)
    const data = await res.json()
    causalAnalysis.value = {
      treatmentEffect: data.treatmentEffect,
      confidenceInterval: `[${data.ciLower.toFixed(2)}, ${data.ciUpper.toFixed(2)}]`,
      pValue: data.pValue,
      sampleSize: data.sampleSize,
      insights: data.insights || [
        'Treatment effect is statistically significant',
        'Positive impact on user engagement',
        'Recommend implementing this change'
      ]
    }
  } catch (error) {
    console.error('Error analyzing causal impact:', error)
  }
}

// ===== LIFECYCLE =====
onMounted(() => {
  loadInterests()
  fetchRules()
})
</script>

<style scoped>
.admin-settings {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

/* Tabs */
.settings-tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 2px solid #e5e7eb;
  overflow-x: auto;
}

.tab-btn {
  padding: 1rem 1.5rem;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  font-weight: 500;
  color: #6b7280;
  transition: all 0.2s;
  font-size: 1rem;
  white-space: nowrap;
}

.tab-btn:hover {
  color: #1f2937;
}

.tab-btn.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
}

.tab-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Interests Section */
.admin-interests {
  display: grid;
  gap: 2rem;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
}

.header-content {
  flex: 1;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
}

.page-description {
  color: #6b7280;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.btn-primary {
  background: #3b82f6;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  border: none;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Modal */
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
  border-radius: 0.75rem;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
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

.interest-form {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
}

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-family: inherit;
}

.form-textarea {
  resize: vertical;
}

.icon-input {
  width: 80px;
  text-align: center;
  font-size: 1.5rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.form-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.form-hint {
  margin: 0.5rem 0 0 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
  padding: 0.75rem 1.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

/* Interests Container */
.interests-container {
  display: grid;
  gap: 2rem;
}

.filters-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.search-box {
  flex: 1;
  min-width: 200px;
}

.search-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
}

.filter-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.filter-btn.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.interests-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.interest-card {
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  transition: all 0.2s;
}

.interest-card:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.interest-card.inactive {
  opacity: 0.6;
}

.interest-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
}

.interest-icon {
  font-size: 2rem;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  border-radius: 0.5rem;
}

.interest-info {
  flex: 1;
}

.interest-name {
  margin: 0 0 0.25rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
}

.interest-category {
  margin: 0;
  font-size: 0.875rem;
  color: #6b7280;
  text-transform: capitalize;
}

.interest-status {
  display: flex;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-badge.active {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.inactive {
  background: #fee2e2;
  color: #991b1b;
}

.interest-body {
  margin-bottom: 1rem;
}

.interest-description {
  color: #6b7280;
  margin-bottom: 1rem;
  line-height: 1.5;
}

.interest-stats {
  display: flex;
  gap: 1rem;
}

.stat {
  font-size: 0.875rem;
  color: #6b7280;
}

.interest-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  border-radius: 0.375rem;
  border: 1px solid #d1d5db;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-outline {
  background: white;
  color: #374151;
}

.btn-outline:hover {
  background: #f3f4f6;
}

.btn-success {
  background: #10b981;
  color: white;
  border-color: #10b981;
}

.btn-success:hover {
  background: #059669;
}

.btn-warning {
  background: #f59e0b;
  color: white;
  border-color: #f59e0b;
}

.btn-warning:hover {
  background: #d97706;
}

.btn-danger {
  background: #ef4444;
  color: white;
  border-color: #ef4444;
}

.btn-danger:hover {
  background: #dc2626;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state h3 {
  margin: 0 0 0.5rem 0;
  color: #1f2937;
}

.empty-state p {
  color: #6b7280;
  margin-bottom: 2rem;
}

/* Premium Section */
.premium-section {
  display: grid;
  gap: 2rem;
}

.premium-section h2 {
  margin: 0 0 1.5rem 0;
  color: #1f2937;
}

.premium-form {
  background: #f9fafb;
  padding: 2rem;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  margin-bottom: 2rem;
}

.checkbox-group-label {
  display: block;
  margin-bottom: 1rem;
  font-weight: 500;
  color: #374151;
}

.checkbox-group {
  display: grid;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.checkbox-item input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.btn-lg {
  padding: 1rem 2rem;
  font-size: 1rem;
}

.rules-list {
  background: #f9fafb;
  padding: 2rem;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.rules-list h3 {
  margin: 0 0 1.5rem 0;
  color: #1f2937;
}

.rules-table {
  display: grid;
  gap: 1rem;
}

.rule-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: white;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.rule-info {
  display: flex;
  gap: 1rem;
  flex: 1;
}

.rule-target,
.rule-value,
.rule-features {
  font-size: 0.9rem;
  color: #374151;
}

.rule-target {
  font-weight: 600;
  min-width: 80px;
}

/* Algorithm Section */
.algorithm-section {
  display: grid;
  gap: 2rem;
}

.algorithm-section h2 {
  margin: 0 0 0.5rem 0;
  color: #1f2937;
}

.section-description {
  color: #6b7280;
  margin: 0 0 2rem 0;
}

.algorithm-form {
  background: #f9fafb;
  padding: 2rem;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

/* Causal Section */
.causal-section {
  display: grid;
  gap: 2rem;
}

.causal-section h2 {
  margin: 0 0 0.5rem 0;
  color: #1f2937;
}

.causal-controls {
  background: #f9fafb;
  padding: 2rem;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  display: grid;
  gap: 1.5rem;
}

.causal-results {
  background: #f0fdf4;
  padding: 2rem;
  border-radius: 8px;
  border: 1px solid #bbf7d0;
}

.causal-results h3 {
  margin: 0 0 1.5rem 0;
  color: #065f46;
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.result-card {
  background: white;
  padding: 1rem;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.result-label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.result-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #065f46;
}

.causal-insights {
  background: white;
  padding: 1.5rem;
  border-radius: 6px;
}

.causal-insights h4 {
  margin: 0 0 1rem 0;
  color: #1f2937;
}

.causal-insights ul {
  margin: 0;
  padding-left: 1.5rem;
}

.causal-insights li {
  margin-bottom: 0.5rem;
  color: #374151;
}

@media (max-width: 768px) {
  .admin-settings {
    padding: 1rem;
  }

  .settings-tabs {
    flex-direction: column;
  }

  .tab-btn {
    border-bottom: none;
    border-left: 3px solid transparent;
    padding: 0.75rem 1rem;
  }

  .tab-btn.active {
    border-left-color: #3b82f6;
    border-bottom-color: transparent;
  }

  .admin-header {
    flex-direction: column;
    gap: 1rem;
  }

  .header-actions {
    width: 100%;
  }

  .btn-primary {
    width: 100%;
    justify-content: center;
  }

  .filters-section {
    flex-direction: column;
  }

  .search-box {
    width: 100%;
  }

  .interests-grid {
    grid-template-columns: 1fr;
  }

  .results-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
