<!-- FILE: /components/chat/group-chat.vue -->
<!-- MERGED: group-chat.vue + group-creator.vue -->
<!-- Unified group chat with integrated creation wizard -->

<template>
  <div class="group-chat-container">
    <!-- Group Creator Modal/Overlay -->
    <div v-if="showCreator" class="group-creator-overlay" @click="handleOverlayClick">
      <div class="group-creator" @click.stop>
        <div class="creator-header">
          <button v-if="creatorStep > 1" class="back-btn" @click="creatorStep--">
            ← Back
          </button>
          <h3>{{ creatorStepTitles[creatorStep - 1] }}</h3>
          <button class="close-btn" @click="closeCreator">
            ✕
          </button>
        </div>

        <div class="creator-content">
          <!-- Step 1: Select Contacts -->
          <div v-if="creatorStep === 1" class="step-contacts">
            <div class="search-container">
              <input
                v-model="searchQuery"
                placeholder="Search contacts..."
                class="search-input"
              />
            </div>

            <div class="contacts-list">
              <div v-if="selectedContacts.length > 0" class="selected-contacts">
                <div class="selected-header">
                  <span>Selected ({{ selectedContacts.length }})</span>
                </div>
                <div class="selected-chips">
                  <div 
                    v-for="contact in selectedContacts" 
                    :key="contact.id"
                    class="contact-chip"
                  >
                    <img :src="contact.avatar || '/default-avatar.png'" :alt="contact.username" />
                    <span>{{ contact.username }}</span>
                    <button @click="removeContact(contact.id)">✕</button>
                  </div>
                </div>
              </div>

              <div class="available-contacts">
                <div v-if="onlineContacts.length > 0" class="contacts-section">
                  <div class="section-header">Online</div>
                  <div
                    v-for="contact in onlineContacts"
                    :key="contact.id"
                    class="contact-item"
                    :class="{ selected: isContactSelected(contact.id) }"
                    @click="toggleContact(contact)"
                  >
                    <img :src="contact.avatar || '/default-avatar.png'" :alt="contact.username" />
                    <span>{{ contact.username }}</span>
                    <input type="checkbox" :checked="isContactSelected(contact.id)" />
                  </div>
                </div>

                <div v-if="offlineContacts.length > 0" class="contacts-section">
                  <div class="section-header">Offline</div>
                  <div
                    v-for="contact in offlineContacts"
                    :key="contact.id"
                    class="contact-item"
                    :class="{ selected: isContactSelected(contact.id) }"
                    @click="toggleContact(contact)"
                  >
                    <img :src="contact.avatar || '/default-avatar.png'" :alt="contact.username" />
                    <span>{{ contact.username }}</span>
                    <input type="checkbox" :checked="isContactSelected(contact.id)" />
                  </div>
                </div>

                <div v-if="filteredContacts.length === 0" class="no-contacts">
                  No contacts found
                </div>
              </div>
            </div>

            <div class="step-footer">
              <button 
                class="next-btn"
                @click="creatorStep++"
                :disabled="selectedContacts.length === 0"
              >
                Next ({{ selectedContacts.length }})
              </button>
            </div>
          </div>

          <!-- Step 2: Group Details -->
          <div v-if="creatorStep === 2" class="step-details">
            <div class="form-group">
              <label>Group Name *</label>
              <input
                v-model="newGroupName"
                @blur="validateGroupName"
                placeholder="Enter group name"
                class="form-input"
                maxlength="50"
              />
              <div v-if="groupNameError" class="error-message">
                {{ groupNameError }}
              </div>
              <div class="char-count">{{ newGroupName.length }}/50</div>
            </div>

            <div class="form-group">
              <label>Group Description</label>
              <textarea
                v-model="newGroupDescription"
                placeholder="Enter group description (optional)"
                class="form-textarea"
                maxlength="200"
                rows="3"
              ></textarea>
              <div class="char-count">{{ newGroupDescription.length }}/200</div>
            </div>

            <div class="step-footer">
              <button class="create-btn" @click="createGroup" :disabled="creatingGroup">
                {{ creatingGroup ? 'Creating...' : 'Create Group' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Chat Interface -->
    <div v-if="!showCreator && groupId" class="group-chat" :class="{ 'chat-disabled': userProfile?.chatDisabled }">
      <!-- Header Section -->
      <div class="header">
        <div class="header-content">
          <h2>{{ groupMeta?.name || groupId }}</h2>
          <p v-if="groupMeta?.description" class="group-description">
            {{ groupMeta.description }}
          </p>
        </div>
        <div class="header-badges">
          <span v-if="groupMeta?.blocked" class="badge blocked">🚫 Blocked</span>
          <span v-if="groupMeta?.deleted" class="badge deleted">🗑️ Deleted</span>
          <span class="badge members-count">👥 {{ members.length }}</span>
          <button v-if="isOwner" class="btn-icon" @click="showSettings = !showSettings">
            ⚙️
          </button>
        </div>
      </div>

      <!-- Admin Tools Section -->
      <div v-if="isOwner && !groupMeta?.deleted && showSettings" class="admin-tools">
        <div class="admin-section">
          <h3>Group Management</h3>
          
          <!-- Invite Form -->
          <form @submit.prevent="inviteMember" class="invite-form">
            <div class="form-group">
              <label>Invite User</label>
              <div class="input-group">
                <input 
                  v-model="inviteUserId" 
                  placeholder="Enter user ID or username"
                  type="text"
                  class="form-input"
                />
                <button type="submit" class="btn btn-primary" :disabled="!inviteUserId || inviting">
                  {{ inviting ? 'Inviting...' : 'Invite' }}
                </button>
              </div>
              <span v-if="inviteError" class="error-text">{{ inviteError }}</span>
              <span v-if="inviteSuccess" class="success-text">{{ inviteSuccess }}</span>
            </div>
          </form>

          <!-- Members List -->
          <div class="members-section">
            <h4>Members ({{ members.length }})</h4>
            <div v-if="members.length === 0" class="empty-state">
              No members yet
            </div>
            <ul v-else class="members-list">
              <li v-for="m in members" :key="m" class="member-item">
                <div class="member-info">
                  <span class="member-name">{{ m }}</span>
                  <span v-if="m === ownerId" class="badge-owner">Owner</span>
                </div>
                <button 
                  v-if="m !== ownerId"
                  class="btn btn-danger btn-sm" 
                  @click="removeMember(m)"
                  :disabled="removing === m"
                >
                  {{ removing === m ? '...' : 'Remove' }}
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Status Notices -->
      <div v-if="groupMeta?.deleted" class="notice notice-danger">
        ⚠️ This group has been deleted and cannot receive new messages.
      </div>
      <div v-else-if="groupMeta?.blocked" class="notice notice-warning">
        ⚠️ This group is blocked by an administrator.
      </div>

      <!-- Chat Section -->
      <div v-else class="chat-container">
        <!-- Messages List -->
        <div class="messages-wrapper">
          <div v-if="messages.length === 0" class="empty-messages">
            <p>No messages yet. Start the conversation!</p>
          </div>
          <ul v-else class="messages">
            <li v-for="msg in messages" :key="msg.id" class="message-item" :class="{ 'own-message': msg.from === currentUser }">
              <img 
                v-if="msg.avatar && msg.from !== currentUser" 
                :src="msg.avatar" 
                :alt="msg.from"
                class="avatar" 
              />
              <div class="message-bubble">
                <div class="message-meta">
                  <strong class="sender-name">{{ msg.from }}</strong>
                  <span class="timestamp">{{ formatTime(msg.timestamp) }}</span>
                </div>
                <div class="message-content" v-html="renderContent(msg.text)"></div>
                <div v-if="msg.attachments && msg.attachments.length > 0" class="attachments">
                  <a 
                    v-for="(att, idx) in msg.attachments" 
                    :key="idx"
                    :href="att.url"
                    target="_blank"
                    class="attachment-link"
                  >
                    📎 {{ att.name }}
                  </a>
                </div>
              </div>
            </li>
          </ul>
        </div>

        <!-- Message Input Form -->
        <form @submit.prevent="sendMessage" class="send-form">
          <div class="input-wrapper">
            <textarea 
              v-model="draft" 
              placeholder="Type a message... (Markdown supported)"
              class="message-input"
              rows="3"
              @keydown.enter.ctrl="sendMessage"
            ></textarea>
            
            <!-- File Upload -->
            <div class="file-upload-section">
              <input 
                ref="fileInputRef"
                type="file"
                multiple
                @change="handleFileUpload"
                class="file-input"
                accept="image/*,video/*,.pdf,.doc,.docx"
              />
              <button 
                type="button"
                class="btn btn-secondary btn-sm"
                @click="triggerFileInput"
              >
                📎 Attach
              </button>
            </div>

            <!-- Send Button -->
            <button 
              type="submit" 
              class="btn btn-primary"
              :disabled="!draft.trim() || sending"
            >
              {{ sending ? 'Sending...' : 'Send' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Create Group Button (when no group selected) -->
    <div v-else class="empty-state-container">
      <div class="empty-state">
        <h3>No Group Selected</h3>
        <p>Create a new group or select an existing one</p>
        <button class="btn btn-primary btn-lg" @click="showCreator = true">
          ➕ Create New Group
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'

interface Contact {
  id: string
  username: string
  avatar?: string
  online?: boolean
}

interface Message {
  id: string
  from: string
  text: string
  timestamp: number
  avatar?: string
  attachments?: Array<{ name: string; url: string }>
}

interface GroupMeta {
  name: string
  description?: string
  blocked?: boolean
  deleted?: boolean
}

const props = defineProps<{
  groupId?: string
  currentUser?: string
  userProfile?: any
}>()

const emit = defineEmits<{
  groupCreated: [groupId: string]
  messageSent: [message: Message]
}>()

// Creator state
const showCreator = ref(false)
const creatorStep = ref(1)
const creatorStepTitles = ['Select Contacts', 'Group Details', 'Confirmation']
const searchQuery = ref('')
const selectedContacts = ref<Contact[]>([])
const newGroupName = ref('')
const newGroupDescription = ref('')
const groupNameError = ref('')
const creatingGroup = ref(false)
const allContacts = ref<Contact[]>([])

// Chat state
const groupId = ref(props.groupId || '')
const groupMeta = ref<GroupMeta | null>(null)
const members = ref<string[]>([])
const ownerId = ref('')
const messages = ref<Message[]>([])
const draft = ref('')
const sending = ref(false)
const currentUser = ref(props.currentUser || '')
const fileInputRef = ref<HTMLInputElement>()
const showSettings = ref(false)

// Admin state
const inviteUserId = ref('')
const inviting = ref(false)
const inviteError = ref('')
const inviteSuccess = ref('')
const removing = ref<string | null>(null)

const filteredContacts = computed(() => {
  if (!searchQuery.value) return allContacts.value
  return allContacts.value.filter(c => 
    c.username.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

const onlineContacts = computed(() => 
  filteredContacts.value.filter(c => c.online)
)

const offlineContacts = computed(() => 
  filteredContacts.value.filter(c => !c.online)
)

const isOwner = computed(() => currentUser.value === ownerId.value)

const isContactSelected = (id: string) => 
  selectedContacts.value.some(c => c.id === id)

const toggleContact = (contact: Contact) => {
  if (isContactSelected(contact.id)) {
    selectedContacts.value = selectedContacts.value.filter(c => c.id !== contact.id)
  } else {
    selectedContacts.value.push(contact)
  }
}

const removeContact = (id: string) => {
  selectedContacts.value = selectedContacts.value.filter(c => c.id !== id)
}

const validateGroupName = () => {
  groupNameError.value = ''
  if (!newGroupName.value.trim()) {
    groupNameError.value = 'Group name is required'
  } else if (newGroupName.value.length < 3) {
    groupNameError.value = 'Group name must be at least 3 characters'
  }
}

const createGroup = async () => {
  validateGroupName()
  if (groupNameError.value) return

  creatingGroup.value = true
  try {
    const response = await fetch('/api/chat/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newGroupName.value,
        description: newGroupDescription.value,
        members: selectedContacts.value.map(c => c.id)
      })
    })

    if (!response.ok) throw new Error('Failed to create group')
    
    const data = await response.json()
    groupId.value = data.id
    showCreator.value = false
    creatorStep.value = 1
    selectedContacts.value = []
    newGroupName.value = ''
    newGroupDescription.value = ''
    
    emit('groupCreated', data.id)
    await loadGroupData()
  } catch (err) {
    console.error('Failed to create group:', err)
  } finally {
    creatingGroup.value = false
  }
}

const closeCreator = () => {
  showCreator.value = false
  creatorStep.value = 1
  selectedContacts.value = []
  newGroupName.value = ''
  newGroupDescription.value = ''
}

const handleOverlayClick = (e: MouseEvent) => {
  if (e.target === e.currentTarget) {
    closeCreator()
  }
}

const loadGroupData = async () => {
  if (!groupId.value) return

  try {
    const response = await fetch(`/api/chat/groups/${groupId.value}`)
    if (!response.ok) throw new Error('Failed to load group')
    
    const data = await response.json()
    groupMeta.value = data.meta
    members.value = data.members
    ownerId.value = data.ownerId
    messages.value = data.messages || []
  } catch (err) {
    console.error('Failed to load group data:', err)
  }
}

const inviteMember = async () => {
  if (!inviteUserId.value) return

  inviting.value = true
  inviteError.value = ''
  inviteSuccess.value = ''

  try {
    const response = await fetch(`/api/chat/groups/${groupId.value}/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: inviteUserId.value })
    })

    if (!response.ok) throw new Error('Failed to invite member')
    
    inviteSuccess.value = 'Member invited successfully'
    inviteUserId.value = ''
    await loadGroupData()
  } catch (err: any) {
    inviteError.value = err.message || 'Failed to invite member'
  } finally {
    inviting.value = false
  }
}

const removeMember = async (memberId: string) => {
  removing.value = memberId

  try {
    const response = await fetch(`/api/chat/groups/${groupId.value}/members/${memberId}`, {
      method: 'DELETE'
    })

    if (!response.ok) throw new Error('Failed to remove member')
    
    await loadGroupData()
  } catch (err) {
    console.error('Failed to remove member:', err)
  } finally {
    removing.value = null
  }
}

const sendMessage = async () => {
  if (!draft.value.trim()) return

  sending.value = true

  try {
    const response = await fetch(`/api/chat/groups/${groupId.value}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: draft.value })
    })

    if (!response.ok) throw new Error('Failed to send message')
    
    const message = await response.json()
    messages.value.push(message)
    draft.value = ''
    emit('messageSent', message)
  } catch (err) {
    console.error('Failed to send message:', err)
  } finally {
    sending.value = false
  }
}

const handleFileUpload = async (e: Event) => {
  const input = e.target as HTMLInputElement
  if (!input.files) return

  const formData = new FormData()
  Array.from(input.files).forEach(file => {
    formData.append('files', file)
  })

  try {
    const response = await fetch(`/api/chat/groups/${groupId.value}/upload`, {
      method: 'POST',
      body: formData
    })

    if (!response.ok) throw new Error('Failed to upload files')
    
    const data = await response.json()
    draft.value += '\n' + data.urls.map((url: string) => `[File](${url})`).join('\n')
  } catch (err) {
    console.error('Failed to upload files:', err)
  }
}

const triggerFileInput = () => {
  fileInputRef.value?.click()
}

const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString()
}

