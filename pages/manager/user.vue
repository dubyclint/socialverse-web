<template>
  <div class="manager-users">
    <!-- Header Section -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">👥 User Management</h1>
        <p class="page-description">View and moderate users in your assigned areas</p>
      </div>
      <div class="header-actions">
        <div class="search-box">
          <Icon name="search" />
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Search users..."
            @input="debouncedSearch"
          />
        </div>
        <select v-model="statusFilter" @change="fetchUsers" class="filter-select">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="banned">Banned</option>
        </select>
      </div>
    </div>

    <!-- Users Table -->
    <div class="users-table-container">
      <table class="users-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Role</th>
            <th>Status</th>
            <th>Joined</th>
            <th>Last Active</th>
            <th>Reports</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id" class="user-row">
            <td class="user-info">
              <div class="user-avatar">
                <img :src="user.avatar_url || '/default-avatar.png'" :alt="user.full_name" />
              </div>
              <div class="user-details">
                <div class="user-name">{{ user.full_name || user.username }}</div>
                <div class="user-email">{{ user.email }}</div>
              </div>
            </td>
            <td>
              <span class="role-badge" :class="user.role">
                {{ user.role }}
              </span>
            </td>
            <td>
              <span class="status-badge" :class="user.status">
                {{ user.status }}
              </span>
            </td>
            <td class="date-cell">
              {{ formatDate(user.created_at) }}
            </td>
            <td class="date-cell">
              {{ formatDate(user.last_login) }}
            </td>
            <td class="reports-cell">
              <span class="reports-count" :class="{ 'has-reports': user.reports_count > 0 }">
                {{ user.reports_count || 0 }}
              </span>
            </td>
            <td class="actions-cell">
              <div class="action-buttons">
                <button 
                  @click="viewUserDetails(user)" 
                  class="btn-action view"
                  title="View Details"
                >
                  <Icon name="eye" />
                </button>
                <button 
                  v-if="user.status === 'active'" 
                  @click="suspendUser(user)" 
                  class="btn-action suspend"
                  title="Suspend User"
                >
                  <Icon name="pause" />
                </button>
                <button 
                  v-if="user.status === 'suspended'" 
                  @click="activateUser(user)" 
                  class="btn-action activate"
                  title="Activate User"
                >
                  <Icon name="play" />
                </button>
                <button 
                  @click="sendWarning(user)" 
                  class="btn-action warning"
                  title="Send Warning"
                >
                  <Icon name="alert-triangle" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="pagination">
      <button 
        @click="currentPage--" 
        :disabled="currentPage <= 1"
        class="pagination-btn"
      >
        Previous
      </button>
      <span class="pagination-info">
        Page {{ currentPage }} of {{ totalPages }}
      </span>
      <button 
        @click="currentPage++" 
        :disabled="currentPage >= totalPages"
        class="pagination-btn"
      >
        Next
      </button>
    </div>

    <!-- User Details Modal -->
    <div v-if="selectedUser" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>User Details</h3>
          <button @click="closeModal" class="close-btn">&times;</button>
        </div>
        
        <div class="user-details-content">
          <div class="user-profile">
            <img :src="selectedUser.avatar_url || '/default-avatar.png'" :alt="selectedUser.full_name" />
            <div class="profile-info">
              <h4>{{ selectedUser.full_name || selectedUser.username }}</h4>
              <p>{{ selectedUser.email }}</p>
              <div class="profile-badges">
                <span class="role-badge" :class="selectedUser.role">{{ selectedUser.role }}</span>
                <span class="status-badge" :class="selectedUser.status">{{ selectedUser.status }}</span>
              </div>
            </div>
          </div>

          <div class="user-stats">
            <div class="stat-item">
              <label>Posts Created:</label>
              <span>{{ selectedUser.posts_count || 0 }}</span>
            </div>
            <div class="stat-item">
              <label>Reports Against:</label>
              <span>{{ selectedUser.reports_count || 0 }}</span>
            </div>
            <div class="stat-item">
              <label>Joined:</label>
              <span>{{ formatDate(selectedUser.created_at) }}</span>
            </div>
            <div class="stat-item">
              <label>Last Active:</label>
              <span>{{ formatDate(selectedUser.last_login) }}</span>
            </div>
          </div>

          <div class="moderation-actions">
            <h4>Moderation Actions</h4>
            <div class="action-buttons-modal">
              <button 
                v-if="selectedUser.status === 'active'" 
                @click="suspendUser(selectedUser)" 
                class="btn-modal suspend"
              >
                <Icon name="pause" />
                Suspend User
              </button>
              <button 
                v-if="selectedUser.status === 'suspended'" 
                @click="activateUser(selectedUser)" 
                class="btn-modal activate"
              >
                <Icon name="play" />
                Activate User
              </button>
              <button 
                @click="sendWarning(selectedUser)" 
                class="btn-modal warning"
              >
                <Icon name="alert-triangle" />
                Send Warning
              </button>
              <button 
                @click="viewUserPosts(selectedUser)" 
                class="btn-modal view-posts"
              >
                <Icon name="file-text" />
                View Posts
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Action Confirmation Modal -->
    <div v-if="showConfirmation" class="modal-overlay" @click="cancelAction">
      <div class="modal-content confirmation-modal" @click.stop>
        <div class="modal-header">
          <h3>{{ confirmationTitle }}</h3>
        </div>
        <div class="confirmation-content">
          <p>{{ confirmationMessage }}</p>
          <div class="confirmation-actions">
            <button @click="cancelAction" class="btn-cancel">Cancel</button>
            <button @click="confirmAction" class="btn-confirm">Confirm</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['route-guard', 'language-check', 'security-middleware'],
  layout: 'manager'
})
  
