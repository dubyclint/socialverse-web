<!-- components/group-chat.vue -->
<template>
  <div class="group-chat" v-if="!userProfile.chatDisabled">
    <!-- Header Section -->
    <div class="header">
      <div class="header-content">
        <h2>{{ groupMeta?.name || groupId }}</h2>
        <p class="group-description" v-if="groupMeta?.description">
          {{ groupMeta.description }}
        </p>
      </div>
      <div class="header-badges">
        <span v-if="groupMeta?.blocked" class="badge blocked">🚫 Blocked</span>
        <span v-if="groupMeta?.deleted" class="badge deleted">🗑️ Deleted</span>
        <span class="badge members-count">👥 {{ members.length }}</span>
      </div>
    </div>

    <!-- Admin Tools Section -->
    <div class="admin-tools" v-if="isOwner && !groupMeta?.deleted">
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
              title="Attach files"
            >
              📎 Attach
            </button>
          </div>

          <!-- Attachments Preview -->
          <div v-if="attachments.length > 0" class="attachments-preview">
            <div v-for="(att, idx) in attachments" :key="idx" class="attachment-item">
              <span>{{ att.name }}</span>
              <button 
                type="button"
                class="btn-remove"
                @click="removeAttachment(idx)"
              >
                ✕
              </button>
            </div>
          </div>

          <!-- Send Button -->
          <button 
            type="submit" 
            class="btn btn-primary"
            :disabled="sending || (!draft.trim() && attachments.length === 0)"
          >
            {{ sending ? 'Sending...' : 'Send' }}
          </button>
        </div>

        <!-- Error Message -->
        <div v-if="sendError" class="error-message">
          {{ sendError }}
          <button type="button" class="btn-close" @click="sendError = ''">✕</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Chat Disabled Notice -->
  <div v-else class="notice notice-danger">
    🔒 Your chat privileges have been disabled by an administrator.
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useFileUpload } from '~/composables/use-file-upload'
import MarkdownIt from 'markdown-it'
import EmojiConvertor from 'emoji-js'

// Initialize markdown and emoji
const md = new MarkdownIt({ breaks: true, linkify: true })
const emoji = new EmojiConvertor()
emoji.img_set = 'emojione'
emoji.img_sets.emojione.path = 'https://cdn.jsdelivr.net/emojione/assets/4.5/png/64/'

// Props
const props = defineProps<{ groupId: string }>()
const groupId = props.groupId

// Stores & Composables
const authStore = useAuthStore()
const { uploadFile } = useFileUpload()

// Current User
const currentUser = computed(() => authStore.user?.id)
const isAdmin = computed(() => authStore.user?.role === 'admin')

// Reactive State
const ownerId = ref<string | null>(null)
const groupMeta = ref<any>(null)
const userProfile = ref<any>({})
const members = ref<string[]>([])
const messages = ref<any[]>([])
const draft = ref('')
const sending = ref(false)
const inviteUserId = ref('')
const inviting = ref(false)
const removing = ref<string | null>(null)
const inviteError = ref('')
const inviteSuccess = ref('')
const sendError = ref('')
const attachments = ref<any[]>([])

// Refs
const fileInputRef = ref<HTMLInputElement | null>(null)
const messagesContainer = ref<HTMLElement | null>(null)

// Computed
const isOwner = computed(() => currentUser.value && ownerId.value === currentUser.value)

// Methods
function formatTime(ts: number): string {
  const date = new Date(ts)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  
  return date.toLocaleDateString()
}

function renderContent(text: string): string {
  if (!text) return ''
  const html = md.render(text)
  return emoji.replace_colons(html)
}

async function inviteMember(): Promise<void> {
  if (!inviteUserId.value.trim()) {
    inviteError.value = 'Please enter a user ID or username'
    return
  }

  inviting.value = true
  inviteError.value = ''
  inviteSuccess.value = ''

  try {
    const response = await $fetch(`/api/groups/${groupId}/invite`, {
      method: 'POST',
      body: { userId: inviteUserId.value }
    })

    if (response.success) {
      inviteSuccess.value = `${inviteUserId.value} has been invited!`
      inviteUserId.value = ''
      
      // Reload members
      await loadGroupData()
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        inviteSuccess.value = ''
      }, 3000)
    } else {
      inviteError.value = response.message || 'Failed to invite member'
    }
  } catch (error: any) {
    inviteError.value = error.message || 'An error occurred while inviting'
    console.error('Invite error:', error)
  } finally {
    inviting.value = false
  }
}