const renderContent = (text: string) => {
  // Simple markdown rendering
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>')
}

onMounted(async () => {
  // Load contacts for creator
  try {
    const response = await fetch('/api/contacts')
    if (response.ok) {
      allContacts.value = await response.json()
    }
  } catch (err) {
    console.error('Failed to load contacts:', err)
  }

  // Load group data if groupId provided
  if (groupId.value) {
    await loadGroupData()
  }
})
</script>

<style scoped>
.group-chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
}

/* Creator Overlay */
.group-creator-overlay {
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

.group-creator {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.creator-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid #eee;
}

.creator-header h3 {
  margin: 0;
  flex: 1;
  text-align: center;
}

.back-btn, .close-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.5rem;
}

.creator-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.step-contacts .search-container {
  margin-bottom: 1rem;
}

.search-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
}

.contacts-list {
  margin-bottom: 1rem;
}

.selected-contacts {
  margin-bottom: 1rem;
  padding: 1rem;
  background: #f0f7ff;
  border-radius: 4px;
}

.selected-header {
  font-weight: bold;
  margin-bottom: 0.5rem;
  color: #333;
}

.selected-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.contact-chip {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: white;
  border: 1px solid #ddd;
  border-radius: 20px;
  padding: 0.25rem 0.75rem;
}

