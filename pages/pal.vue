<!-- FILE: /pages/pal.vue - PAL (PERSONAL ASSISTANT/FRIEND) PAGE -->
<!-- Protected route - requires authentication -->

<template>
  <div class="pal-container">
    <!-- Page Header -->
    <div class="page-header">
      <h1>👥 My PALs</h1>
      <p class="subtitle">Connect with your Personal Assistants and Friends</p>
    </div>

    <!-- PAL Stats -->
    <div class="pal-stats">
      <div class="stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-content">
          <p class="stat-label">Total PALs</p>
          <h3 class="stat-value">{{ totalPals }}</h3>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">⭐</div>
        <div class="stat-content">
          <p class="stat-label">Active PALs</p>
          <h3 class="stat-value">{{ activePals }}</h3>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">💬</div>
        <div class="stat-content">
          <p class="stat-label">Pending Requests</p>
          <h3 class="stat-value">{{ pendingRequests }}</h3>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">🎁</div>
        <div class="stat-content">
          <p class="stat-label">Gifts Sent</p>
          <h3 class="stat-value">{{ giftsSent }}</h3>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="pal-actions">
      <button class="btn btn-primary" @click="showFindPalModal = true">
        <span>🔍</span> Find PALs
      </button>
      <button class="btn btn-secondary" @click="showInviteModal = true">
        <span>📧</span> Invite Friends
      </button>
      <button class="btn btn-tertiary" @click="showRequestsModal = true">
        <span>📬</span> View Requests ({{ pendingRequests }})
      </button>
    </div>

    <!-- Tabs -->
    <div class="pal-tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab"
        :class="['tab-button', { active: activeTab === tab }]"
        @click="activeTab = tab"
      >
        {{ tab }}
      </button>
    </div>

    <!-- My PALs -->
    <div v-if="activeTab === 'My PALs'" class="pal-section">
      <h3>👥 My PALs</h3>
      
      <!-- Search and Filter -->
      <div class="pal-filters">
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Search PALs..."
          class="search-input"
        />
        <select v-model="filterStatus" class="filter-select">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="blocked">Blocked</option>
        </select>
      </div>

      <div v-if="filteredPals.length > 0" class="pals-grid">
        <div v-for="pal in filteredPals" :key="pal.id" class="pal-card">
          <!-- Avatar -->
          <div class="pal-avatar">
            <img :src="pal.avatar" :alt="pal.name" class="avatar-img" />
            <div class="status-indicator" :class="pal.status"></div>
          </div>

          <!-- PAL Info -->
          <div class="pal-info">
            <h4 class="pal-name">{{ pal.name }}</h4>
            <p class="pal-username">@{{ pal.username }}</p>
            <p class="pal-bio">{{ pal.bio }}</p>
            
            <!-- Stats -->
            <div class="pal-mini-stats">
              <span class="mini-stat">
                <span class="icon">💬</span>
                {{ pal.messages }} messages
              </span>
              <span class="mini-stat">
                <span class="icon">🎁</span>
                {{ pal.gifts }} gifts
              </span>
            </div>
          </div>

          <!-- PAL Actions -->
          <div class="pal-card-actions">
            <button class="btn-icon" @click="messagePal(pal.id)" title="Message">
              💬
            </button>
            <button class="btn-icon" @click="sendGift(pal.id)" title="Send Gift">
              🎁
            </button>
            <button class="btn-icon" @click="viewProfile(pal.id)" title="View Profile">
              👁️
            </button>
            <button class="btn-icon btn-danger" @click="removePal(pal.id)" title="Remove">
              ❌
            </button>
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        <p>No PALs found. Start by finding or inviting friends!</p>
      </div>
    </div>

    <!-- Pending Requests -->
    <div v-if="activeTab === 'Requests'" class="pal-section">
      <h3>📬 Pending Requests</h3>
      
      <div v-if="pendingRequestsList.length > 0" class="requests-list">
        <div v-for="request in pendingRequestsList" :key="request.id" class="request-card">
          <div class="request-header">
            <div class="request-avatar">
              <img :src="request.avatar" :alt="request.name" class="avatar-img" />
            </div>
            <div class="request-info">
              <h4>{{ request.name }}</h4>
              <p>@{{ request.username }}</p>
              <p class="request-date">Requested {{ formatDate(request.requestedAt) }}</p>
            </div>
          </div>

          <p class="request-message">{{ request.message }}</p>

          <div class="request-actions">
            <button class="btn btn-primary" @click="acceptRequest(request.id)">
              ✅ Accept
            </button>
            <button class="btn btn-danger" @click="rejectRequest(request.id)">
              ❌ Reject
            </button>
            <button class="btn btn-secondary" @click="viewProfile(request.id)">
              👁️ View Profile
            </button>
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        <p>No pending requests</p>
      </div>
    </div>

    <!-- Suggested PALs -->
    <div v-if="activeTab === 'Suggestions'" class="pal-section">
      <h3>✨ Suggested PALs</h3>
      <p class="section-subtitle">Based on your interests and activity</p>

      <div v-if="suggestedPals.length > 0" class="pals-grid">
        <div v-for="pal in suggestedPals" :key="pal.id" class="pal-card suggested">
          <!-- Avatar -->
          <div class="pal-avatar">
            <img :src="pal.avatar" :alt="pal.name" class="avatar-img" />
            <div class="match-badge">{{ pal.matchPercentage }}% match</div>
          </div>

          <!-- PAL Info -->
          <div class="pal-info">
            <h4 class="pal-name">{{ pal.name }}</h4>
            <p class="pal-username">@{{ pal.username }}</p>
            <p class="pal-bio">{{ pal.bio }}</p>
            
            <!-- Common Interests -->
            <div class="common-interests">
              <span v-for="interest in pal.commonInterests" :key="interest" class="interest-tag">
                {{ interest }}
              </span>
            </div>
          </div>

          <!-- Suggested PAL Actions -->
          <div class="pal-card-actions">
            <button class="btn btn-primary" @click="sendPalRequest(pal.id)">
              ➕ Add PAL
            </button>
            <button class="btn btn-secondary" @click="viewProfile(pal.id)">
              👁️ View Profile
            </button>
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        <p>No suggestions available right now</p>
      </div>
    </div>

    <!-- PAL Groups -->
    <div v-if="activeTab === 'Groups'" class="pal-section">
      <h3>👨‍👩‍👧‍👦 PAL Groups</h3>

      <button class="btn btn-primary" @click="showCreateGroupModal = true" style="margin-bottom: 1.5rem;">
        <span>➕</span> Create Group
      </button>

      <div v-if="palGroups.length > 0" class="groups-list">
        <div v-for="group in palGroups" :key="group.id" class="group-card">
          <div class="group-header">
            <h4>{{ group.name }}</h4>
            <span class="group-size">{{ group.members.length }} members</span>
          </div>

          <p class="group-description">{{ group.description }}</p>

          <div class="group-members">
            <div v-for="member in group.members.slice(0, 5)" :key="member" class="member-avatar">
              <img :src="`https://api.dicebear.com/7.x/avataaars/svg?seed=${member}`" :alt="member" />
            </div>
            <div v-if="group.members.length > 5" class="member-more">
              +{{ group.members.length - 5 }}
            </div>
          </div>

          <div class="group-actions">
            <button class="btn btn-secondary" @click="viewGroup(group.id)">
              👁️ View Group
            </button>
            <button class="btn btn-secondary" @click="editGroup(group.id)">
              ✏️ Edit
            </button>
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        <p>No groups yet. Create one to organize your PALs!</p>
      </div>
    </div>

    <!-- Blocked PALs -->
    <div v-if="activeTab === 'Blocked'" class="pal-section">
      <h3>🚫 Blocked PALs</h3>

      <div v-if="blockedPals.length > 0" class="blocked-list">
        <div v-for="pal in blockedPals" :key="pal.id" class="blocked-card">
          <div class="blocked-info">
            <img :src="pal.avatar" :alt="pal.name" class="blocked-avatar" />
            <div>
              <h4>{{ pal.name }}</h4>
              <p>@{{ pal.username }}</p>
              <p class="blocked-date">Blocked {{ formatDate(pal.blockedAt) }}</p>
            </div>
          </div>

          <button class="btn btn-secondary" @click="unblockPal(pal.id)">
            🔓 Unblock
          </button>
        </div>
      </div>
      <div v-else class="empty-state">
        <p>No blocked PALs</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

