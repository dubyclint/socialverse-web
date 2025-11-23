<template>
  <div class="admin-users">
    <div class="page-header">
      <h1>👥 User Management</h1>
      <div class="header-actions">
        <button @click="showAssignModal = true" class="btn btn-primary">
          Assign Manager Role
        </button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs-navigation">
      <button 
        @click="activeTab = 'managers'" 
        :class="['tab-btn', { active: activeTab === 'managers' }]"
      >
        🔑 Managers
      </button>
      <button 
        @click="activeTab = 'users'" 
        :class="['tab-btn', { active: activeTab === 'users' }]"
      >
        👤 All Users
      </button>
    </div>

    <!-- Managers Section -->
    <div v-show="activeTab === 'managers'" class="managers-section">
      <h2>Current Managers</h2>
      <div class="managers-grid">
        <div v-for="manager in managers" :key="manager.id" class="manager-card">
          <img :src="manager.avatar" :alt="manager.name" class="manager-avatar" />
          <div class="manager-info">
            <h3>{{ manager.name }}</h3>
            <p>@{{ manager.username }}</p>
            <p class="manager-email">{{ manager.email }}</p>
            <p class="assignment-date">Assigned: {{ formatDate(manager.assignedAt) }}</p>
          </div>
          <div class="manager-actions">
            <button @click="viewManagerActivity(manager)" class="btn btn-sm btn-outline">
              View Activity
            </button>
            <button @click="removeManager(manager)" class="btn btn-sm btn-danger">
              Remove
            </button>
          </div>
        </div>
      </div>

      <div v-if="managers.length === 0" class="empty-state">
        <p>No managers assigned yet</p>
      </div>
    </div>

    <!-- Users Section -->
    <div v-show="activeTab === 'users'" class="users-section">
      <h2>All Users</h2>
      <div class="users-controls">
        <input 
          v-model="userSearchQuery" 
          type="text" 
          placeholder="Search users..."
          class="search-input"
        />
      </div>
      
      <div class="users-list">
        <div v-for="user in filteredUsers" :key="user.id" class="user-row">
          <img :src="user.avatar" :alt="user.name" class="user-avatar-small" />
          <div class="user-details">
            <p class="user-name">{{ user.name }}</p>
            <p class="user-email">{{ user.email }}</p>
          </div>
          <div class="user-actions">
            <button @click="selectUserForManager(user)" class="btn btn-sm btn-primary">
              Make Manager
            </button>
          </div>
        </div>
      </div>

      <div v-if="filteredUsers.length === 0" class="empty-state">
        <p>No users found</p>
      </div>
    </div>

    <!-- Assign Manager Modal -->
    <div v-if="showAssignModal" class="modal-overlay" @click="closeAssignModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Assign Manager Role</h2>
          <button @click="closeAssignModal" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="search-section">
            <input
              v-model="userSearchQuery"
              type="text"
              placeholder="Search users by name, username, or email..."
              class="search-input"
              @input="searchUsers"
            />
          </div>
          
          <div v-if="searchResults.length > 0" class="search-results">
            <div
              v-for="user in searchResults"
              :key="user.id"
              class="user-result"
              @click="selectUser(user)"
              :class="{ selected: selectedUser?.id === user.id }"
            >
              <img :src="user.avatar" :alt="user.name" class="user-avatar" />
              <div class="user-info">
                <p class="user-name">{{ user.name }}</p>
                <p class="user-username">@{{ user.username }}</p>
                <p class="user-email">{{ user.email }}</p>
              </div>
            </div>
          </div>

          <div v-if="selectedUser" class="selected-user-section">
            <h3>Selected User</h3>
            <div class="selected-user">
              <img :src="selectedUser.avatar" :alt="selectedUser.name" class="user-avatar" />
              <div class="user-info">
                <p class="user-name">{{ selectedUser.name }}</p>
                <p class="user-username">@{{ selectedUser.username }}</p>
                <p class="user-email">{{ selectedUser.email }}</p>
              </div>
            </div>
            
            <div class="permissions-section">
              <h4>Manager Permissions</h4>
              <div class="permission-checkboxes">
                <label v-for="permission in availablePermissions" :key="permission.key">
                  <input
                    type="checkbox"
                    v-model="selectedPermissions"
                    :value="permission.key"
                  />
                  {{ permission.label }}
                  <span class="permission-description">{{ permission.description }}</span>
                </label>
              </div>
            </div>

            <div class="modal-actions">
              <button @click="assignManager" class="btn btn-primary" :disabled="selectedPermissions.length === 0">
                Assign Manager Role
              </button>
              <button @click="closeAssignModal" class="btn btn-outline">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Manager Activity Modal -->
    <div v-if="showActivityModal" class="modal-overlay" @click="closeActivityModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ selectedManager?.name }} - Activity Log</h2>
          <button @click="closeActivityModal" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="activity-stats">
            <div class="stat-card">
              <h4>Actions This Month</h4>
              <p class="stat-number">{{ managerActivity.actionsThisMonth }}</p>
            </div>
            <div class="stat-card">
              <h4>Users Managed</h4>
              <p class="stat-number">{{ managerActivity.usersManaged }}</p>
            </div>
            <div class="stat-card">
              <h4>Reports Resolved</h4>
              <p class="stat-number">{{ managerActivity.reportsResolved }}</p>
            </div>
          </div>

          <div class="activity-log">
            <h4>Recent Actions</h4>
            <div v-for="action in managerActivity.recentActions" :key="action.id" class="activity-item">
              <div class="activity-icon">
                {{ getActivityIcon(action.type) }}
              </div>
              <div class="activity-details">
                <p class="activity-description">{{ action.description }}</p>
                <p class="activity-target">Target: {{ action.targetUser }}</p>
                <p class="activity-time">{{ formatDateTime(action.timestamp) }}</p>
              </div>
            </div>
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