.contact-chip img {
  width: 24px;
  height: 24px;
  border-radius: 50%;
}

.contact-chip button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
}

.available-contacts {
  margin-bottom: 1rem;
}

.contacts-section {
  margin-bottom: 1rem;
}

.section-header {
  font-weight: bold;
  color: #666;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.contact-item:hover {
  background: #f5f5f5;
}

.contact-item.selected {
  background: #e3f2fd;
}

.contact-item img {
  width: 32px;
  height: 32px;
  border-radius: 50%;
}

.contact-item input {
  margin-left: auto;
}

.no-contacts {
  text-align: center;
  color: #999;
  padding: 1rem;
}

.step-details .form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: #333;
}

.form-input, .form-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: inherit;
  font-size: 0.9rem;
}

.form-textarea {
  resize: vertical;
}

.error-message {
  color: #d32f2f;
  font-size: 0.85rem;
  margin-top: 0.25rem;
}

.char-count {
  font-size: 0.8rem;
  color: #999;
  margin-top: 0.25rem;
}

.step-footer {
  display: flex;
  gap: 0.5rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

.next-btn, .create-btn {
  flex: 1;
  padding: 0.75rem;
  background: #1976d2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.next-btn:disabled, .create-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

/* Chat Interface */
.group-chat {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.group-chat.chat-disabled {
  opacity: 0.6;
  pointer-events: none;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #eee;
  background: #f9f9f9;
}

.header-content h2 {
  margin: 0;
  font-size: 1.2rem;
}

.group-description {
  margin: 0.25rem 0 0 0;
  color: #666;
  font-size: 0.9rem;
}

.header-badges {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.badge {
  padding: 0.25rem 0.75rem;
  background: #e0e0e0;
  border-radius: 12px;
  font-size: 0.85rem;
}

.badge.blocked {
  background: #ffebee;
  color: #c62828;
}

.badge.deleted {
  background: #f3e5f5;
  color: #6a1b9a;
}

.btn-icon {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.5rem;
}

.admin-tools {
  padding: 1rem;
  background: #f5f5f5;
  border-bottom: 1px solid #eee;
  max-height: 300px;
  overflow-y: auto;
}

.admin-section h3 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
}

.invite-form .input-group {
  display: flex;
  gap: 0.5rem;
}

.invite-form .form-input {
  flex: 1;
}

.error-text {
  color: #d32f2f;
  font-size: 0.85rem;
}

.success-text {
  color: #388e3c;
  font-size: 0.85rem;
}

.members-section h4 {
  margin: 1rem 0 0.5rem 0;
  font-size: 0.95rem;
}

.members-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.member-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: white;
  border-radius: 4px;
  margin-bottom: 0.25rem;
}

.member-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.member-name {
  font-weight: 500;
}

.badge-owner {
  background: #fff3e0;
  color: #e65100;
  padding: 0.15rem 0.5rem;
  border-radius: 3px;
  font-size: 0.8rem;
}

.notice {
  padding: 1rem;
  margin: 1rem;
  border-radius: 4px;
  text-align: center;
}

.notice-danger {
  background: #ffebee;
  color: #c62828;
  border: 1px solid #ef5350;
}

.notice-warning {
  background: #fff3e0;
  color: #e65100;
  border: 1px solid #ffb74d;
}

.chat-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

.messages-wrapper {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.empty-messages {
  text-align: center;
  color: #999;
  padding: 2rem;
}

.messages {
  list-style: none;
  padding: 0;
  margin: 0;
}

.message-item {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.message-item.own-message {
  justify-content: flex-end;
}

.message-item.own-message .message-bubble {
  background: #1976d2;
  color: white;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
}

.message-bubble {
  background: #f0f0f0;
  border-radius: 8px;
  padding: 0.75rem;
  max-width: 70%;
}

.message-meta {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
  font-size: 0.85rem;
}

.sender-name {
  font-weight: 600;
}

.timestamp {
  color: #999;
  font-size: 0.8rem;
}

.message-content {
  word-wrap: break-word;
}

.attachments {
  margin-top: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.attachment-link {
  color: #1976d2;
  text-decoration: none;
  font-size: 0.9rem;
}

.send-form {
  padding: 1rem;
  border-top: 1px solid #eee;
  background: white;
}

.input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.message-input {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: inherit;
  font-size: 0.9rem;
  resize: vertical;
}

.file-upload-section {
  display: flex;
  gap: 0.5rem;
}

.file-input {
  display: none;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-primary {
  background: #1976d2;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #1565c0;
}

.btn-secondary {
  background: #757575;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #616161;
}

.btn-danger {
  background: #d32f2f;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #c62828;
}

.btn-sm {
  padding: 0.35rem 0.75rem;
  font-size: 0.85rem;
}

.btn-lg {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.empty-state-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.empty-state {
  text-align: center;
}

.empty-state h3 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.empty-state p {
  color: #999;
  margin: 0 0 1rem 0;
}
</style>
