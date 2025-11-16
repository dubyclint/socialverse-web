<template>
  <div class="admin-interests">
    <!-- Header Section -->
    <div class="admin-header">
      <div class="header-content">
        <h1 class="page-title">🎯 Manage Interests</h1>
        <p class="page-description">Create and manage user interest categories for better content targeting</p>
      </div>
      <div class="header-actions">
        <button @click="showAddForm = true" class="btn-primary">
          <Icon name="plus" />
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
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['route-guard', 'language-check', 'security-middleware'],
  layout: 'default'
})
  
import { ref, computed, onMounted } from 'vue'

// Page meta with admin authentication
definePageMeta({ 
  middleware: ['admin-auth'],
  layout: 'admin'
})

// Reactive data
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

// Computed properties
const activeInterests = computed(() => 
  interests.value.filter(interest => interest.isActive)
)

const inactiveInterests = computed(() => 
  interests.value.filter(interest => !interest.isActive)
)

const filteredInterests = computed(() => {
  let filtered = interests.value

  // Filter by status
  if (filterStatus.value === 'active') {
    filtered = filtered.filter(interest => interest.isActive)
  } else if (filterStatus.value === 'inactive') {
    filtered = filtered.filter(interest => !interest.isActive)
  }

  // Filter by search query
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

// Methods
const loadInterests = async () => {
  try {
    // Mock data - replace with actual API call
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
      // Update existing interest
      const index = interests.value.findIndex(i => i.id === editingInterest.value.id)
      if (index !== -1) {
        interests.value[index] = { ...editingInterest.value, ...currentInterest.value }
      }
    } else {
      // Create new interest
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
    // API call would go here
  } catch (error) {
    console.error('Error toggling interest status:', error)
    interest.isActive = !interest.isActive // Revert on error
  }
}

const deleteInterest = async (id) => {
  if (!confirm('Are you sure you want to delete this interest? This action cannot be undone.')) {
    return
  }

  try {
    interests.value = interests.value.filter(interest => interest.id !== id)
    // API call would go here
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

// Lifecycle
onMounted(() => {
  loadInterests()
})
</script>

<style scoped>
.admin-interests {
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

.btn-primary:hover {
  background: #2563eb;
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

/* Filters */
.filters-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  gap: 1rem;
}

.search-input {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  width: 300px;
}

.filter-buttons {
  display: flex;
  gap: 0.5rem;
}

.filter-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-btn.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

/* Interests Grid */
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
}*
.interest-category {
  margin: 0;
  font-size: 0.875rem;
  color: #6b7280;
  text-transform: capitalize;
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

.interest-description {
  color: #6b7280;
  margin-bottom: 1rem;
  line-height: 1.5;
}

.interest-stats {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
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
  
  .filters-section {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-input {
    width: 100%;
  }
  
  .interests-grid {
    grid-template-columns: 1fr;
  }
  
  .modal-content {
    width: 95%;
    margin: 1rem;
  }
}
</style>