import { ref, computed, onMounted } from 'vue'
import { debounce } from 'lodash-es'

// Tab Management
const activeTab = ref('managers')

// Managers State
const managers = ref([])
const showAssignModal = ref(false)
const showActivityModal = ref(false)
const userSearchQuery = ref('')
const searchResults = ref([])
const selectedUser = ref(null)
const selectedManager = ref(null)
const managerActivity = ref({})
const selectedPermissions = ref([])

// Users State
const allUsers = ref([])

const availablePermissions = [
  {
    key: 'manage_users',
    label: 'Manage Users',
    description: 'Suspend, warn, and manage user accounts'
  },
  {
    key: 'moderate_content',
    label: 'Moderate Content',
    description: 'Remove posts, comments, and other content'
  },
  {
    key: 'handle_reports',
    label: 'Handle Reports',
    description: 'Review and resolve user reports'
  },
  {
    key: 'view_analytics',
    label: 'View Analytics',
    description: 'Access platform analytics and insights'
  }
]

const filteredUsers = computed(() => {
  if (!userSearchQuery.value) return allUsers.value
  
  const query = userSearchQuery.value.toLowerCase()
  return allUsers.value.filter(user =>
    user.name.toLowerCase().includes(query) ||
    user.email.toLowerCase().includes(query) ||
    user.username?.toLowerCase().includes(query)
  )
})

onMounted(async () => {
  await loadManagers()
  await loadAllUsers()
})

const loadManagers = async () => {
  try {
    const { data } = await $fetch('/api/admin/managers')
    managers.value = data
  } catch (error) {
    console.error('Failed to load managers:', error)
  }
}

const loadAllUsers = async () => {
  try {
    const { data } = await $fetch('/api/admin/users')
    allUsers.value = data
  } catch (error) {
    console.error('Failed to load users:', error)
  }
}

const searchUsers = debounce(async () => {
  if (userSearchQuery.value.length < 2) {
    searchResults.value = []
    return
  }

  try {
    const { data } = await $fetch('/api/admin/users/search', {
      query: { q: userSearchQuery.value }
    })
    searchResults.value = data.filter(user => 
      !managers.value.some(manager => manager.id === user.id)
    )
  } catch (error) {
    console.error('Failed to search users:', error)
  }
}, 300)

const selectUser = (user) => {
  selectedUser.value = user
  selectedPermissions.value = ['manage_users', 'handle_reports']
}

const selectUserForManager = (user) => {
  selectedUser.value = user
  selectedPermissions.value = ['manage_users', 'handle_reports']
  showAssignModal.value = true
}

const assignManager = async () => {
  try {
    await $fetch('/api/admin/managers', {
      method: 'POST',
      body: {
        userId: selectedUser.value.id,
        permissions: selectedPermissions.value
      }
    })
    
    await loadManagers()
    closeAssignModal()
  } catch (error) {
    console.error('Failed to assign manager:', error)
  }
}

const removeManager = async (manager) => {
  if (confirm(`Are you sure you want to remove ${manager.name} as a manager?`)) {
    try {
      await $fetch(`/api/admin/managers/${manager.id}`, {
        method: 'DELETE'
      })
      await loadManagers()
    } catch (error) {
      console.error('Failed to remove manager:', error)
    }
  }
}

const viewManagerActivity = async (manager) => {
  try {
    const { data } = await $fetch(`/api/admin/managers/${manager.id}/activity`)
    selectedManager.value = manager
    managerActivity.value = data
    showActivityModal.value = true
  } catch (error) {
    console.error('Failed to load manager activity:', error)
  }
}