definePageMeta({
  middleware: ['auth', 'language-check'],
  layout: 'default'
})

// State
const activeTab = ref('My PALs')
const searchQuery = ref('')
const filterStatus = ref('')
const showFindPalModal = ref(false)
const showInviteModal = ref(false)
const showRequestsModal = ref(false)
const showCreateGroupModal = ref(false)

// Tabs
const tabs = ['My PALs', 'Requests', 'Suggestions', 'Groups', 'Blocked']

// Stats
const totalPals = ref(24)
const activePals = ref(18)
const pendingRequests = ref(3)
const giftsSent = ref(42)

// My PALs
const myPals = ref([
  {
    id: 1,
    name: 'Alex Johnson',
    username: 'alexjohn',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex',
    bio: 'Tech enthusiast and gamer',
    status: 'active',
    messages: 156,
    gifts: 8
  },
  {
    id: 2,
    name: 'Sarah Smith',
    username: 'sarahsmith',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
    bio: 'Artist and designer',
    status: 'active',
    messages: 89,
    gifts: 5
  },
  {
    id: 3,
    name: 'Mike Chen',
    username: 'mikechen',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mike',
    bio: 'Entrepreneur and investor',
    status: 'inactive',
    messages: 45,
    gifts: 3
  },
  {
    id: 4,
    name: 'Emma Wilson',
    username: 'emmawilson',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emma',
    bio: 'Content creator',
    status: 'active',
    messages: 234,
    gifts: 12
  },
  {
    id: 5,
    name: 'David Brown',
    username: 'davidbrown',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=david',
    bio: 'Music producer',
    status: 'active',
    messages: 123,
    gifts: 7
  },
  {
    id: 6,
    name: 'Lisa Garcia',
    username: 'lisagarcia',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lisa',
    bio: 'Fitness coach',
    status: 'inactive',
    messages: 67,
    gifts: 4
  }
])