const { requirePermission } = useRBAC()
const authStore = useAuthStore()
const supabase = useSupabaseClient()

// Check manager permissions
requirePermission('users.view')

// Reactive data
const users = ref([])
const loading = ref(false)
const searchQuery = ref('')
const statusFilter = ref('')
const currentPage = ref(1)
const totalPages = ref(1)
const pageSize = 20

const selectedUser = ref(null)
const showConfirmation = ref(false)
const confirmationTitle = ref('')
const confirmationMessage = ref('')
const pendingAction = ref(null)

// Fetch users with filters and pagination
const fetchUsers = async () => {
  try {
    loading.value = true
    
    let query = supabase
  .from('profiles')
  .select(`
    *,
    posts:posts(count),
    reports:reports!reported_user_id(count)
  `)
  .range((currentPage.value - 1) * pageSize, currentPage.value * pageSize - 1)
  .order('created_at', { ascending: false })

    // Apply filters
    if (statusFilter.value) {
      query = query.eq('status', statusFilter.value)
    }

    if (searchQuery.value) {
      query = query.or(`full_name.ilike.%${searchQuery.value}%,email.ilike.%${searchQuery.value}%,username.ilike.%${searchQuery.value}%`)
    }

    const { data, error, count } = await query

    if (error) throw error

    // Process the data to include counts
    users.value = data.map(user => ({
      ...user,
      posts_count: user.posts?.[0]?.count || 0,
      reports_count: user.reports?.[0]?.count || 0
    }))

    totalPages.value = Math.ceil(count / pageSize)

  } catch (error) {
    console.error('Users fetch error:', error)
  } finally {
    loading.value = false
  }
}

// Debounced search
const debouncedSearch = debounce(() => {
  currentPage.value = 1
  fetchUsers()
}, 300)

// User actions
const viewUserDetails = (user) => {
  selectedUser.value = user
}

const closeModal = () => {
  selectedUser.value = null
  showConfirmation.value = false
  pendingAction.value = null
}

const suspendUser = (user) => {
  confirmationTitle.value = 'Suspend User'
  confirmationMessage.value = `Are you sure you want to suspend ${user.full_name || user.username}? They will not be able to access the platform.`
  pendingAction.value = { action: 'suspend', user }
  showConfirmation.value = true
}

const activateUser = (user) => {
  confirmationTitle.value = 'Activate User'
  confirmationMessage.value = `Are you sure you want to activate ${user.full_name || user.username}? They will regain access to the platform.`
  pendingAction.value = { action: 'activate', user }
  showConfirmation.value = true
}

const sendWarning = (user) => {
  confirmationTitle.value = 'Send Warning'
  confirmationMessage.value = `Send a warning message to ${user.full_name || user.username}?`
  pendingAction.value = { action: 'warning', user }
  showConfirmation.value = true
}

const confirmAction = async () => {
  if (!pendingAction.value) return

  const { action, user } = pendingAction.value

  try {
    switch (action) {
      case 'suspend':
        await updateUserStatus(user.id, 'suspended')
        await logModerationAction('user_suspended', user.id, { reason: 'Manager action' })
        break
      case 'activate':
        await updateUserStatus(user.id, 'active')
        await logModerationAction('user_activated', user.id, { reason: 'Manager action' })
        break
      case 'warning':
        await sendUserWarning(user.id)
        await logModerationAction('warning_sent', user.id, { reason: 'Manager warning' })
        break
    }

    // Refresh users list
    await fetchUsers()
    
    // Close modals
    closeModal()

  } catch (error) {
    console.error('Action error:', error)
  }
}

