<template>
  <div class="matches-page">
    <!-- Filter Panel Section -->
    <div class="filter-section">
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

    <!-- Match Management Section -->
    <div class="match-management-section">
      <h2>👥 Match Management</h2>
      <!-- Additional match management features can be added here -->
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['route-guard', 'language-check', 'security-middleware'],
  layout: 'default'
})

import { ref, onMounted } from 'vue'

const requests = ref([])
const selected = ref({})
const reasons = ref({})

onMounted(async () => {
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
})

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
      // Remove approved request from list
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
      // Remove rejected request from list
      requests.value = requests.value.filter(r => r.userId !== userId)
    }
  } catch (error) {
    console.error('Failed to reject filters:', error)
  }
}
</script>

<style scoped>
.matches-page {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.filter-section,
.match-management-section {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.filter-section h2,
.match-management-section h2 {
  margin-bottom: 1.5rem;
  color: #1f2937;
  font-size: 1.5rem;
}

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

.btn {
  flex: 1;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
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

.empty-state {
  text-align: center;
  padding: 3rem 2rem;
  color: #6b7280;
}

@media (max-width: 768px) {
  .matches-page {
    padding: 1rem;
  }

  .filter-section,
  .match-management-section {
    padding: 1rem;
  }

  .action-buttons {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
}
</style>
