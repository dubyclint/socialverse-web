<template>
  <div class="admin-ranks">
    <!-- Header Section -->
    <div class="admin-header">
      <div class="header-content">
        <h1 class="page-title">🏆 User Ranks Management</h1>
        <p class="page-description">Create and manage user ranking system and achievements</p>
      </div>
      <div class="header-actions">
        <button @click="showAddForm = true" class="btn-primary">
          <Icon name="plus" />
          Add New Rank
        </button>
      </div>
    </div>

    <!-- Add/Edit Form Modal -->
    <div v-if="showAddForm" class="modal-overlay" @click="closeForm">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ editingRank ? 'Edit Rank' : 'Add New Rank' }}</h3>
          <button @click="closeForm" class="close-btn">&times;</button>
        </div>
        
        <form @submit.prevent="saveRank" class="rank-form">
          <div class="form-group">
            <label for="name">Rank Name *</label>
            <input 
              id="name"
              v-model="currentRank.name" 
              placeholder="e.g., Bronze, Silver, Gold"
              required
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label for="description">Description</label>
            <textarea 
              id="description"
              v-model="currentRank.description" 
              placeholder="Description of this rank and its benefits"
              rows="3"
              class="form-textarea"
            ></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="level">Level *</label>
              <input 
                id="level"
                v-model.number="currentRank.level" 
                type="number"
                min="1"
                required
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label for="pointsRequired">Points Required *</label>
              <input 
                id="pointsRequired"
                v-model.number="currentRank.pointsRequired" 
                type="number"
                min="0"
                required
                class="form-input"
              />
            </div>
          </div>

          <div class="form-group">
            <label for="icon">Icon/Badge</label>
            <input 
              id="icon"
              v-model="currentRank.icon" 
              placeholder="🥉"
              maxlength="2"
              class="form-input icon-input"
            />
          </div>

          <div class="form-group">
            <label for="color">Color Theme</label>
            <select v-model="currentRank.color" class="form-select">
              <option value="gray">Gray</option>
              <option value="bronze">Bronze</option>
              <option value="silver">Silver</option>
              <option value="gold">Gold</option>
              <option value="platinum">Platinum</option>
              <option value="diamond">Diamond</option>
            </select>
          </div>

          <div class="form-group">
            <label>Privileges</label>
            <div class="privileges-grid">
              <label v-for="privilege in availablePrivileges" :key="privilege.key" class="privilege-item">
                <input 
                  type="checkbox" 
                  :value="privilege.key"
                  v-model="currentRank.privileges"
                  class="form-checkbox"
                />
                <span>{{ privilege.label }}</span>
              </label>
            </div>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input 
                type="checkbox" 
                v-model="currentRank.isActive"
                class="form-checkbox"
              />
              Active (available to users)
            </label>
          </div>

          <div class="form-actions">
            <button type="button" @click="closeForm" class="btn-secondary">
              Cancel
            </button>
            <button type="submit" class="btn-primary" :disabled="saving">
              {{ saving ? 'Saving...' : (editingRank ? 'Update Rank' : 'Create Rank') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Ranks List -->
    <div class="ranks-container">
      <!-- Stats Overview -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">🏆</div>
          <div class="stat-content">
            <h3>Total Ranks</h3>
            <p class="stat-value">{{ ranks.length }}</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-content">
            <h3>Users with Ranks</h3>
            <p class="stat-value">{{ totalRankedUsers }}</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">⭐</div>
          <div class="stat-content">
            <h3>Avg Points</h3>
            <p class="stat-value">{{ averagePoints }}</p>
          </div>
        </div>
      </div>

      <!-- Ranks Grid -->
      <div class="ranks-grid">
        <div 
          v-for="rank in sortedRanks" 
          :key="rank.id" 
          class="rank-card"
          :class="[`rank-${rank.color}`, { inactive: !rank.isActive }]"
        >
          <div class="rank-header">
            <div class="rank-badge">
              <div class="rank-icon">{{ rank.icon || '🏅' }}</div>
              <div class="rank-level">Level {{ rank.level }}</div>
            </div>
            <div class="rank-status">
              <span :class="['status-badge', rank.isActive ? 'active' : 'inactive']">
                {{ rank.isActive ? 'Active' : 'Inactive' }}
              </span>
            </div>
          </div>

          <div class="rank-body">
            <h3 class="rank-name">{{ rank.name }}</h3>
            <p class="rank-description">{{ rank.description || 'No description' }}</p>
            
            <div class="rank-requirements">
              <div class="requirement">
                <span class="requirement-label">Points Required:</span>
                <span class="requirement-value">{{ formatNumber(rank.pointsRequired) }}</span>
              </div>
              <div class="requirement">
                <span class="requirement-label">Current Users:</span>
                <span class="requirement-value">{{ rank.userCount || 0 }}</span>
              </div>
            </div>

            <div v-if="rank.privileges && rank.privileges.length > 0" class="rank-privileges">
              <h4>Privileges:</h4>
              <div class="privileges-list">
                <span 
                  v-for="privilege in rank.privileges" 
                  :key="privilege" 
                  class="privilege-tag"
                >
                  {{ getPrivilegeLabel(privilege) }}
                </span>
              </div>
            </div>
          </div>

          <div class="rank-actions">
            <button @click="editRank(rank)" class="btn-sm btn-outline">
              Edit
            </button>
            <button 
              @click="toggleRankStatus(rank)" 
              :class="['btn-sm', rank.isActive ? 'btn-warning' : 'btn-success']"
            >
              {{ rank.isActive ? 'Deactivate' : 'Activate' }}
            </button>
            <button @click="deleteRank(rank.id)" class="btn-sm btn-danger">
              Delete
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="ranks.length === 0" class="empty-state">
        <div class="empty-icon">🏆</div>
        <h3>No ranks created yet</h3>
        <p>Create your first rank to start the user ranking system</p>
        <button @click="showAddForm = true" class="btn-primary">
          Create First Rank
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'profile-completion', 'route-guard'],
  layout: 'default'
})
import { ref, computed, onMounted } from 'vue'