async function removeMember(memberId: string): Promise<void> {
  if (!confirm(`Are you sure you want to remove ${memberId} from this group?`)) {
    return
  }

  removing.value = memberId

  try {
    const response = await $fetch(`/api/groups/${groupId}/members/${memberId}`, {
      method: 'DELETE'
    })

    if (response.success) {
      members.value = members.value.filter(m => m !== memberId)
    } else {
      alert(response.message || 'Failed to remove member')
    }
  } catch (error: any) {
    console.error('Remove member error:', error)
    alert('An error occurred while removing the member')
  } finally {
    removing.value = null
  }
}

function triggerFileInput(): void {
  fileInputRef.value?.click()
}

async function handleFileUpload(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const files = input.files

  if (!files) return

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    
    // Validate file size (max 50MB per file)
    const maxSize = 50 * 1024 * 1024
    if (file.size > maxSize) {
      sendError.value = `File ${file.name} exceeds 50MB limit`
      continue
    }

    attachments.value.push({
      file,
      name: file.name,
      size: file.size,
      type: file.type
    })
  }

  // Reset input
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

function removeAttachment(index: number): void {
  attachments.value.splice(index, 1)
}

async function sendMessage(): Promise<void> {
  const messageText = draft.value.trim()

  if (!messageText && attachments.value.length === 0) {
    sendError.value = 'Message cannot be empty'
    return
  }

  sending.value = true
  sendError.value = ''

  try {
    // Upload attachments first
    const uploadedAttachments = []
    for (const att of attachments.value) {
      try {
        const uploadedFile = await uploadFile(att.file, 'group-chat', {
          optimize: false
        })
        if (uploadedFile) {
          uploadedAttachments.push({
            url: uploadedFile.url,
            name: uploadedFile.filename,
            type: uploadedFile.mimeType
          })
        }
      } catch (err) {
        console.error('File upload error:', err)
      }
    }

    // Send message
    const response = await $fetch(`/api/groups/${groupId}/messages`, {
      method: 'POST',
      body: {
        text: messageText,
        attachments: uploadedAttachments,
        timestamp: Date.now()
      }
    })

    if (response.success) {
      // Add message to local state
      messages.value.push({
        id: response.messageId,
        from: currentUser.value,
        text: messageText,
        timestamp: Date.now(),
        attachments: uploadedAttachments,
        avatar: authStore.profile?.avatar_url
      })

      // Clear form
      draft.value = ''
      attachments.value = []

      // Scroll to bottom
      await nextTick(() => {
        if (messagesContainer.value) {
          messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
        }
      })
    } else {
      sendError.value = response.message || 'Failed to send message'
    }
  } catch (error: any) {
    sendError.value = error.message || 'An error occurred while sending the message'
    console.error('Send message error:', error)
  } finally {
    sending.value = false
  }
}

async function loadGroupData(): Promise<void> {
  try {
    const response = await $fetch(`/api/groups/${groupId}`)

    if (response.success) {
      groupMeta.value = response.group
      ownerId.value = response.group.ownerId
      members.value = response.group.members || []
      messages.value = response.group.messages || []
      userProfile.value = authStore.profile || {}
    }
  } catch (error: any) {
    console.error('Load group data error:', error)
  }
}

// Lifecycle
onMounted(async () => {
  await loadGroupData()
  
  // Scroll to bottom
  await nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })

  // Optional: Set up polling or WebSocket for real-time updates
  // const interval = setInterval(loadGroupData, 5000)
  // onUnmounted(() => clearInterval(interval))
})
</script>

