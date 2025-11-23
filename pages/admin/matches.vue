<template>
  <div class="matches-page">
    <!-- Tabs Navigation -->
    <div class="tabs-navigation">
      <button 
        @click="activeTab = 'filters'" 
        :class="['tab-btn', { active: activeTab === 'filters' }]"
      >
        🔍 Filter Requests
      </button>
      <button 
        @click="activeTab = 'group'" 
        :class="['tab-btn', { active: activeTab === 'group' }]"
      >
        👥 Group Override
      </button>
    </div>

    <!-- Filter Panel Section -->
    <div v-show="activeTab === 'filters'" class="filter-section">
      <h2>🔍 Filter Requests Management</h2>
      
      <div v-if="requests.length > 0" class="filter-requests">
        <div v-for="req in requests" :key="req.userId" class="request-card">
          <div class="request-header">
            <p class="user-id">User: {{ req.userId }}</p>
            <span class="request-status">Pending</span>
          </div>

          <div class="filters-list">
            <h4>Requested Filters:</h4>
            <ul>
              <li v-for="(val, key) in req.filters" :key="key">
                <label class="filter-item">
                  <input 
                    type="checkbox" 
                    v-model="selected[req.userId][key]" 
                  />
                  <span class="filter-name">{{ key }}</span>
                  <span class="filter-value">{{ val }}</span>
                </label>
              </li>
            </ul>
          </div>

          <div class="request-actions">
            <div class="rejection-reason">
              <input 
                v-model="reasons[req.userId]" 
                placeholder="Rejection reason (max 40 chars)" 
                maxlength="40"
                class="reason-input"
              />
            </div>
            <div class="action-buttons">
              <button 
                @click="approve(req.userId)" 
                class="btn btn-success"
              >
                ✓ Approve Selected
              </button>
              <button 
                @click="reject(req.userId)" 
                class="btn btn-danger"
              >
                ✗ Reject All
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <p>No pending filter requests</p>
      </div>
    </div>

    <!-- Group Override Section -->
    <div v-show="activeTab === 'group'" class="group-section">
      <h2>👥 Admin Group Override</h2>

      <div class="override-form-container">
        <form @submit.prevent="submitOverride" class="override-form">
          <div class="form-group">
            <label for="override-group">Force Match User IDs (comma-separated)</label>
            <input 
              id="override-group"
              v-model="overrideGroup" 
              placeholder="user123,user456,user789"
              class="form-input"
            />
            <p class="form-hint">Enter user IDs separated by commas to force match them into a group</p>
          </div>

          <button type="submit" class="btn btn-primary btn-lg">
            🔗 Force Match
          </button>
        </form>
      </div>

      <div v-if="group" class="override-result">
        <h3>✓ Override Group Created</h3>
        
        <div class="group-info">
          <div class="info-card">
            <span class="info-label">Group Score:</span>
            <span class="info-value">{{ group.groupScore }}</span>
          </div>
          <div class="info-card">
            <span class="info-label">Total Members:</span>
            <span class="info-value">{{ group.members.length }}</span>
          </div>
        </div>

        <div class="members-section">
          <h4>Group Members</h4>
          <div class="members-grid">
            <div v-for="member in group.members" :key="member.id" class="member-card">
              <img :src="member.avatar" :alt="member.username" class="member-avatar" />
              <div class="member-info">
                <p class="member-name">{{ member.username }}</p>
                <p class="member-rank">{{ member.rank }}</p>
                <span v-if="member.isVerified" class="verified-badge">✔ Verified</span>
              </div>
            </div>
          </div>
        </div>

        <div class="group-actions">
          <button @click="confirmGroup" class="btn btn-success">
            ✓ Confirm Group
          </button>
          <button @click="cancelGroup" class="btn btn-outline">
            ✗ Cancel
          </button>
        </div>
      </div>

      <div v-else class="empty-state">
        <p>No group override in progress</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['route-guard', 'language-check', 'security-middleware'],
  layout: 'default'
})

import { ref, onMounted } from 'vue'

// Filter Panel State
const requests = ref([])
const selected = ref({})
const reasons = ref({})

// Group Override State
const overrideGroup = ref('')
const group = ref(null)
const activeTab = ref('filters')

onMounted(async () => {
  await loadFilterRequests()
})

async function loadFilterRequests() {
  try {
    const res = await fetch('/api/admin/filter-requests')
    requests.value = await res.json()

    // Initialize selection state
    for (const req of requests.value) {
      selected.value[req.userId] = {}
      for (const key in req.filters) {
        selected.value[req.userId][key] = true
      }
      reasons.value[req.userId] = ''
    }
  } catch (error) {
    console.error('Failed to load filter requests:', error)
  }
}