const cancelAction = () => {
  showConfirmation.value = false
  pendingAction.value = null
}

// Helper functions
const updateUserStatus = async (userId, status) => {
  const { error } = await supabase
    .from('profiles')
    .update({ 
      status, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', userId)

  if (error) throw error
}

const sendUserWarning = async (userId) => {
  // Implementation for sending warning notification
  const { error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      type: 'warning',
      title: 'Account Warning',
      message: 'Your account has received a warning from our moderation team. Please review our community guidelines.',
      created_by: authStore.profile.id
    })

  if (error) throw error
}

const logModerationAction = async (action, userId, details) => {
  await authStore.logAuditAction(action, 'user', userId, details)
}

const viewUserPosts = (user) => {
  navigateTo(`/manager/posts?user=${user.id}`)
}

const formatDate = (dateString) => {
  if (!dateString) return 'Never'
  return new Date(dateString).toLocaleDateString()
}

// Utility function for debouncing
function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Watch for page changes
watch(currentPage, fetchUsers)

// Lifecycle
onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
.manager-users {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e5e7eb;
}

.page-title {
  font-size: 2.5rem;
  font-weight: bold;
  color: #1f2937;
  margin: 0;
}

.page-description {
  color: #6b7280;
  margin: 0.5rem 0 0 0;
}

.header-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-box input {
  padding: 0.5rem 0.5rem 0.5rem 2.5rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  width: 300px;
}

.search-box svg {
  position: absolute;
  left: 0.75rem;
  color: #6b7280;
  width: 16px;
  height: 16px;
}

.filter-select {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: white;
}

.users-table-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  overflow: hidden;
  margin-bottom: 2rem;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
}

.users-table th {
  background: #f9fafb;
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
}

.users-table td {
  padding: 1rem;
  border-bottom: 1px solid #f3f4f6;
}

.user-row:hover {
  background: #f9fafb;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-avatar img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.user-name {
  font-weight: 600;
  color: #1f2937;
}

.user-email {
  font-size: 0.875rem;
  color: #6b7280;
}

.role-badge, .status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.role-badge.admin {
  background: #fef3c7;
  color: #d97706;
}

.role-badge.manager {
  background: #dbeafe;
  color: #3b82f6;
}

.role-badge.user {
  background: #e5e7eb;
  color: #374151;
}

.status-badge.active {
  background: #d1fae5;
  color: #059669;
}

.status-badge.suspended {
  background: #fef3c7;
  color: #d97706;
}

.status-badge.banned {
  background: #fee2e2;
  color: #dc2626;
}

.date-cell {
  color: #6b7280;
  font-size: 0.875rem;
}

.reports-count {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  background: #f3f4f6;
  color: #6b7280;
  font-size: 0.875rem;
}

.reports-count.has-reports {
  background: #fee2e2;
  color: #dc2626;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.btn-action {
  padding: 0.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-action.view {
  background: #e0f2fe;
  color: #0369a1;
}

.btn-action.suspend {
  background: #fef3c7;
  color: #d97706;
}

.btn-action.activate {
  background: #d1fae5;
  color: #059669;
}

.btn-action.warning {
  background: #fee2e2;
  color: #dc2626;
}

.btn-action:hover {
  transform: scale(1.05);
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
}

.pagination-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background: #f3f4f6;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  color: #6b7280;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 600px;
  width: 90%;
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

.user-details-content {
  padding: 1.5rem;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.user-profile img {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
}

.profile-badges {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.user-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 8px;
}

.stat-item label {
  font-weight: 600;
  color: #374151;
}

.action-buttons-modal {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.btn-modal {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-modal.suspend {
  background: #fef3c7;
  color: #d97706;
}

.btn-modal.activate {
  background: #d1fae5;
  color: #059669;
}

.btn-modal.warning {
  background: #fee2e2;
  color: #dc2626;
}

.btn-modal.view-posts {
  background: #e0f2fe;
  color: #0369a1;
}

.confirmation-modal {
  max-width: 400px;
}

.confirmation-content {
  padding: 1.5rem;
  text-align: center;
}

.confirmation-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1.5rem;
}

.btn-cancel, .btn-confirm {
  padding: 0.5rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.btn-cancel {
  background: #f3f4f6;
  color: #374151;
}

.btn-confirm {
  background: #dc2626;
  color: white;
}
</style>