const closeAssignModal = () => {
  showAssignModal.value = false
  selectedUser.value = null
  selectedPermissions.value = []
  searchResults.value = []
  userSearchQuery.value = ''
}

const closeActivityModal = () => {
  showActivityModal.value = false
  selectedManager.value = null
  managerActivity.value = {}
}

const getActivityIcon = (type) => {
  const icons = {
    'user_suspended': '🚫',
    'user_warned': '⚠️',
    'content_removed': '🗑️',
    'report_resolved': '✅'
  }
  return icons[type] || '📋'
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString()
}

const formatDateTime = (date) => {
  return new Date(date).toLocaleString()
}
</script>

<style scoped>
.admin-users {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.page-header h1 {
  margin: 0;
  color: #1f2937;
  font-size: 1.75rem;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

/* Tabs */
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

/* Managers Section */
.managers-section {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.managers-section h2 {
  margin: 0 0 1.5rem 0;
  color: #1f2937;
}

.managers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.manager-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.manager-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  align-self: center;
  object-fit: cover;
}

.manager-info {
  text-align: center;
}

.manager-info h3 {
  margin-bottom: 0.5rem;
  font-size: 1.2rem;
  color: #1f2937;
}

.manager-info p {
  margin: 0.25rem 0;
  color: #6b7280;
  font-size: 0.9rem;
}

.manager-email {
  color: #666;
}

.assignment-date {
  color: #888;
  font-size: 0.8rem;
  margin-top: 0.5rem;
}

.manager-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

/* Users Section */
.users-section {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.users-section h2 {
  margin: 0 0 1.5rem 0;
  color: #1f2937;
}

.users-controls {
  margin-bottom: 1.5rem;
}

.search-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 1rem;
}

.users-list {
  display: grid;
  gap: 1rem;
}

.user-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.user-avatar-small {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.user-details {
  flex: 1;
}

.user-name {
  margin: 0;
  font-weight: 600;
  color: #1f2937;
}

.user-email {
  margin: 0.25rem 0 0 0;
  font-size: 0.9rem;
  color: #6b7280;
}

.user-actions {
  display: flex;
  gap: 0.5rem;
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
  border-radius: 8px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #eee;
}

.modal-header h2 {
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

.search-section {
  margin-bottom: 1.5rem;
}

.search-results {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #eee;
  border-radius: 4px;
  margin-bottom: 1.5rem;
}

.user-result {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  cursor: pointer;
  border-bottom: 1px solid #f5f5f5;
  transition: background 0.2s;
}

.user-result:hover {
  background: #f8f9fa;
}

.user-result.selected {
  background: #e3f2fd;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.user-info {
  flex: 1;
}

.user-username {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
}

.selected-user-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #eee;
}

.selected-user-section h3 {
  margin: 0 0 1rem 0;
  color: #1f2937;
}

.selected-user {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 4px;
  margin-bottom: 1.5rem;
}

.permissions-section {
  margin-bottom: 2rem;
}

.permissions-section h4 {
  margin: 0 0 1rem 0;
  color: #1f2937;
}

.permission-checkboxes {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.permission-checkboxes label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  cursor: pointer;
}

.permission-checkboxes input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.permission-description {
  font-size: 0.8rem;
  color: #666;
  margin-left: 1.5rem;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

/* Buttons */
.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover {
  background: #0056b3;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-outline {
  background: transparent;
  border: 1px solid #ddd;
  color: #333;
}

.btn-outline:hover {
  background: #f8f9fa;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover {
  background: #c82333;
}

.btn-sm {
  padding: 0.25rem 0.75rem;
  font-size: 0.8rem;
}

/* Activity Stats */
.activity-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  text-align: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 4px;
}

.stat-card h4 {
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  color: #666;
}

.stat-number {
  font-size: 2rem;
  font-weight: bold;
  color: #333;
  margin: 0;
}

.activity-log {
  max-height: 300px;
  overflow-y: auto;
}

.activity-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem 0;
  border-bottom: 1px solid #f5f5f5;
}

.activity-icon {
  font-size: 1.5rem;
  margin-top: 0.25rem;
}

.activity-details {
  flex: 1;
}

.activity-description {
  font-weight: 500;
  margin-bottom: 0.25rem;
  color: #1f2937;
}

.activity-target {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
}

.activity-time {
  color: #888;
  font-size: 0.8rem;
}

.empty-state {
  text-align: center;
  padding: 3rem 2rem;
  color: #6b7280;
}

@media (max-width: 768px) {
  .admin-users {
    padding: 1rem;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .managers-grid {
    grid-template-columns: 1fr;
  }

  .modal-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }

  .activity-stats {
    grid-template-columns: 1fr;
  }
}
</style>