async function approve(userId) {
  try {
    const approved = Object.entries(selected.value[userId])
      .filter(([_, val]) => val)
      .map(([key]) => key)

    const response = await fetch('/api/admin/approvefilters', {
      method: 'POST',
      body: JSON.stringify({ userId, approvedFilters: approved }),
      headers: { 'Content-Type': 'application/json' }
    })

    if (response.ok) {
      requests.value = requests.value.filter(r => r.userId !== userId)
    }
  } catch (error) {
    console.error('Failed to approve filters:', error)
  }
}

async function reject(userId) {
  try {
    const response = await fetch('/api/admin/rejectFilters', {
      method: 'POST',
      body: JSON.stringify({ 
        userId, 
        reason: reasons.value[userId] 
      }),
      headers: { 'Content-Type': 'application/json' }
    })

    if (response.ok) {
      requests.value = requests.value.filter(r => r.userId !== userId)
    }
  } catch (error) {
    console.error('Failed to reject filters:', error)
  }
}

async function submitOverride() {
  try {
    const res = await fetch(`/api/match/group?overrideGroup=${overrideGroup.value}`)
    const data = await res.json()
    group.value = data[0]
  } catch (error) {
    console.error('Failed to create group override:', error)
  }
}

function confirmGroup() {
  alert('Group override confirmed!')
  group.value = null
  overrideGroup.value = ''
}

function cancelGroup() {
  group.value = null
  overrideGroup.value = ''
}
</script>

<style scoped>
.matches-page {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

/* Tabs Navigation */
.tabs-navigation {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 2px solid #e5e7eb;
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
}

.tab-btn:hover {
  color: #1f2937;
}

.tab-btn.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
}

/* Sections */
.filter-section,
.group-section {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.filter-section h2,
.group-section h2 {
  margin-bottom: 1.5rem;
  color: #1f2937;
  font-size: 1.5rem;
}

/* Filter Requests */
.filter-requests {
  display: grid;
  gap: 1.5rem;
}

.request-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
  background: #f9fafb;
  transition: all 0.2s;
}

.request-card:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.request-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.user-id {
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.request-status {
  background: #fef3c7;
  color: #92400e;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
}

.filters-list {
  margin-bottom: 1.5rem;
}

.filters-list h4 {
  margin: 0 0 1rem 0;
  color: #374151;
  font-size: 0.95rem;
}

.filters-list ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 0.75rem;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background 0.2s;
}

.filter-item:hover {
  background: rgba(59, 130, 246, 0.05);
}

.filter-item input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.filter-name {
  font-weight: 500;
  color: #1f2937;
  min-width: 100px;
}

.filter-value {
  color: #6b7280;
  font-size: 0.9rem;
}

.request-actions {
  display: grid;
  gap: 1rem;
}

.rejection-reason {
  display: flex;
}

.reason-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.9rem;
}

.action-buttons {
  display: flex;
  gap: 1rem;
}

/* Group Override */
.override-form-container {
  margin-bottom: 2rem;
}

.override-form {
  background: #f9fafb;
  padding: 2rem;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #1f2937;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 1rem;
  font-family: monospace;
}

.form-hint {
  margin: 0.5rem 0 0 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.override-result {
  background: #f0fdf4;
  padding: 2rem;
  border-radius: 8px;
  border: 1px solid #bbf7d0;
}

.override-result h3 {
  margin: 0 0 1.5rem 0;
  color: #065f46;
  font-size: 1.25rem;
}

.group-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.info-card {
  background: white;
  padding: 1rem;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.info-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #065f46;
}

.members-section {
  margin-bottom: 2rem;
}

.members-section h4 {
  margin: 0 0 1rem 0;
  color: #1f2937;
}

.members-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
}

.member-card {
  background: white;
  padding: 1rem;
  border-radius: 6px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.member-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
}

.member-info {
  flex: 1;
}

.member-name {
  margin: 0;
  font-weight: 600;
  color: #1f2937;
}

.member-rank {
  margin: 0.25rem 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.verified-badge {
  display: inline-block;
  background: #d1fae5;
  color: #065f46;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.group-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

/* Buttons */
.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-lg {
  padding: 1rem 2rem;
  font-size: 1rem;
}

.btn-success {
  background: #10b981;
  color: white;
}

.btn-success:hover {
  background: #059669;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover {
  background: #dc2626;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-outline {
  background: white;
  border: 1px solid #d1d5db;
  color: #374151;
}

.btn-outline:hover {
  background: #f3f4f6;
}

.empty-state {
  text-align: center;
  padding: 3rem 2rem;
  color: #6b7280;
}

@media (max-width: 768px) {
  .matches-page {
    padding: 1rem;
  }

  .tabs-navigation {
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

  .action-buttons {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }

  .members-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }

  .group-actions {
    flex-direction: column;
  }
}
</style>
