<template>
  <div class="admin-managers">
    <div class="page-header">
      <h1>Manager Assignment</h1>
      <button @click="showAssignModal = true" class="btn btn-primary">
        Assign New Manager
      </button>
    </div>

    <div class="managers-section">
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
                <Icon :name="getActivityIcon(action.type)" />
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

<script setup>
import { ref, onMounted } from 'vue'
import { debounce } from 'lodash-es'

definePageMeta({
  middleware: 'admin-auth'
})

const managers = ref([])
const showAssignModal = ref(false)
const showActivityModal = ref(false)
const userSearchQuery = ref('')
const searchResults = ref([])
const selectedUser = ref(null)
const selectedManager = ref(null)
const managerActivity = ref({})
const selectedPermissions = ref([])

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

onMounted(async () => {
  await loadManagers()
})

const loadManagers = async () => {
  try {
    const { data } = await $fetch('/api/admin/managers')
    managers.value = data
  } catch (error) {
    console.error('Failed to load managers:', error)
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
  selectedPermissions.value = ['manage_users', 'handle_reports'] // Default permissions
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
    'user_suspended': 'user-x',
    'user_warned': 'alert-triangle',
    'content_removed': 'trash-2',
    'report_resolved': 'check-circle'
  }
  return icons[type] || 'activity'
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString()
}

const formatDateTime = (date) => {
  return new Date(date).toLocaleString()
}
</script>

<style scoped>
.admin-managers {
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

.managers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.manager-card {
  background: white;
  padding
