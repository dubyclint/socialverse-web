<template>
  <div class="admin-verified">
    <!-- Header Section -->
    <div class="admin-header">
      <div class="header-content">
        <h1 class="page-title">✅ Verified Badge Management</h1>
        <p class="page-description">Manage user verification status and badge assignments</p>
      </div>
      <div class="header-actions">
        <button @click="showBulkActions = !showBulkActions" class="btn-secondary">
          <Icon name="settings" />
          Bulk Actions
        </button>
        <button @click="exportVerifiedUsers" class="btn-primary">
          <Icon name="download" />
          Export List
        </button>
      </div>
    </div>

    <!-- Bulk Actions Panel -->
    <div v-if="showBulkActions" class="bulk-actions-panel">
      <div class="bulk-actions-content">
        <h3>Bulk Actions</h3>
        <div class="bulk-actions-buttons">
          <button @click="bulkVerify" class="btn-success" :disabled="selectedUsers.length === 0">
            Verify Selected ({{ selectedUsers.length }})
          </button>
          <button @click="bulkUnverify" class="btn-warning" :disabled="selectedUsers.length === 0">
            Unverify Selected ({{ selectedUsers.length }})
          </button>
          <button @click="bulkReject" class="btn-danger" :disabled="selectedUsers.length === 0">
            Reject Selected ({{ selectedUsers.length }})
          </button>
        </div>
      </div>
    </div>

    <!-- Stats Overview -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">✅</div>
        <div class="stat-content">
          <h3>Verified Users</h3>
          <p class="stat-value">{{ verifiedCount }}</p>
          <span class="stat-change positive">+{{ newVerificationsThisMonth }} this month</span>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">⏳</div>
        <div class="stat-content">
          <h3>Pending Requests</h3>
          <p class="stat-value">{{ pendingCount }}</p>
          <span class="stat-
            change neutral">{{ newRequestsToday }} new today</span>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">❌</div>
        <div class="stat-content">
          <h3>Rejected</h3>
          <p class="stat-value">{{ rejectedCount }}</p>
          <span class="stat-change negative">{{ rejectedThisWeek }} this week</span>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">📊</div>
        <div class="stat-content">
          <h3>Approval Rate</h3>
          <p class="stat-value">{{ approvalRate }}%</p>
          <span class="stat-change positive">+2.3% from last month</span>
        </div>
      </div>
    </div>

    <!-- Filters and Search -->
    <div class="filters-section">
      <div class="search-box">
        <input 
          v-model="searchQuery" 
          placeholder="Search by username, email, or reason..."
          class="search-input"
        />
      </div>
      <div class="filter-buttons">
        <button 
          @click="filterStatus = 'all'" 
          :class="['filter-btn', { active: filterStatus === 'all' }]"
        >
          All ({{ users.length }})
        </button>
        <button 
          @click="filterStatus = 'verified'" 
          :class="['filter-btn', { active: filterStatus === 'verified' }]"
        >
          Verified ({{ verifiedUsers.length }})
        </button>
        <button 
          @click="filterStatus = 'pending'" 
          :class="['filter-btn', { active: filterStatus === 'pending' }]"
        >
          Pending ({{ pendingUsers.length }})
        </button>
        <button 
          @click="filterStatus = 'rejected'" 
          :class="['filter-btn', { active: filterStatus === 'rejected' }]"
        >
          Rejected ({{ rejectedUsers.length }})
        </button>
      </div>
    </div>

    <!-- Users Table -->
    <div class="table-container">
      <table class="users-table">
        <thead>
          <tr>
            <th>
              <input 
                type="checkbox" 
                @change="toggleSelectAll"
                :checked="allSelected"
                class="form-checkbox"
              />
            </th>
            <th>User</th>
            <th>Status</th>
            <th>Request Date</th>
            <th>Verification Type</th>
            <th>Documents</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in filteredUsers" :key="user.id" class="user-row">
            <td>
              <input 
                type="checkbox" 
                :value="user.id"
                v-model="selectedUsers"
                class="form-checkbox"
              />
            </td>
            <td>
              <div class="user-info">
                <img 
                  :src="user.avatar || '/default-avatar.png'" 
                  :alt="user.username"
                  class="user-avatar"
                />
                <div class="user-details">
                  <div class="user-name">
                    {{ user.displayName || user.username }}
                    <span v-if="user.isVerified" class="verified-badge">✅</span>
                  </div>
                  <div class="user-email">{{ user.email }}</div>
                  <div class="user-username">@{{ user.username }}</div>
                </div>
              </div>
            </td>
            <td>
              <span :class="['status-badge', user.verificationStatus]">
                {{ formatStatus(user.verificationStatus) }}
              </span>
            </td>
            <td>
              <div class="date-info">
                <div>{{ formatDate(user.requestDate) }}</div>
                <div class="date-relative">{{ getRelativeTime(user.requestDate) }}</div>
              </div>
            </td>
            <td>
              <span class="verification-type">
                {{ user.verificationType || 'Standard' }}
              </span>
            </td>
            <td>
              <div class="documents-info">
                <button 
                  v-if="user.documents && user.documents.length > 0"
                  @click="viewDocuments(user)"
                  class="btn-sm btn-outline"
                >
                  View ({{ user.documents.length }})
                </button>
                <span v-else class="no-documents">No documents</span>
              </div>
            </td>
            <td>
              <div class="action-buttons">
                <button 
                  v-if="user.verificationStatus === 'pending'"
                  @click="approveUser(user)"
                  class="btn-sm btn-success"
                >
                  Approve
                </button>
                <button 
                  v-if="user.verificationStatus === 'pending'"
                  @click="rejectUser(user)"
                  class="btn-sm btn-danger"
                >
                  Reject
                </button>
                <button 
                  v-if="user.verificationStatus === 'verified'"
                  @click="revokeVerification(user)"
                  class="btn-sm btn-warning"
                >
                  Revoke
                </button>
                <button @click="viewUserDetails(user)" class="btn-sm btn-outline">
                  Details
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Empty State -->
      <div v-if="filteredUsers.length === 0" class="empty-state">
        <div class="empty-icon">✅</div>
        <h3>No users found</h3>
        <p>{{ searchQuery ? 'Try adjusting your search terms' : 'No verification requests match the current filter' }}</p>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="pagination">
      <button 
        @click="currentPage = Math.max(1, currentPage - 1)"
        :disabled="currentPage === 1"
        class="pagination-btn"
      >
        Previous
      </button>
      <span class="pagination-info">
        Page {{ currentPage }} of {{ totalPages }}
      </span>
      <button 
        @click="currentPage = Math.min(totalPages, currentPage + 1)"
        :disabled="currentPage === totalPages"
        class="pagination-btn"
      >
        Next
      </button>
    </div>

    <!-- Document Viewer Modal -->
    <div v-if="showDocumentModal" class="modal-overlay" @click="closeDocumentModal">
      <div class="modal-content document-modal" @click.stop>
        <div class="modal-header">
          <h3>Verification Documents - {{ selectedUser?.username }}</h3>
          <button @click="closeDocumentModal" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div v-if="selectedUser?.documents" class="documents-grid">
            <div 
              v-for="(doc, index) in selectedUser.documents" 
              :key="index"
              class="document-item"
            >
              <div class="document-preview">
                <img 
                  v-if="doc.type === 'image'"
                  :src="doc.url" 
                  :alt="doc.name"
                  class="document-image"
                />
                <div v-else class="document-file">
                  <Icon name="file" />
                  <span>{{ doc.name }}</span>
                </div>
              </div>
              <div class="document-info">
                <h4>{{ doc.name }}</h4>
                <p>{{ doc.description }}</p>
                <small>Uploaded: {{ formatDate(doc.uploadDate) }}</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- User Details Modal -->
    <div v-if="showUserModal" class="modal-overlay" @click="closeUserModal">
      <div class="modal-content user-modal" @click.stop>
        <div class="modal-header">
          <h3>User Details - {{ selectedUser?.username }}</h3>
          <button @click="closeUserModal" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div v-if="selectedUser" class="user-details-content">
            <div class="user-profile-section">
              <img 
                :src="selectedUser.avatar || '/default-avatar.png'" 
                :alt="selectedUser.username"
                class="profile-avatar"
              />
              <div class="profile-info">
                <h2>{{ selectedUser.displayName || selectedUser.username }}</h2>
                <p>@{{ selectedUser.username }}</p>
                <p>{{ selectedUser.email }}</p>
              </div>
            </div>
            
            <div class="verification-details">
              <h4>Verification Information</h4>
              <div class="detail-row">
                <span class="label">Status:</span>
                <span :class="['status-badge', selectedUser.verificationStatus]">
                  {{ formatStatus(selectedUser.verificationStatus) }}
                </span>
              </div>
              <div class="detail-row">
                <span class="label">Request Date:</span>
                <span>{{ formatDate(selectedUser.requestDate) }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Verification Type:</span>
                <span>{{ selectedUser.verificationType || 'Standard' }}</span>
              </div>
              <div v-if="selectedUser.reason" class="detail-row">
                <span class="label">Reason:</span>
                <span>{{ selectedUser.reason }}</span>
              </div>
            </div>

            <div class="user-stats">
              <h4>User Statistics</h4>
              <div class="stats-row">
                <div class="stat-item">
                  <span class="stat-label">Posts:</span>
                  <span class="stat-value">{{ selectedUser.postCount || 0 }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Followers:</span>
                  <span class="stat-value">{{ selectedUser.followerCount || 0 }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Following:</span>
                  <span class="stat-value">{{ selectedUser.followingCount || 0 }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Join Date:</span>
                  <span class="stat-value">{{ formatDate(selectedUser.joinDate) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <button 
            v-if="selectedUser?.verificationStatus === 'pending'"
            @click="approveUser(selectedUser)"
            class="btn-success"
          >
            Approve Verification
          </button>
          <button 
            v-if="selectedUser?.verificationStatus === 'pending'"
            @click="rejectUser(selectedUser)"
            class="btn-danger"
          >
            Reject Request
          </button>
          <button 
            v-if="selectedUser?.verificationStatus === 'verified'"
            @click="revokeVerification(selectedUser)"
            class="btn-warning"
          >
            Revoke Verification
          </button>
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

// Reactive data
const showBulkActions = ref(false)
const showDocumentModal = ref(false)
const showUserModal = ref(false)
const selectedUser = ref(null)
const selectedUsers = ref([])
const searchQuery = ref('')
const filterStatus = ref('all')
const currentPage = ref(1)
const itemsPerPage = 20

const users = ref([])

// Computed properties
const verifiedUsers = computed(() => 
  users.value.filter(user => user.verificationStatus === 'verified')
)

const pendingUsers = computed(() => 
  users.value.filter(user => user.verificationStatus === 'pending')
)

const rejectedUsers = computed(() => 
  users.value.filter(user => user.verificationStatus === 'rejected')
)

const verifiedCount = computed(() => verifiedUsers.value.length)
const pendingCount = computed(() => pendingUsers.value.length)
const rejectedCount = computed(() => rejectedUsers.value.length)

const approvalRate = computed(() => {
  const total = verifiedCount.value + rejectedCount.value
  return total > 0 ? Math.round((verifiedCount.value / total) * 100) : 0
})

const newVerificationsThisMonth = computed(() => {
  const thisMonth = new Date()
  thisMonth.setDate(1)
  return verifiedUsers.value.filter(user => 
    new Date(user.verificationDate) >= thisMonth
  ).length
})

const newRequestsToday = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return pendingUsers.value.filter(user => 
    new Date(user.requestDate) >= today
  ).length
})

const rejectedThisWeek = computed(() => {
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  return rejectedUsers.value.filter(user => 
    new Date(user.rejectionDate) >= weekAgo
  ).length
})

const filteredUsers = computed(() => {
  let filtered = users.value

  // Filter by status
  if (filterStatus.value !== 'all') {
    filtered = filtered.filter(user => user.verificationStatus === filterStatus.value)
  }

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(user => 
      user.username.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.displayName?.toLowerCase().includes(query) ||
      user.reason?.toLowerCase().includes(query)
    )
  }

  // Pagination
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filtered.slice(start, end)
})

const totalPages = computed(() => {
  let filtered = users.value
  if (filterStatus.value !== 'all') {
    filtered = filtered.filter(user => user.verificationStatus === filterStatus.value)
  }
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(user => 
      user.username.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.displayName?.toLowerCase().includes(query) ||
      user.reason?.toLowerCase().includes(query)
    )
  }
  return Math.ceil(filtered.length / itemsPerPage)
})

const allSelected = computed(() => 
  filteredUsers.value.length > 0 && 
  filteredUsers.value.every(user => selectedUsers.value.includes(user.id))
)

// Methods
const loadUsers = async () => {
  try {
    // Mock data - replace with actual API call
    users.value = [
      {
        id: 1,
        username: 'johndoe',
        displayName: 'John Doe',
        email: 'john@example.com',
        avatar: '/avatars/john.jpg',
        verificationStatus: 'verified',
        verificationType: 'Creator',
        requestDate: '2024-01-15T10:30:00Z',
        verificationDate: '2024-01-16T14:20:00Z',
        reason: 'Content creator with 50k+ followers',
        isVerified: true,
        postCount: 245,
        followerCount: 52000,
        followingCount: 1200,
        joinDate: '2023-06-15T09:00:00Z',
        documents: [
          {
            name: 'Government ID',
            type: 'image',
            url: '/documents/id1.jpg',
            description: 'Driver\'s license',
            uploadDate: '2024-01-15T10:30:00Z'
          }
        ]
      },
      {
        id: 2,
        username: 'janesmithofficial',
        displayName: 'Jane Smith',
        email: 'jane@example.com',
        avatar: '/avatars/jane.jpg',
        verificationStatus: 'pending',
        verificationType: 'Business',
        requestDate: '2024-01-20T16:45:00Z',
        reason: 'CEO of TechCorp Inc.',
        isVerified: false,
        postCount: 89,
        followerCount: 15000,
        followingCount: 500,
        joinDate: '2023-08-20T12:00:00Z',
        documents: [
          {
            name: 'Business License',
            type: 'image',
            url: '/documents/business1.jpg',
            description: 'Company registration',
            uploadDate: '2024-01-20T16:45:00Z'
          },
          {
            name: 'Tax Document',
            type: 'pdf',
            url: '/documents/tax1.pdf',
            description: 'Business tax filing',
            uploadDate: '2024-01-20T16:50:00Z'
          }
        ]
      },
      {
        id: 3,
        username: 'mikejohnson',
        displayName: 'Mike Johnson',
        email: 'mike@example.com',
        avatar: '/avatars/mike.jpg',
        verificationStatus: 'rejected',
        verificationType: 'Standard',
        requestDate: '2024-01-18T11:20:00Z',
        rejectionDate: '2024-01-19T09:15:00Z',
        reason: 'Public figure verification',
        isVerified: false,
        postCount: 34,
        followerCount: 2500,
        followingCount: 800,
        joinDate: '2023-12-01T15:30:00Z',
        documents: []
      }
    ]
  } catch (error) {
    console.error('Error loading users:', error)
  }
}

const approveUser = async (user) => {
  try {
    user.verificationStatus = 'verified'
    user.isVerified = true
    user.verificationDate = new Date().toISOString()
    selectedUsers.value = selectedUsers.value.filter(id => id !== user.id)
    // API call would go here
  } catch (error) {
    console.error('Error approving user:', error)
  }
}

const rejectUser = async (user) => {
  const reason = prompt('Reason for rejection (optional):')
  try {
    user.verificationStatus = 'rejected'
    user.isVerified = false
    user.rejectionDate = new Date().toISOString()
    user.rejectionReason = reason
    selectedUsers.value = selectedUsers.value.filter(id => id !== user.id)
    // API call would go here
  } catch (error) {
    console.error('Error rejecting user:', error)
  }
}

const revokeVerification = async (user) => {
  if (!confirm('Are you sure you want to revoke this user\'s verification?')) {
    return
  }
  
  try {
    user.verificationStatus = 'revoked'
    user.isVerified = false
    user.revocationDate = new Date().toISOString()
    // API call would go here
  } catch (error) {
    console.error('Error revoking verification:', error)
  }
}

const bulkVerify = async () => {
  if (!confirm(`Verify ${selectedUsers.value.length} selected users?`)) {
    return
  }
  
  try {
    for (const userId of selectedUsers.value) {
      const user = users.value.find(u => u.id === userId)
      if (user && user.verificationStatus === 'pending') {
        await approveUser(user)
      }
    }
    selectedUsers.value = []
  } catch (error) {
    console.error('Error bulk verifying users:', error)
  }
}

const bulkUnverify = async () => {
  if (!confirm(`Unverify ${selectedUsers.value.length} selected users?`)) {
    return
  }
  
  try {
    for (const userId of selectedUsers.value) {
      const user = users.value.find(u => u.id === userId)
      if (user && user.verificationStatus === 'verified') {
        await revokeVerification(user)
      }
    }
    selectedUsers.value = []
  } catch (error) {
    console.error('Error bulk unverifying users:', error)
  }
}

const bulkReject = async () => {
  const reason = prompt('Reason for bulk rejection:')
  if (!confirm(`Reject ${selectedUsers.value.length} selected users?`)) {
    return
  }
  
  try {
    for (const userId of selectedUsers.value) {
      const user = users.value.find(u => u.id === userId)
      if (user && user.verificationStatus === 'pending') {
        user.verificationStatus = 'rejected'
        user.isVerified = false
        user.rejectionDate = new Date().toISOString()
        user.rejectionReason = reason
      }
    }
    selectedUsers.value = []
  } catch (error) {
    console.error('Error bulk rejecting users:', error)
  }
}

const toggleSelectAll = () => {
  if (allSelected.value) {
    selectedUsers.value = []
  } else {
    selectedUsers.value = filteredUsers.value.map(user => user.id)
  }
}

const viewDocuments = (user) => {
  selectedUser.value = user
  showDocumentModal.value = true
}

const viewUserDetails = (user) => {
  selectedUser.value = user
  showUserModal.value = true
}

const closeDocumentModal = () => {
  showDocumentModal.value = false
  selectedUser.value = null
}

const closeUserModal = () => {
  showUserModal.value = false
  selectedUser.value = null
}

const exportVerifiedUsers = () => {
  // Implement export functionality
  console.log('Exporting verified users...')
}

const formatStatus = (status) => {
  const statusMap = {
    verified: 'Verified',
    pending: 'Pending',
    rejected: 'Rejected',
    revoked: 'Revoked'
  }
  return statusMap[status] || status
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString()
}

const getRelativeTime = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInHours = Math.floor((now - date) / (1000 * 60 * 60))
  
  if (diffInHours < 1) return 'Just now'
  if (diffInHours < 24) return `${diffInHours}h ago`
  if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
  return `${Math.floor(diffInHours / 168)}w ago`
}

// Lifecycle
onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.admin-verified {
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

.header-actions {
  display: flex;
  gap: 1rem;
}

.btn-primary, .btn-secondary {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

/* Bulk Actions Panel */
.bulk-actions-panel {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 2rem;
}

.bulk-actions-content h3 {
  margin: 0 0 1rem 0;
  color: #1f2937;
}

.bulk-actions-buttons {
  display: flex;
  gap: 1rem;
}

.btn-success {
  background: #10b981;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  border: none;
  cursor: pointer;
}

.btn-warning {
  background: #f59e0b;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  border: none;
  cursor: pointer;
}

.btn-danger {
  background: #ef4444;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  border: none;
  cursor: pointer;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
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
  margin: 0 0 0.25rem 0;
}

.stat-change {
  font-size: 0.75rem;
  font-weight: 500;
}

.stat-change.positive { color: #10b981; }
.stat-change.negative { color: #ef4444; }
.stat-change.neutral { color: #6b7280; }

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
  width: 400px;
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

/* Table */
.table-container {
  background: white;
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.users-table {
  width: 100%;
  border-collapse: collapse;
}

.users-table th,
.users-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.users-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.user-details {
  min-width: 0;
}

.user-name {
  font-weight: 600;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.verified-badge {
  font-size: 0.875rem;
}

.user-email,
.user-username {
  font-size: 0.875rem;
  color: #6b7280;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-badge.verified {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.pending {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.rejected {
  background: #fee2e2;
  color: #991b1b;
}

.status-badge.revoked {
  background: #f3f4f6;
  color: #374151;
}

.date-info {
  font-size: 0
.875rem;
}

.date-relative {
  color: #6b7280;
  font-size: 0.75rem;
}

.verification-type {
  background: #e0e7ff;
  color: #3730a3;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.documents-info .btn-sm {
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  border-radius: 0.375rem;
  border: 1px solid #d1d5db;
  background: white;
  cursor: pointer;
}

.no-documents {
  color: #6b7280;
  font-size: 0.875rem;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
  border-radius: 0.375rem;
  border: 1px solid #d1d5db;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-outline {
  background: white;
  color: #374151;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
}

.pagination-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 0.375rem;
  cursor: pointer;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  color: #6b7280;
}

/* Modals */
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
  max-width: 800px;
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

.modal-body {
  padding: 1.5rem;
}

.documents-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
}

.document-item {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  overflow: hidden;
}

.document-preview {
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9fafb;
}

.document-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.document-file {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: #6b7280;
}

.document-info {
  padding: 1rem;
}

.document-info h4 {
  margin: 0 0 0.5rem 0;
  color: #1f2937;
}

.document-info p {
  margin: 0 0 0.5rem 0;
  color: #6b7280;
}

.user-details-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.user-profile-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.profile-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
}

.profile-info h2 {
  margin: 0 0 0.5rem 0;
  color: #1f2937;
}

.profile-info p {
  margin: 0;
  color: #6b7280;
}

.verification-details,
.user-stats {
  border-top: 1px solid #e5e7eb;
  padding-top: 1rem;
}

.verification-details h4,
.user-stats h4 {
  margin: 0 0 1rem 0;
  color: #1f2937;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.label {
  font-weight: 500;
  color: #374151;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.stat-item {
  display: flex;
  justify-content: space-between;
}

.stat-label {
  color: #6b7280;
}

.stat-value {
  font-weight: 600;
  color: #1f2937;
}

.modal-actions {
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
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
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .users-table {
    font-size: 0.875rem;
  }
  
  .user-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .modal-content {
    width: 95%;
    margin: 1rem;
  }
  
  .user-profile-section {
    flex-direction: column;
    text-align: center;
  }
  
  .stats-row {
    grid-template-columns: 1fr;
  }
}
</style>