// Pending Requests
const pendingRequestsList = ref([
  {
    id: 101,
    name: 'John Doe',
    username: 'johndoe',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
    message: 'Hey! I love your content. Would love to connect!',
    requestedAt: new Date(Date.now() - 86400000)
  },
  {
    id: 102,
    name: 'Jessica Lee',
    username: 'jessicalee',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jessica',
    message: 'We have similar interests. Let\'s be PALs!',
    requestedAt: new Date(Date.now() - 172800000)
  },
  {
    id: 103,
    name: 'Tom Harris',
    username: 'tomharris',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tom',
    message: 'Mutual friend suggested we connect',
    requestedAt: new Date(Date.now() - 259200000)
  }
])

// Suggested PALs
const suggestedPals = ref([
  {
    id: 201,
    name: 'Rachel Green',
    username: 'rachelgreen',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rachel',
    bio: 'Fashion blogger and influencer',
    matchPercentage: 92,
    commonInterests: ['Fashion', 'Travel', 'Photography']
  },
  {
    id: 202,
    name: 'Chris Martin',
    username: 'chrismartin',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chris',
    bio: 'Software developer and tech writer',
    matchPercentage: 88,
    commonInterests: ['Technology', 'Gaming', 'Coding']
  },
  {
    id: 203,
    name: 'Nina Patel',
    username: 'ninapatel',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nina',
    bio: 'Yoga instructor and wellness coach',
    matchPercentage: 85,
    commonInterests: ['Fitness', 'Wellness', 'Meditation']
  }
])

// PAL Groups
const palGroups = ref([
  {
    id: 1,
    name: 'Tech Enthusiasts',
    description: 'A group for tech lovers to share ideas and projects',
    members: ['alex', 'chris', 'mike', 'david', 'sarah', 'emma'],
    createdAt: new Date(Date.now() - 604800000)
  },
  {
    id: 2,
    name: 'Creative Minds',
    description: 'Artists, designers, and creators sharing their work',
    members: ['sarah', 'emma', 'rachel', 'lisa', 'john'],
    createdAt: new Date(Date.now() - 1209600000)
  }
])

// Blocked PALs
const blockedPals = ref([
  {
    id: 301,
    name: 'Spam User',
    username: 'spamuser',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=spam',
    blockedAt: new Date(Date.now() - 432000000)
  }
])

// Computed
const filteredPals = computed(() => {
  return myPals.value.filter(pal => {
    const matchesSearch = pal.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                         pal.username.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesStatus = !filterStatus.value || pal.status === filterStatus.value
    return matchesSearch && matchesStatus
  })
})

// Methods
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const messagePal = (id) => {
  console.log('Messaging PAL:', id)
  // Navigate to chat
}

const sendGift = (id) => {
  console.log('Sending gift to PAL:', id)
  // Open gift modal
}

const viewProfile = (id) => {
  console.log('Viewing profile:', id)
  // Navigate to profile
}

const removePal = (id) => {
  if (confirm('Are you sure you want to remove this PAL?')) {
    myPals.value = myPals.value.filter(p => p.id !== id)
  }
}

const acceptRequest = (id) => {
  console.log('Accepting request:', id)
  // API call
}

const rejectRequest = (id) => {
  if (confirm('Are you sure you want to reject this request?')) {
    pendingRequestsList.value = pendingRequestsList.value.filter(r => r.id !== id)
  }
}

const sendPalRequest = (id) => {
  console.log('Sending PAL request to:', id)
  // API call
}

const viewGroup = (id) => {
  console.log('Viewing group:', id)
  // Navigate to group
}

const editGroup = (id) => {
  console.log('Editing group:', id)
  // Open edit modal
}

const unblockPal = (id) => {
  if (confirm('Are you sure you want to unblock this PAL?')) {
    blockedPals.value = blockedPals.value.filter(p => p.id !== id)
  }
}
</script>

<style scoped>
.pal-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 2.5rem;
  margin: 0 0 0.5rem 0;
  color: #333;
}