<style scoped>
.group-chat {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Header */
.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.header-content h2 {
  margin: 0 0 0.5rem 0;
  font-size: 24px;
  font-weight: 700;
}

.group-description {
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
}

.header-badges {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.badge.blocked {
  background: #ff6b6b;
}

.badge.deleted {
  background: #868e96;
}

.badge.members-count {
  background: rgba(255, 255, 255, 0.3);
}

.badge-owner {
  display: inline-block;
  padding: 2px 8px;
  background: #667eea;
  color: white;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  margin-left: 8px;
}

/* Admin Tools */
.admin-tools {
  padding: 1.5rem;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
  max-height: 300px;
  overflow-y: auto;
}

.admin-section h3 {
  margin: 0 0 1rem 0;
  font-size: 16px;
  font-weight: 700;
  color: #333;
}

.invite-form {
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.input-group {
  display: flex;
  gap: 8px;
}

.form-input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.error-text {
  display: block;
  color: #ff6b6b;
  font-size: 12px;
  margin-top: 4px;
}

.success-text {
  display: block;
  color: #51cf66;
  font-size: 12px;
  margin-top: 4px;
}

.members-section {
  margin-top: 1.5rem;
}

.members-section h4 {
  margin: 0 0 1rem 0;
  font-size: 14px;
  font-weight: 700;
  color: #333;
}

.empty-state {
  padding: 1rem;
  text-align: center;
  color: #999;
  font-size: 14px;
}

.members-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.member-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
}

.member-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.member-name {
  font-weight: 500;
  color: #333;
}

/* Notices */
.notice {
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
  font-weight: 500;
  margin: 1rem;
}

.notice-danger {
  background: #ffe0e0;
  color: #c92a2a;
  border: 1px solid #ff6b6b;
}

.notice-warning {
  background: #fff3bf;
  color: #856404;
  border: 1px solid #ffc107;
}

/* Chat Container */
.chat-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

.messages-wrapper {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  background: #f9f9f9;
}

.empty-messages {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
  font-size: 16px;
}

.messages {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.message-item {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.message-item.own-message {
  justify-content: flex-end;
}

.message-item.own-message .message-bubble {
  background: #667eea;
  color: white;
}

.message-item.own-message .message-meta {
  color: rgba(255, 255, 255, 0.8);
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
}

.message-bubble {
  max-width: 70%;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 12px;
  word-wrap: break-word;
}

.message-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 12px;
  color: #666;
}

.sender-name {
  font-weight: 600;
  color: #333;
}

.timestamp {
  font-size: 11px;
  opacity: 0.7;
}

.message-content {
  font-size: 14px;
  line-height: 1.5;
  color: #333;
}

.message-item.own-message .message-content {
  color: white;
}

.attachments {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.attachment-link {
  display: inline-block;
  padding: 6px 10px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
  font-size: 12px;
  color: #667eea;
  text-decoration: none;
  transition: background 0.3s;
}

.attachment-link:hover {
  background: rgba(0, 0, 0, 0.1);
}

/* Send Form */
.send-form {
  padding: 1.5rem;
  border-top: 1px solid #e0e0e0;
  background: white;
}

.input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  resize: none;
  transition: border-color 0.3s;
}

.message-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.file-upload-section {
  display: flex;
  gap: 8px;
}

.file-input {
  display: none;
}

.attachments-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px;
  background: #f9f9f9;
  border-radius: 6px;
}

.attachment-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
}

.btn-remove {
  background: none;
  border: none;
  color: #ff6b6b;
  cursor: pointer;
  font-size: 14px;
  padding: 0;
}

.error-message {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: #ffe0e0;
  color: #c92a2a;
  border-radius: 6px;
  font-size: 13px;
}

.btn-close {
  background: none;
  border: none;
  color: #c92a2a;
  cursor: pointer;
  font-size: 16px;
  padding: 0;
}

/* Buttons */
.btn {
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background: #e0e0e0;
  color: #333;
}

.btn-secondary:hover:not(:disabled) {
  background: #d0d0d0;
}

.btn-danger {
  background: #ff6b6b;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #ff5252;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
}

/* Responsive */
@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 1rem;
  }

  .message-bubble {
    max-width: 90%;
  }

  .send-form {
    padding: 1rem;
  }

  .message-input {
    font-size: 16px; /* Prevents zoom on iOS */
  }
}
</style>