// Reactive data
const showAddForm = ref(false)
const editingRank = ref(null)
const saving = ref(false)

const currentRank = ref({
  name: '',
  description: '',
  level: 1,
  pointsRequired: 0,
  icon: '',
  color: 'gray',
  privileges: [],
  isActive: true
})

const ranks = ref([])

const availablePrivileges = [
  { key: 'custom_profile', label: 'Custom Profile Theme' },
  { key: 'priority_support', label: 'Priority Support' },
  { key: 'exclusive_content', label: 'Access Exclusive Content' },
  { key: 'create_groups', label: 'Create Groups' },
  { key: 'upload_large_files', label: 'Upload Large Files' },
  { key: 'custom_badges', label: 'Custom Badges' },
  { key: 'featured_posts', label: 'Featured Posts' },
  { key: 'advanced_analytics', label: 'Advanced Analytics' }
]

// Computed properties
const sortedRanks = computed(() => 
  [...ranks.value].sort((a, b) => a.level - b.level)
)

const totalRankedUsers = computed(() => 
  ranks.value.reduce((total, rank) => total + (rank.userCount || 0), 0)
)

const averagePoints = computed(() => {
  if (ranks.value.length === 0) return 0
  const totalPoints = ranks.value.reduce((total, rank) => total + rank.pointsRequired, 0)
  return Math.round(totalPoints / ranks.value.length)
})

// Methods
const loadRanks = async () => {
  try {
    // Mock data - replace with actual API call
    ranks.value = [
      {
        id: 1,
        name: 'Bronze',
        description: 'Starting rank for new users',
        level: 1,
        pointsRequired: 0,
        icon: '🥉',
        color: 'bronze',
        privileges: ['custom_profile'],
        isActive: true,
        userCount: 1250
      },
      {
        id: 2,
        name: 'Silver',
        description: 'Intermediate rank for active users',
        level: 2,
        pointsRequired: 1000,
        icon: '🥈',
        color: 'silver',
        privileges: ['custom_profile', 'create_groups'],
        isActive: true,
        userCount: 890
      },
      {
        id: 3,
        name: 'Gold',
        description: 'Advanced rank for dedicated users',
        level: 3,
        pointsRequired: 5000,
        icon: '🥇',
        color: 'gold',
        privileges: ['custom_profile', 'create_groups', 'priority_support', 'exclusive_content'],
        isActive: true,
        userCount: 320
      },
      {
        id: 4,
        name: 'Platinum',
        description: 'Elite rank for top contributors',
        level: 4,
        pointsRequired: 15000,
        icon: '💎',
        color: 'platinum',
        privileges: ['custom_profile', 'create_groups', 'priority_support', 'exclusive_content', 'featured_posts'],
        isActive: true,
        userCount: 85
      }
    ]
  } catch (error) {
    console.error('Error loading ranks:', error)
  }
}