.subtitle {
  color: #666;
  font-size: 1.1rem;
  margin: 0;
}

.pal-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-icon {
  font-size: 2.5rem;
}

.stat-content {
  flex: 1;
}

.stat-label {
  color: #666;
  font-size: 0.9rem;
  margin: 0;
}

.stat-value {
  font-size: 1.8rem;
  margin: 0.5rem 0 0 0;
  color: #333;
}

.pal-actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
  transform: translateY(-2px);
}

.btn-secondary {
  background: #e5e7eb;
  color: #333;
}

.btn-secondary:hover {
  background: #d1d5db;
}

.btn-tertiary {
  background: #8b5cf6;
  color: white;
}

.btn-tertiary:hover {
  background: #7c3aed;
  transform: translateY(-2px);
}

.pal-tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 2px solid #e5e7eb;
  overflow-x: auto;
}

.tab-button {
  background: none;
  border: none;
  padding: 1rem;
  cursor: pointer;
  font-weight: 600;
  color: #666;
  border-bottom: 3px solid transparent;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.tab-button.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
}

.tab-button:hover {
  color: #333;
}

.pal-section {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.pal-section h3 {
  margin-top: 0;
  color: #333;
}

.section-subtitle {
  color: #666;
  margin-bottom: 1.5rem;
}

.pal-filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.search-input,
.filter-select {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
}

.search-input {
  flex: 1;
}

.pals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.pal-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

.pal-card:hover {
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-4px);
}

.pal-card.suggested {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
}

.pal-avatar {
  position: relative;
  margin-bottom: 1rem;
  text-align: center;
}

.avatar-img {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 3px solid white;
  object-fit: cover;
}

.status-indicator {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 3px solid white;
}

.status-indicator.active {
  background: #10b981;
}

.status-indicator.inactive {
  background: #9ca3af;
}

.match-badge {
  position: absolute;
  top: 0;
  right: 0;
  background: #3b82f6;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
}

.pal-info {
  flex: 1;
  margin-bottom: 1rem;
}

.pal-name {
  margin: 0;
  color: #333;
  font-size: 1.1rem;
}

.pal-username {
  margin: 0.25rem 0 0 0;
  color: #999;
  font-size: 0.9rem;
}

.pal-bio {
  margin: 0.5rem 0 0 0;
  color: #666;
  font-size: 0.9rem;
  line-height: 1.4;
}

.pal-mini-stats {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  font-size: 0.85rem;
  color: #666;
}

.mini-stat {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.mini-stat .icon {
  font-size: 1rem;
}

.common-interests {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
}

.interest-tag {
  background: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  color: #666;
}

.pal-card-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  flex: 1;
  padding: 0.75rem;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1.2rem;
  transition: all 0.3s ease;
}

.btn-icon:hover {
  background: #e5e7eb;
  border-color: #999;
}

.btn-icon.btn-danger:hover {
  background: #fee;
  border-color: #c33;
}

.requests-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.request-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
}

.request-header {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.request-avatar {
  flex-shrink: 0;
}

.request-avatar .avatar-img {
  width: 60px;
  height: 60px;
}

.request-info h4 {
  margin: 0;
  color: #333;
}

.request-info p {
  margin: 0.25rem 0 0 0;
  color: #666;
  font-size: 0.9rem;
}

.request-date {
  color: #999 !important;
}

.request-message {
  background: white;
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  color: #666;
  line-height: 1.6;
}

.request-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.groups-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.group-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.group-header h4 {
  margin: 0;
  color: #333;
}

.group-size {
  background: #e5e7eb;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  color: #666;
}

.group-description {
  color: #666;
  margin-bottom: 1rem;
  line-height: 1.6;
}

.group-members {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.member-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.member-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.member-more {
  width: 40px;
  height: 40px;
  background: #e5e7eb;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 600;
  color: #666;
}

.group-actions {
  display: flex;
  gap: 0.75rem;
}

.blocked-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.blocked-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.blocked-info {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex: 1;
}

.blocked-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
}

.blocked-info h4 {
  margin: 0;
  color: #333;
}

.blocked-info p {
  margin: 0.25rem 0 0 0;
  color: #666;
  font-size: 0.9rem;
}

.blocked-date {
  color: #999 !important;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #999;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover {
  background: #dc2626;
}

@media (max-width: 768px) {
  .pal-container {
    padding: 1rem;
  }

  .page-header h1 {
    font-size: 1.8rem;
  }

  .pal-stats {
    grid-template-columns: 1fr;
  }

  .pal-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }

  .pals-grid {
    grid-template-columns: 1fr;
  }

  .pal-filters {
    flex-direction: column;
  }

  .blocked-card {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .groups-list {
    grid-template-columns: 1fr;
  }
}
</style>