const saveRank = async () => {
  if (!currentRank.value.name.trim()) return

  saving.value = true
  try {
    if (editingRank.value) {
      // Update existing rank
      const index = ranks.value.findIndex(r => r.id === editingRank.value.id)
      if (index !== -1) {
        ranks.value[index] = { ...editingRank.value, ...currentRank.value }
      }
    } else {
      // Create new rank
      const newRank = {
        id: Date.now(),
        ...currentRank.value,
        userCount: 0
      }
      ranks.value.push(newRank)
    }
    
    closeForm()
  } catch (error) {
    console.error('Error saving rank:', error)
  } finally {
    saving.value = false
  }
}

const editRank = (rank) => {
  editingRank.value = rank
  currentRank.value = { ...rank }
  showAddForm.value = true
}

const toggleRankStatus = async (rank) => {
  try {
    rank.isActive = !rank.isActive
    // API call would go here
  } catch (error) {
    console.error('Error toggling rank status:', error)
    rank.isActive = !rank.isActive // Revert on error
  }
}

const deleteRank = async (id) => {
  if (!confirm('Are you sure you want to delete this rank? Users with this rank will be affected.')) {
    return
  }

  try {
    ranks.value = ranks.value.filter(rank => rank.id !== id)
    // API call would go here
  } catch (error) {
    console.error('Error deleting rank:', error)
  }
}

const closeForm = () => {
  showAddForm.value = false
  editingRank.value = null
  currentRank.value = {
    name: '',
    description: '',
    level: 1,
    pointsRequired: 0,
    icon: '',
    color: 'gray',
    privileges: [],
    isActive: true
  }
}

const getPrivilegeLabel = (key) => {
  const privilege = availablePrivileges.find(p => p.key === key)
  return privilege ? privilege.label : key
}

const formatNumber = (num) => {
  return new Intl.NumberFormat().format(num)
}

// Lifecycle
onMounted(() => {
  loadRanks()
})
</script>

<style scoped>
.admin-ranks {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
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
  border-radius: 0.75rem;
  width: 90%;
  max-width: 600px;
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

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
}

.rank-form {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
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
}

.icon-input {
  width: 80px;
  text-align: center;
  font-size: 1.5rem;
}

.privileges-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.privilege-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.375rem;
  transition: background-color 0.2s;
}

.privilege-item:hover {
  background: #f9fafb;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
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
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-icon {
  font-size: 2rem;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  border-radius: 0.5rem;
}

.stat-content h3 {
  margin: 0 0 0.5rem 0;
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 500;
}

.stat-value {
  font-size: 1.875rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

/* Ranks Grid */
.ranks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.rank-card {
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 2px solid transparent;
  transition: all 0.2s;
}

.rank-card:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.rank-card.inactive {
  opacity: 0.6;
}

/* Rank Color Themes */
.rank-bronze { border-color: #cd7f32; }
.rank-silver { border-color: #c0c0c0; }
.rank-gold { border-color: #ffd700; }
.rank-platinum { border-color: #e5e4e2; }
.rank-diamond { border-color: #b9f2ff; }

.rank-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.rank-badge {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.rank-icon {
  font-size: 2.5rem;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  border-radius: 50%;
}

.rank-level {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
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

.rank-name {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
}

.rank-description {
  color: #6b7280;
  margin-bottom: 1rem;
  line-height: 1.5;
}

.rank-requirements {
  margin-bottom: 1rem;
}

.requirement {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.requirement-label {
  color: #6b7280;
  font-size: 0.875rem;
}

.requirement-value {
  font-weight: 600;
  color: #1f2937;
  font-size: 0.875rem;
}

.rank-privileges h4 {
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  color: #374151;
  font-weight: 600;
}

.privileges-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.privilege-tag {
  background: #e0e7ff;
  color: #3730a3;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.rank-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
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

.btn-success {
  background: #10b981;
  color: white;
  border-color: #10b981;
}

.btn-warning {
  background: #f59e0b;
  color: white;
  border-color: #f59e0b;
}

.btn-danger {
  background: #ef4444;
  color: white;
  border-color: #ef4444;
}

/* Empty State */
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

@media (max-width: 768px) {
  .admin-header {
    flex-direction: column;
    gap: 1rem;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .privileges-grid {
    grid-template-columns: 1fr;
  }
  
  .ranks-grid {
    grid-template-columns: 1fr;
  }
  
  .modal-content {
    width: 95%;
    margin: 1rem;
  }
}
</style>
