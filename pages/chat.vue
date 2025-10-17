<!-- pages/chat.vue -->
<template>
  <div>
    <ChatLayout />
  </div>
</template>

<script setup>
import ChatLayout from '@/components/chat/ChatLayout.vue'

// Set page meta
definePageMeta({
  middleware: 'auth',
  layout: 'chat'
})

  <div class="chat-page">
    <div class="chat-container">
      <!-- Chat Sidebar -->
      <div class="chat-sidebar" :class="{ 'sidebar-hidden': selectedChat && isMobile }">
        <div class="sidebar-header">
          <h2>Messages</h2>
          <div class="sidebar-actions">
            <button @click="showNewChatModal = true" class="new-chat-btn" title="New Message">
              <Icon name="plus" size="16" />
            </button>
            <button @click="showGroupModal = true" class="new-group-btn" title="New Group">
              <Icon name="users" size="16" />
            </button>
          </div>
        </div>

        <!-- Search -->
        <div class="search-section">
          <div class="search-box">
            <Icon name="search" size="16" />
            <input 
              v-model="searchQuery" 
              placeholder="Search conversations..."
              class="search-input"
            />
          </div>
        </div>

        <!-- Chat Tabs -->
        <div class="chat-tabs">
          <button 
            @click="activeTab = 'all'" 
            :class="['tab-btn', { active: activeTab === 'all' }]"
          >
            All
          </button>
          <button 
            @click="activeTab = 'groups'" 
            :class="['tab-btn', { active: activeTab === 'groups' }]"
          >
            Groups
          </button>
          <button 
            @click="activeTab = 'unread'" 
            :class="['tab-btn', { active: activeTab === 'unread' }]"
          >
            Unread ({{ unreadCount }})
          </button>
        </div>

        <!-- Chat List -->
        <div class="chat-list">
          <div 
            v-for="chat in filteredChats" 
            :key="chat.id"
            @click="selectChat(chat)"
            :class="['chat-item', { active: selectedChat?.id === chat.id }]"
          >
            <div class="chat-avatar">
              <div v-if="chat.isGroup" class="group-avatar">
                <div class="group-icon">
                  <Icon name="users" size="20" />
                </div>
              </div>
              <img 
                v-else
                :src="chat.avatar || '/default-avatar.png'" 
                :alt="chat.name"
                class="avatar-img"
              />
              <div v-if="chat.isOnline && !chat.isGroup" class="online-indicator"></div>
              <div v-if="chat.unreadCount > 0" class="unread-badge">
                {{ chat.unreadCount > 99 ? '99+' : chat.unreadCount }}
              </div>
            </div>
            <div class="chat-info">
              <div class="chat-header">
                <h4 class="chat-name">
                  {{ chat.name }}
                  <Icon v-if="chat.isGroup" name="users" size="12" class="group-indicator" />
                </h4>
                <span class="chat-time">{{ formatTime(chat.lastMessageTime) }}</span>
              </div>
              <div class="chat-preview">
                <p class="last-message">
                  <span v-if="chat.lastMessageType === 'voice'" class="message-type-icon">
                    <Icon name="mic" size="12" /> Voice message
                  </span>
                  <span v-else-if="chat.lastMessageType === 'file'" class="message-type-icon">
                    <Icon name="paperclip" size="12" /> File
                  </span>
                  <span v-else-if="chat.lastMessageType === 'image'" class="message-type-icon">
                    <Icon name="image" size="12" /> Photo
                  </span>
                  <span v-else>{{ chat.lastMessage }}</span>
                </p>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-if="filteredChats.length === 0" class="empty-chats">
            <Icon name="message-circle" size="48" />
            <h3>No conversations</h3>
            <p>Start a new conversation to get chatting!</p>
            <button @click="showNewChatModal = true" class="btn-primary">
              New Message
            </button>
          </div>
        </div>
      </div>

      <!-- Chat Main Area -->
      <div class="chat-main" :class="{ 'main-hidden': !selectedChat && isMobile }">
        <!-- No Chat Selected -->
        <div v-if="!selectedChat" class="no-chat-selected">
          <Icon name="message-circle" size="64" />
          <h3>Select a conversation</h3>
          <p>Choose a conversation from the sidebar to start messaging</p>
        </div>

        <!-- Chat Area -->
        <div v-else class="chat-area">
          <!-- Chat Header -->
          <div class="chat-header">
            <button 
              v-if="isMobile" 
              @click="selectedChat = null" 
              class="back-btn"
            >
              <Icon name="arrow-left" size="20" />
            </button>
            <div class="chat-user-info">
              <div v-if="selectedChat.isGroup" class="group-avatar-header">
                <div class="group-icon-header">
                  <Icon name="users" size="24" />
                </div>
              </div>
              <img 
                v-else
                :src="selectedChat.avatar || '/default-avatar.png'" 
                :alt="selectedChat.name"
                class="header-avatar"
              />
              <div class="user-details">
                <h3>{{ selectedChat.name }}</h3>
                <p class="user-status">
                  <span v-if="selectedChat.isGroup">
                    {{ selectedChat.memberCount }} members
                    <span v-if="selectedChat.onlineMembers > 0">
                      • {{ selectedChat.onlineMembers }} online
                    </span>
                  </span>
                  <span v-else-if="isTyping">
                    Typing...
                  </span>
                  <span v-else>
                    {{ selectedChat.isOnline ? 'Online' : `Last seen ${formatLastSeen(selectedChat.lastSeen)}` }}
                  </span>
                </p>
              </div>
            </div>
            <div class="chat-actions">
              <button 
                @click="startVoiceCall" 
                class="action-btn" 
                title="Voice Call"
                :disabled="selectedChat.isGroup"
              >
                <Icon name="phone" size="20" />
              </button>
              <button 
                @click="startVideoCall" 
                class="action-btn" 
                title="Video Call"
                :disabled="selectedChat.isGroup"
              >
                <Icon name="video" size="20" />
              </button>
              <button 
                @click="startScreenShare" 
                class="action-btn" 
                title="Screen Share"
              >
                <Icon name="monitor" size="20" />
              </button>
              <button 
                @click="showChatInfo = true" 
                class="action-btn" 
                title="Chat Info"
              >
                <Icon name="info" size="20" />
              </button>
            </div>
          </div>

          <!-- Translation Suggestion -->
          <div v-if="showTranslationSuggestion" class="translation-suggestion">
            <div class="translation-content">
              <Icon name="globe" size="16" />
              <span>Translate to English?</span>
              <button @click="useTranslation" class="use-translation-btn">Use</button>
              <button @click="dismissTranslation" class="dismiss-translation-btn">
                <Icon name="x" size="14" />
              </button>
            </div>
            <div class="suggested-text">{{ suggestedTranslation }}</div>
          </div>

          <!-- Messages Area -->
          <div ref="messagesContainer" class="messages-container">
            <div 
              v-for="message in selectedChat.messages" 
              :key="message.id"
              :class="['message', { 'own-message': message.senderId === currentUserId }]"
            >
              <div v-if="message.senderId !== currentUserId" class="message-avatar">
                <img 
                  :src="message.senderAvatar || '/default-avatar.png'" 
                  :alt="message.senderName"
                  class="sender-avatar"
                />
              </div>
              <div class="message-content">
                <div v-if="selectedChat.isGroup && message.senderId !== currentUserId" class="sender-name">
                  {{ message.senderName }}
                </div>
                <div class="message-bubble">
                  <!-- Text Message -->
                  <div v-if="message.type === 'text'">
                    <p>{{ message.content }}</p>
                    <div v-if="message.translation" class="message-translation">
                      <Icon name="globe" size="12" />
                      <span>{{ message.translation.text }}</span>
                    </div>
                  </div>
                  
                  <!-- Voice Message -->
                  <div v-else-if="message.type === 'voice'" class="voice-message">
                    <button 
                      @click="toggleVoicePlayback(message)" 
                      class="voice-play-btn"
                    >
                      <Icon :name="message.isPlaying ? 'pause' : 'play'" size="16" />
                    </button>
                    <div class="voice-waveform">
                      <div class="waveform-bars">
                        <div v-for="i in 20" :key="i" class="waveform-bar"></div>
                      </div>
                    </div>
                    <span class="voice-duration">{{ message.duration || '0:00' }}</span>
                  </div>
                  
                  <!-- File Message -->
                  <div v-else-if="message.type === 'file'" class="file-message">
                    <div class="file-icon">
                      <Icon name="file" size="24" />
                    </div>
                    <div class="file-info">
                      <div class="file-name">{{ message.fileName }}</div>
                      <div class="file-size">{{ formatFileSize(message.fileSize) }}</div>
                      <div v-if="message.uploadProgress !== undefined" class="upload-progress">
                        <div class="progress-bar">
                          <div 
                            class="progress-fill" 
                            :style="{ width: message.uploadProgress + '%' }"
                          ></div>
                        </div>
                        <span>{{ message.uploadProgress }}%</span>
                      </div>
                    </div>
                    <button @click="downloadFile(message)" class="file-download-btn">
                      <Icon name="download" size="16" />
                    </button>
                  </div>
                  
                  <!-- Image Message -->
                  <div v-else-if="message.type === 'image'" class="image-message">
                    <img 
                      :src="message.imageUrl" 
                      :alt="message.content"
                      class="message-image"
                      @click="openImageModal(message.imageUrl)"
                    />
                    <p v-if="message.content" class="image-caption">{{ message.content }}</p>
                  </div>

                  <!-- Video Message -->
                  <div v-else-if="message.type === 'video'" class="video-message">
                    <video 
                      :src="message.videoUrl" 
                      class="message-video"
                      controls
                      preload="metadata"
                    ></video>
                    <p v-if="message.content" class="video-caption">{{ message.content }}</p>
                  </div>
                  
                  <!-- Sticker Message -->
                  <div v-else-if="message.type === 'sticker'" class="sticker-message">
                    <img 
                      :src="message.stickerUrl" 
                      :alt="message.stickerName"
                      class="sticker-image"
                    />
                  </div>
                  
                  <!-- System Message -->
                  <div v-else-if="message.type === 'system'" class="system-message">
                    <Icon name="info" size="16" />
                    <span>{{ message.content }}</span>
                  </div>
                </div>
                <div class="message-meta">
                  <span class="message-time">{{ formatMessageTime(message.timestamp) }}</span>
                  <button 
                    v-if="message.type === 'text' && message.senderId !== currentUserId"
                    @click="translateMessage(message)"
                    class="translate-btn"
                    title="Translate message"
                  >
                    <Icon name="globe" size="12" />
                  </button>
                  <div v-if="message.senderId === currentUserId" class="message-status">
                    <Icon 
                      :name="getMessageStatusIcon(message.status)" 
                      size="12"
                      :class="['status-icon', message.status]"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Typing Indicator -->
            <div v-if="isTyping" class="typing-indicator">
              <div class="typing-avatar">
                <img 
                  :src="typingUser.avatar || '/default-avatar.png'" 
                  :alt="typingUser.name"
                  class="sender-avatar"
                />
              </div>
              <div class="typing-bubble">
                <div class="typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>

          <!-- Message Input -->
          <div class="message-input-area">
            <!-- Voice Recording Overlay -->
            <div v-if="isRecording" class="voice-recording-overlay">
              <div class="recording-content">
                <div class="recording-animation">
                  <div class="recording-pulse"></div>
                  <Icon name="mic" size="24" />
                </div>
                <div class="recording-info">
                  <span class="recording-text">Recording...</span>
                  <span class="recording-time">{{ recordingTime }}</span>
                </div>
                <div class="recording-actions">
                  <button @click="cancelRecording" class="cancel-recording-btn">
                    <Icon name="x" size="20" />
                  </button>
                  <button @click="stopRecording" class="stop-recording-btn">
                    <Icon name="send" size="20" />
                  </button>
                </div>
              </div>
            </div>

            <div class="input-container">
              <button 
                class="attachment-btn" 
                @click="showAttachmentMenu = !showAttachmentMenu"
              >
                <Icon name="paperclip" size="20" />
              </button>
              
              <div class="text-input-container">
                <textarea
                  v-model="newMessage"
                  @keydown="handleKeyDown"
                  @input="handleTypingWithTranslation"
                  placeholder="Type a message..."
                  class="message-input"
                  rows="1"
                  ref="messageInput"
                ></textarea>
                <div class="input-actions">
                  <button 
                    class="emoji-btn" 
                    @click="showEmojiPicker = !showEmojiPicker"
                  >
                    <Icon name="smile" size="20" />
                  </button>
                  <button 
                    class="sticker-btn" 
                    @click="showStickerPicker = !showStickerPicker"
                  >
                    <Icon name="sticker" size="20" />
                  </button>
                </div>
              </div>
              
              <button 
                v-if="newMessage.trim()"
                @click="sendMessage" 
                class="send-btn"
              >
                <Icon name="send" size="20" />
              </button>
              <button 
                v-else
                @mousedown="startRecording"
                @mouseup="stopRecording"
                @mouseleave="cancelRecording"
                class="voice-btn"
                :class="{ recording: isRecording }"
              >
                <Icon name="mic" size="20" />
              </button>
            </div>

            <!-- Attachment Menu -->
            <div v-if="showAttachmentMenu" class="attachment-menu">
              <button @click="selectFile('image')" class="attachment-option">
                <Icon name="image" size="16" />
                Photo
              </button>
              <button @click="selectFile('file')" class="attachment-option">
                <Icon name="file" size="16" />
                Document
              </button>
              <button @click="selectFile('video')" class="attachment-option">
                <Icon name="video" size="16" />
                Video
              </button>
              <button @click="startScreenRecording" class="attachment-option">
                <Icon name="monitor" size="16" />
                Screen Record
              </button>
            </div>

            <!-- Emoji Picker -->
            <div v-if="showEmojiPicker" class="emoji-picker">
              <div class="emoji-categories">
                <button 
                  v-for="category in emojiCategories" 
                  :key="category.name"
                  @click="selectedEmojiCategory = category.name"
                  :class="['emoji-category-btn', { active: selectedEmojiCategory === category.name }]"
                >
                  {{ category.icon }}
                </button>
              </div>
              <div class="emoji-grid">
                <button 
                  v-for="emoji in currentEmojis" 
                  :key="emoji"
                  @click="insertEmoji(emoji)"
                  class="emoji-btn"
                >
                  {{ emoji }}
                </button>
              </div>
            </div>

            <!-- Sticker Picker -->
            <div v-if="showStickerPicker" class="sticker-picker">
              <div class="sticker-packs">
                <button 
                  v-for="pack in stickerPacks" 
                  :key="pack.id"
                  @click="selectedStickerPack = pack.id"
                  :class="['sticker-pack-btn', { active: selectedStickerPack === pack.id }]"
                >
                  <img :src="pack.preview" :alt="pack.name" />
                </button>
              </div>
              <div class="sticker-grid">
                <button 
                  v-for="sticker in currentStickers" 
                  :key="sticker.id"
                  @click="sendSticker(sticker)"
                  class="sticker-btn"
                >
                  <img :src="sticker.url" :alt="sticker.name" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Video Call Modal -->
    <div v-if="showVideoCall" class="video-call-modal">
      <div class="video-call-container">
        <div class="video-streams">
          <video ref="remoteVideo" class="remote-video" autoplay></video>
          <video ref="localVideo" class="local-video" autoplay muted></video>
        </div>
        <div class="call-controls">
          <button @click="toggleMute" :class="['control-btn', { active: isMuted }]">
            <Icon :name="isMuted ? 'mic-off' : 'mic'" size="20" />
          </button>
          <button @click="toggleVideo" :class="['control-btn', { active: !isVideoEnabled }]">
            <Icon :name="isVideoEnabled ? 'video' : 'video-off'" size="20" />
          </button>
          <button @click="toggleScreenShare" :class="['control-btn', { active: isScreenSharing }]">
            <Icon name="monitor" size="20" />
          </button>
          <button @click="endCall" class="control-btn end-call">
            <Icon name="phone-off" size="20" />
          </button>
        </div>
        <div class="call-info">
          <h3>{{ selectedChat?.name }}</h3>
          <p>{{ callDuration }}</p>
        </div>
      </div>
    </div>

    <!-- New Chat Modal -->
    <div v-if="showNewChatModal" class="modal-overlay" @click="closeNewChatModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>New Message</h3>
          <button @click="closeNewChatModal" class="close-btn">&times;</button>
        </div>
        <div class="new-chat-content">
          <div class="search-users">
            <input 
              v-model="userSearchQuery" 
              placeholder="Search users..."
              class="search-input"
            />
          </div>
          <div class="users-list">
            <div 
              v-for="user in filteredUsers" 
              :key="user.id"
              @click="startNewChat(user)"
              class="user-item"
            >
              <img 
                :src="user.avatar || '/default-avatar.png'" 
                :alt="user.name"
                class="user-avatar"
              />
              <div class="user-info">
                <h4>{{ user.name }}</h4>
                <p>@{{ user.username }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- New Group Modal -->
    <div v-if="showGroupModal" class="modal-overlay" @click="closeGroupModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Create Group</h3>
          <button @click="closeGroupModal" class="close-btn">&times;</button>
        </div>
        <div class="new-group-content">
          <div class="group-info-section">
            <div class="group-avatar-upload">
              <div class="group-avatar-placeholder">
                <Icon name="users" size="32" />
              </div>
              <button class="upload-group-avatar-btn">
                <Icon name="camera" size="16" />
              </button>
            </div>
            <div class="group-details">
              <input 
                v-model="newGroupName" 
                placeholder="Group name"
                class="group-name-input"
              />
              <textarea 
                v-model="newGroupDescription" 
                placeholder="Group description (optional)"
                class="group-description-input"
                rows="2"
              ></textarea>
            </div>
          </div>
          
          <div class="member-selection">
            <h4>Add Members</h4>
            <div class="search-members">
              <input 
                v-model="memberSearchQuery" 
                placeholder="Search users..."
                class="search-input"
              />
            </div>
            <div class="selected-members">
              <div 
                v-for="member in selectedMembers" 
                :key="member.id"
                class="selected-member"
              >
                <img :src="member.avatar" :alt="member.name" />
                <span>{{ member.name }}</span>
                <button @click="removeMember(member.id)">
                  <Icon name="x" size="12" />
                </button>
              </div>
            </div>
            <div class="available-members">
              <div 
                v-for="user in filteredMemberUsers" 
                :key="user.id"
                @click="addMember(user)"
                class="member-item"
                :class="{ selected: selectedMembers.some(m => m.id === user.id) }"
              >
                <img :src="user.avatar" :alt="user.name" />
                <div class="member-info">
                  <h5>{{ user.name }}</h5>
                  <p>@{{ user.username }}</p>
                </div>
                <Icon 
                  v-if="selectedMembers.some(m => m.id === user.id)" 
                  name="check" 
                  size="16" 
                />
              </div>
            </div>
          </div>
          
          <div class="group-actions">
            <button @click="closeGroupModal" class="btn-secondary">
              Cancel
            </button>
            <button 
              @click="createGroup" 
              class="btn-primary"
              :disabled="!newGroupName.trim() || selectedMembers.length === 0"
            >
              Create Group
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Hidden File Input -->
    <input 
      ref="fileInput"
      type="file" 
      @change="handleFileSelect"
      class="hidden-file-input"
      multiple
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, onUnmounted } from 'vue'

// Page meta with authentication
definePageMeta({ 
  middleware: ['auth']
})

// Reactive data
const user = useSupabaseUser()
const currentUserId = computed(() => user.value?.id)

const selectedChat = ref(null)
const chats = ref([])
const searchQuery = ref('')
const newMessage = ref('')
const isTyping = ref(false)
const typingUser = ref({})
const showNewChatModal = ref(false)
const showGroupModal = ref(false)
const showAttachmentMenu = ref(false)
const showEmojiPicker = ref(false)
const showStickerPicker = ref(false)
const showVideoCall = ref(false)
const showChatInfo = ref(false)
const userSearchQuery = ref('')
const users = ref([])
const isMobile = ref(false)
const activeTab = ref('all')

// Translation
const showTranslationSuggestion = ref(false)
const suggestedTranslation = ref('')

// Voice recording
const isRecording = ref(false)
const recordingTime = ref('0:00')
const mediaRecorder = ref(null)
const recordingTimer = ref(null)

// Video call
const localVideo = ref(null)
const remoteVideo = ref(null)
const peerConnection = ref(null)
const isMuted = ref(false)
const isVideoEnabled = ref(true)
const isScreenSharing = ref(false)
const callDuration = ref('00:00')

// Group creation
const newGroupName = ref('')
const newGroupDescription = ref('')
const selectedMembers = ref([])
const memberSearchQuery = ref('')

// Emoji and stickers
const selectedEmojiCategory = ref('smileys')
const selectedStickerPack = ref(1)

const messagesContainer = ref(null)
const messageInput = ref(null)
const fileInput = ref(null)

// Emoji categories and data
const emojiCategories = [
  { name: 'smileys', icon: '😀' },
  { name: 'people', icon: '👋' },
  { name: 'nature', icon: '🌿' },
  { name: 'food', icon: '🍕' },
  { name: 'activities', icon: '⚽' },
  { name: 'travel', icon: '✈️' },
  { name: 'objects', icon: '💡' },
  { name: 'symbols', icon: '❤️' }
]

const emojiData = {
  smileys: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙'],
  people: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎'],
  nature: ['🌿', '🍀', '🎍', '🎋', '🍃', '🌾', '🌵', '🌱', '🌴', '🌳', '🌲', '🌰', '🌻', '🌺', '🌸', '🌼', '🌷', '🥀', '🌹', '🏵️'],
  food: ['🍕', '🍔', '🍟', '🌭', '🥪', '🌮', '🌯', '🥙', '🧆', '🥚', '🍳', '🥘', '🍲', '🥗', '🍿', '🧈', '🥞', '🧇', '🥓', '🍖'],
  activities: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳'],
  travel: ['✈️', '🛫', '🛬', '🪂', '💺', '🚁', '🚟', '🚠', '🚡', '🛰️', '🚀', '🛸', '🚂', '🚃', '🚄', '🚅', '🚆', '🚇', '🚈', '🚉'],
  objects: ['💡', '🔦', '🏮', '🪔', '📱', '💻', '🖥️', '🖨️', '⌨️', '🖱️', '🖲️', '💽', '💾', '💿', '📀', '🧮', '🎥', '🎞️', '📸', '📷'],
  symbols: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️']
}

// Sticker packs
const stickerPacks = [
  {
    id: 1,
    name: 'Happy Pack',
    preview: '/stickers/happy-pack/preview.png',
    stickers: [
      { id: 1, name: 'Happy', url: '/stickers/happy](streamdown:incomplete-link)
-pack/1.png' },
      { id: 2, name: 'Excited', url: '/stickers/happy-pack/2.png' },
      { id: 3, name: 'Love', url: '/stickers/happy-pack/3.png' }
    ]
  },
  {
    id: 2,
    name: 'Animals',
    preview: '/stickers/animals/preview.png',
    stickers: [
      { id: 4, name: 'Cat', url: '/stickers/animals/1.png' },
      { id: 5, name: 'Dog', url: '/stickers/animals/2.png' },
      { id: 6, name: 'Panda', url: '/stickers/animals/3.png' }
    ]
  }
]

// Computed properties
const unreadCount = computed(() => 
  chats.value.filter(chat => chat.unreadCount > 0).length
)

const filteredChats = computed(() => {
  let filtered = chats.value

  // Filter by tab
  if (activeTab.value === 'groups') {
    filtered = filtered.filter(chat => chat.isGroup)
  } else if (activeTab.value === 'unread') {
    filtered = filtered.filter(chat => chat.unreadCount > 0)
  }

  // Filter by search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(chat => 
      chat.name.toLowerCase().includes(query) ||
      chat.lastMessage.toLowerCase().includes(query)
    )
  }

  return filtered
})

const filteredUsers = computed(() => {
  if (!userSearchQuery.value) return users.value
  
  return users.value.filter(user => 
    user.name.toLowerCase().includes(userSearchQuery.value.toLowerCase()) ||
    user.username.toLowerCase().includes(userSearchQuery.value.toLowerCase())
  )
})

const filteredMemberUsers = computed(() => {
  if (!memberSearchQuery.value) return users.value
  
  return users.value.filter(user => 
    user.name.toLowerCase().includes(memberSearchQuery.value.toLowerCase()) ||
    user.username.toLowerCase().includes(memberSearchQuery.value.toLowerCase())
  )
})

const currentEmojis = computed(() => 
  emojiData[selectedEmojiCategory.value] || []
)

const currentStickers = computed(() => {
  const pack = stickerPacks.find(p => p.id === selectedStickerPack.value)
  return pack ? pack.stickers : []
})

// Utility function for debouncing
const debounce = (func, wait) => {
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

// Methods
const loadChats = async () => {
  try {
    // Mock data - replace with actual API call
    chats.value = [
      {
        id: 1,
        name: 'John Doe',
        avatar: '/avatars/john.jpg',
        lastMessage: 'Hey, how are you doing?',
        lastMessageTime: new Date(Date.now() - 1000 * 60 * 30),
        lastMessageType: 'text',
        unreadCount: 2,
        isOnline: true,
        isGroup: false,
        lastSeen: new Date(),
        messages: [
          {
            id: 1,
            senderId: 'other',
            senderName: 'John Doe',
            senderAvatar: '/avatars/john.jpg',
            type: 'text',
            content: 'Hey there!',
            timestamp: new Date(Date.now() - 1000 * 60 * 60),
            status: 'read'
          },
          {
            id: 2,
            senderId: currentUserId.value,
            type: 'text',
            content: 'Hi! How are you?',
            timestamp: new Date(Date.now() - 1000 * 60 * 45),
            status: 'read'
          },
          {
            id: 3,
            senderId: 'other',
            senderName: 'John Doe',
            senderAvatar: '/avatars/john.jpg',
            type: 'voice',
            content: '',
            duration: '0:15',
            voiceUrl: '/audio/voice-message-1.mp3',
            timestamp: new Date(Date.now() - 1000 * 60 * 30),
            status: 'delivered',
            isPlaying: false
          }
        ]
      },
      {
        id: 2,
        name: 'Team Project',
        avatar: null,
        lastMessage: 'Sarah: Let\'s meet tomorrow',
        lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 2),
        lastMessageType: 'text',
        unreadCount: 5,
        isOnline: false,
        isGroup: true,
        memberCount: 5,
        onlineMembers: 2,
        messages: [
          {
            id: 1,
            senderId: 'sarah',
            senderName: 'Sarah Wilson',
            senderAvatar: '/avatars/sarah.jpg',
            type: 'text',
            content: 'Let\'s meet tomorrow to discuss the project',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
            status: 'sent'
          },
          {
            id: 2,
            senderId: 'mike',
            senderName: 'Mike Johnson',
            senderAvatar: '/avatars/mike.jpg',
            type: 'file',
            content: '',
            fileName: 'project-requirements.pdf',
            fileSize: 2048576,
            fileUrl: '/files/project-requirements.pdf',
            timestamp: new Date(Date.now() - 1000 * 60 * 60),
            status: 'delivered'
          }
        ]
      }
    ]
  } catch (error) {
    console.error('Error loading chats:', error)
  }
}

const loadUsers = async () => {
  try {
    // Mock data - replace with actual API call
    users.value = [
      {
        id: 3,
        name: 'Mike Johnson',
        username: 'mikej',
        avatar: '/avatars/mike.jpg'
      },
      {
        id: 4,
        name: 'Sarah Wilson',
        username: 'sarahw',
        avatar: '/avatars/sarah.jpg'
      },
      {
        id: 5,
        name: 'Alex Chen',
        username: 'alexc',
        avatar: '/avatars/alex.jpg'
      }
    ]
  } catch (error) {
    console.error('Error loading users:', error)
  }
}

const selectChat = (chat) => {
  selectedChat.value = chat
  chat.unreadCount = 0
  
  nextTick(() => {
    scrollToBottom()
  })
}

const sendMessage = async () => {
  if (!newMessage.value.trim() || !selectedChat.value) return

  const message = {
    id: Date.now(),
    senderId: currentUserId.value,
    type: 'text',
    content: newMessage.value.trim(),
    timestamp: new Date(),
    status: 'sending'
  }

  selectedChat.value.messages.push(message)
  selectedChat.value.lastMessage = message.content
  selectedChat.value.lastMessageTime = message.timestamp
  selectedChat.value.lastMessageType = 'text'

  newMessage.value = ''
  hideAllPickers()

  nextTick(() => {
    scrollToBottom()
  })

  try {
    await new Promise(resolve => setTimeout(resolve, 1000))
    message.status = 'sent'
    
    setTimeout(() => {
      message.status = 'delivered'
    }, 2000)
  } catch (error) {
    console.error('Error sending message:', error)
    message.status = 'failed'
  }
}

const sendSticker = async (sticker) => {
  if (!selectedChat.value) return

  const message = {
    id: Date.now(),
    senderId: currentUserId.value,
    type: 'sticker',
    content: '',
    stickerUrl: sticker.url,
    stickerName: sticker.name,
    timestamp: new Date(),
    status: 'sending'
  }

  selectedChat.value.messages.push(message)
  selectedChat.value.lastMessage = 'Sticker'
  selectedChat.value.lastMessageTime = message.timestamp
  selectedChat.value.lastMessageType = 'sticker'

  hideAllPickers()

  nextTick(() => {
    scrollToBottom()
  })

  try {
    await new Promise(resolve => setTimeout(resolve, 1000))
    message.status = 'sent'
  } catch (error) {
    console.error('Error sending sticker:', error)
    message.status = 'failed'
  }
}

// Translation methods
const translateMessage = async (message, targetLanguage = 'en') => {
  try {
    // Mock translation - replace with actual translation API
    const translatedText = `[Translated to ${targetLanguage}]: ${message.content}`
    
    // Add translation to message
    message.translation = {
      text: translatedText,
      language: targetLanguage,
      original: message.content
    }
    
    return translatedText
  } catch (error) {
    console.error('Translation error:', error)
    return message.content
  }
}

// Language detection
const detectLanguage = async (text) => {
  try {
    // Mock language detection - replace with actual API
    const commonWords = {
      'es': ['hola', 'como', 'que', 'es', 'la', 'el'],
      'fr': ['bonjour', 'comment', 'que', 'est', 'le', 'la'],
      'de': ['hallo', 'wie', 'was', 'ist', 'der', 'die'],
      'it': ['ciao', 'come', 'che', 'è', 'il', 'la']
    }
    
    const lowerText = text.toLowerCase()
    
    for (const [lang, words] of Object.entries(commonWords)) {
      if (words.some(word => lowerText.includes(word))) {
        return lang
      }
    }
    
    return 'en' // Default to English
  } catch (error) {
    console.error('Language detection error:', error)
    return 'en'
  }
}

// Typing indicator with translation
const handleTypingWithTranslation = debounce(async () => {
  if (!newMessage.value.trim()) {
    showTranslationSuggestion.value = false
    return
  }
  
  // Detect language and offer translation
  const detectedLanguage = await detectLanguage(newMessage.value)
  
  if (detectedLanguage !== 'en') {
    // Show translation suggestion
    showTranslationSuggestion.value = true
    suggestedTranslation.value = await translateMessage(
      { content: newMessage.value }, 
      'en'
    )
  } else {
    showTranslationSuggestion.value = false
  }
  
  // Send typing indicator
  if (selectedChat.value) {
    // Emit typing event to other users
    console.log('User is typing...')
  }
}, 500)

const useTranslation = () => {
  newMessage.value = suggestedTranslation.value.replace('[Translated to en]: ', '')
  showTranslationSuggestion.value = false
  messageInput.value?.focus()
}

const dismissTranslation = () => {
  showTranslationSuggestion.value = false
}

// Voice recording methods
const startRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaRecorder.value = new MediaRecorder(stream)
    
    const audioChunks = []
    mediaRecorder.value.ondataavailable = (event) => {
      audioChunks.push(event.data)
    }
    
    mediaRecorder.value.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/wav' })
      sendVoiceMessage(audioBlob)
      stream.getTracks().forEach(track => track.stop())
    }
    
    mediaRecorder.value.start()
    isRecording.value = true
    startRecordingTimer()
  } catch (error) {
    console.error('Error starting recording:', error)
  }
}

const stopRecording = () => {
  if (mediaRecorder.value && isRecording.value) {
    mediaRecorder.value.stop()
    isRecording.value = false
    stopRecordingTimer()
  }
}

const cancelRecording = () => {
  if (mediaRecorder.value && isRecording.value) {
    mediaRecorder.value.stop()
    isRecording.value = false
    stopRecordingTimer()
    // Don't send the message
  }
}

const startRecordingTimer = () => {
  let seconds = 0
  recordingTimer.value = setInterval(() => {
    seconds++
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    recordingTime.value = `${mins}:${secs.toString().padStart(2, '0')}`
  }, 1000)
}

const stopRecordingTimer = () => {
  if (recordingTimer.value) {
    clearInterval(recordingTimer.value)
    recordingTimer.value = null
    recordingTime.value = '0:00'
  }
}

const sendVoiceMessage = async (audioBlob) => {
  if (!selectedChat.value) return

  // Create a URL for the audio blob
  const audioUrl = URL.createObjectURL(audioBlob)
  
  const message = {
    id: Date.now(),
    senderId: currentUserId.value,
    type: 'voice',
    content: '',
    voiceUrl: audioUrl,
    duration: recordingTime.value,
    timestamp: new Date(),
    status: 'sending',
    isPlaying: false
  }

  selectedChat.value.messages.push(message)
  selectedChat.value.lastMessage = 'Voice message'
  selectedChat.value.lastMessageTime = message.timestamp
  selectedChat.value.lastMessageType = 'voice'

  nextTick(() => {
    scrollToBottom()
  })

  try {
    // Here you would upload the audio blob to your server
    await new Promise(resolve => setTimeout(resolve, 2000))
    message.status = 'sent'
  } catch (error) {
    console.error('Error sending voice message:', error)
    message.status = 'failed'
  }
}

const toggleVoicePlayback = (message) => {
  // Simple toggle - in real app, you'd use proper audio controls
  message.isPlaying = !message.isPlaying
  
  if (message.isPlaying) {
    const audio = new Audio(message.voiceUrl)
    audio.play()
    audio.onended = () => {
      message.isPlaying = false
    }
  }
}

// Enhanced WebRTC setup for better call quality
const setupWebRTC = async () => {
  const configuration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      // Add TURN servers for better connectivity
      {
        urls: 'turn:your-turn-server.com:3478',
        username: 'your-username',
        credential: 'your-password'
      }
    ],
    iceCandidatePoolSize: 10
  }
  
  peerConnection.value = new RTCPeerConnection(configuration)
  
  // Handle ICE candidates
  peerConnection.value.onicecandidate = (event) => {
    if (event.candidate) {
      // Send candidate to remote peer
      console.log('ICE candidate:', event.candidate)
    }
  }
  
  // Handle connection state changes
  peerConnection.value.onconnectionstatechange = () => {
    console.log('Connection state:', peerConnection.value.connectionState)
    
    if (peerConnection.value.connectionState === 'connected') {
      console.log('Call connected successfully')
    } else if (peerConnection.value.connectionState === 'failed') {
      console.log('Call failed')
      endCall()
    }
  }
  
  return peerConnection.value
}

// Video call methods
const startVideoCall = async () => {
  try {
    showVideoCall.value = true
    
    // Get user media
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: true, 
      audio: true 
    })
    
    if (localVideo.value) {
      localVideo.value.srcObject = stream
    }
    
    // Initialize WebRTC peer connection
    await setupWebRTC()
    
    // Add local stream to peer connection
    stream.getTracks().forEach(track => {
      peerConnection.value.addTrack(track, stream)
    })
    
    // Handle remote stream
    peerConnection.value.ontrack = (event) => {
      if (remoteVideo.value) {
        remoteVideo.value.srcObject = event.streams[0]
      }
    }
    
    startCallTimer()
  } catch (error) {
    console.error('Error starting video call:', error)
  }
}

const startVoiceCall = async () => {
  try {
    // Similar to video call but audio only
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: false, 
      audio: true 
    })
    
    // Initialize voice call UI and WebRTC
    console.log('Starting voice call...')
  } catch (error) {
    console.error('Error starting voice call:', error)
  }
}

const startScreenShare = async () => {
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({ 
      video: true, 
      audio: true 
    })
    
    if (peerConnection.value) {
      // Replace video track with screen share
      const videoTrack = stream.getVideoTracks()[0]
      const sender = peerConnection.value.getSenders().find(s => 
        s.track && s.track.kind === 'video'
      )
      
      if (sender) {
        await sender.replaceTrack(videoTrack)
        isScreenSharing.value = true
      }
    }
  } catch (error) {
    console.error('Error starting screen share:', error)
  }
}

const toggleMute = () => {
  isMuted.value = !isMuted.value
  if (localVideo.value && localVideo.value.srcObject) {
    const audioTracks = localVideo.value.srcObject.getAudioTracks()
    audioTracks.forEach(track => {
      track.enabled = !isMuted.value
    })
  }
}

const toggleVideo = () => {
  isVideoEnabled.value = !isVideoEnabled.value
  if (localVideo.value && localVideo.value.srcObject) {
    const videoTracks = localVideo.value.srcObject.getVideoTracks()
    videoTracks.forEach(track => {
      track.enabled = isVideoEnabled.value
    })
  }
}

const toggleScreenShare = async () => {
  if (isScreenSharing.value) {
    // Stop screen sharing and return to camera
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      })
      
      const videoTrack = stream.getVideoTracks()[0]
      const sender = peerConnection.value.getSenders().find(s => 
        s.track && s.track.kind === 'video'
      )
      
      if (sender) {
        await sender.replaceTrack(videoTrack)
        isScreenSharing.value = false
      }
    } catch (error) {
      console.error('Error stopping screen share:', error)
    }
  } else {
    await startScreenShare()
  }
}

const endCall = () => {
  if (peerConnection.value) {
    peerConnection.value.close()
    peerConnection.value = null
  }
  
  if (localVideo.value && localVideo.value.srcObject) {
    localVideo.value.srcObject.getTracks().forEach(track => track.stop())
  }
  
  showVideoCall.value = false
  isMuted.value = false
  isVideoEnabled.value = true
  isScreenSharing.value = false
  callDuration.value = '00:00'
}

const startCallTimer = () => {
  let seconds = 0
  const timer = setInterval(() => {
    if (!showVideoCall.value) {
      clearInterval(timer)
      return
    }
    
    seconds++
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    callDuration.value = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }, 1000)
}

// Screen recording for screen share
const startScreenRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: { mediaSource: 'screen' },
      audio: true
    })
    
    const mediaRecorder = new MediaRecorder(stream)
    const chunks = []
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data)
      }
    }
    
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' })
      const videoUrl = URL.createObjectURL(blob)
      
      // Send as video message
      sendVideoMessage(videoUrl, 'Screen Recording')
    }
    
    // Stop recording after 30 seconds or when user stops
    setTimeout(() => {
      if (mediaRecorder.state === 'recording') {
        mediaRecorder.stop()
        stream.getTracks().forEach(track => track.stop())
      }
    }, 30000)
    
    mediaRecorder.start()
    showAttachmentMenu.value = false
    
  } catch (error) {
    console.error('Error starting screen recording:', error)
  }
}

// Send video message
const sendVideoMessage = async (videoUrl, caption = '') => {
  if (!selectedChat.value) return

  const message = {
    id: Date.now(),
    senderId: currentUserId.value,
    type: 'video',
    content: caption,
    videoUrl: videoUrl,
    timestamp: new Date(),
    status: 'sending'
  }

  selectedChat.value.messages.push(message)
  selectedChat.value.lastMessage = 'Video'
  selectedChat.value.lastMessageTime = message.timestamp
  selectedChat.value.lastMessageType = 'video'

  nextTick(() => {
    scrollToBottom()
  })

  try {
    await new Promise(resolve => setTimeout(resolve, 2000))
    message.status = 'sent'
  } catch (error) {
    console.error('Error sending video:', error)
    message.status = 'failed'
  }
}

// File handling methods
const selectFile = (type) => {
  if (fileInput.value) {
    switch (type) {
      case 'image':
        fileInput.value.accept = 'image/*'
        break
      case 'video':
        fileInput.value.accept = 'video/*'
        break
      case 'file':
        fileInput.value.accept = '*'
        break
    }
    fileInput.value.click()
  }
  showAttachmentMenu.value = false
}

const handleFileSelect = async (event) => {
  const files = Array.from(event.target.files)
  
  for (const file of files) {
    await sendFileMessageWithProgress(file)
  }
  
  // Clear the input
  event.target.value = ''
}

// Enhanced file upload with progress
const sendFileMessageWithProgress = async (file) => {
  if (!selectedChat.value) return

  const fileUrl = URL.createObjectURL(file)
  let messageType = 'file'
  
  if (file.type.startsWith('image/')) {
    messageType = 'image'
  } else if (file.type.startsWith('video/')) {
    messageType = 'video'
  } else if (file.type.startsWith('audio/')) {
    messageType = 'audio'
  }

  const message = {
    id: Date.now(),
    senderId: currentUserId.value,
    type: messageType,
    content: '',
    timestamp: new Date(),
    status: 'uploading',
    uploadProgress: 0
  }

  if (messageType === 'image') {
    message.imageUrl = fileUrl
  } else if (messageType === 'video') {
    message.videoUrl = fileUrl
  } else if (messageType === 'audio') {
    message.audioUrl = fileUrl
  } else {
    message.fileName = file.name
    message.fileSize = file.size
    message.fileUrl = fileUrl
  }

  selectedChat.value.messages.push(message)
  selectedChat.value.lastMessage = messageType === 'image' ? 'Photo' : 
                                   messageType === 'video' ? 'Video' :
                                   messageType === 'audio' ? 'Audio' : file.name
  selectedChat.value.lastMessageTime = message.timestamp
  selectedChat.value.lastMessageType = messageType

  nextTick(() => {
    scrollToBottom()
  })

  try {
    // Simulate file upload with progress
    for (let progress = 0; progress <= 100; progress += 10) {
      message.uploadProgress = progress
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    
    message.status = 'sent'
    delete message.uploadProgress
  } catch (error) {
    console.error('Error uploading file:', error)
    message.status = 'failed'
  }
}

const downloadFile = (message) => {
  const link = document.createElement('a')
  link.href = message.fileUrl
  link.download = message.fileName
  link.click()
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Group management methods
const createGroup = async () => {
  if (!newGroupName.value.trim() || selectedMembers.value.length === 0) return

  try {
    const newGroup = {
      id: Date.now(),
      name: newGroupName.value.trim(),
      description: newGroupDescription.value.trim(),
      isGroup: true,
      memberCount: selectedMembers.value.length + 1, // +1 for current user
      onlineMembers: 1,
      lastMessage: 'Group created',
      lastMessageTime: new Date(),
      lastMessageType: 'system',
      unreadCount: 0,
      messages: [
        {
          id: 1,
          type: 'system',
          content: `${user.value?.user_metadata?.display_name || 'You'} created the group`,
          timestamp: new Date(),
          status: 'sent'
        }
      ]
    }

    chats.value.unshift(newGroup)
    selectChat(newGroup)
    closeGroupModal()
  } catch (error) {
    console.error('Error creating group:', error)
  }
}

const addMember = (user) => {
  if (!selectedMembers.value.some(m => m.id === user.id)) {
    selectedMembers.value.push(user)
  }
}

const removeMember = (userId) => {
  selectedMembers.value = selectedMembers.value.filter(m => m.id !== userId)
}

// UI helper methods
const insertEmoji = (emoji) => {
  newMessage.value += emoji
  messageInput.value?.focus()
}

const hideAllPickers = () => {
  showAttachmentMenu.value = false
  showEmojiPicker.value = false
  showStickerPicker.value = false
}

const handleKeyDown = (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
}

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const startNewChat = (user) => {
  const existingChat = chats.value.find(chat => 
    !chat.isGroup && chat.userId === user.id
  )
  
  if (existingChat) {
    selectChat(existingChat)
  } else {
    const newChat = {
      id: Date.now(),
      userId: user.id,
      name: user.name,
      avatar: user.avatar,
      lastMessage: '',
      lastMessageTime: new Date(),
      lastMessageType: 'text',
      unreadCount: 0,
      isOnline: false,
      isGroup: false,
      lastSeen: new Date(),
      messages: []
    }
    
    chats.value.unshift(newChat)
    selectChat(newChat)
  }
  
  closeNewChatModal()
}

const closeNewChatModal = () => {
  showNewChatModal.value = false
  userSearchQuery.value = ''
}

const closeGroupModal = () => {
  showGroupModal.value = false
  newGroupName.value = ''
  newGroupDescription.value = ''
  selectedMembers.value = []
  memberSearchQuery.value = ''
}

const openImageModal = (imageUrl) => {
  // Implement image modal/lightbox
  console.log('Opening image:', imageUrl)
}

const getMessageStatusIcon = (status) => {
  switch (status) {
    case 'sending': return 'clock'
    case 'uploading': return 'upload'
    case 'sent': return 'check'
    case 'delivered': return 'check-check'
    case 'read': return 'check-check'
    case 'failed': return 'x'
    default: return 'check'
  }
}

const formatTime = (date) => {
  const now = new Date()
  const diff = now - date
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 1) return 'now'
  if (minutes < 60) return `${minutes}m`
  if (hours < 24) return `${hours}h`
  if (days < 7) return `${days}d`
  return date.toLocaleDateString()
}

const formatMessageTime = (date) => {
  return date.toLocaleTimeString('en-*
US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  })
}

const formatLastSeen = (date) => {
  const now = new Date()
  const diff = now - date
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))

  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} minutes ago`
  if (hours < 24) return `${hours} hours ago`
  return date.toLocaleDateString()
}

const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
}

// Click outside to close pickers
const handleClickOutside = (event) => {
  if (!event.target.closest('.emoji-picker') && 
      !event.target.closest('.emoji-btn')) {
    showEmojiPicker.value = false
  }
  
  if (!event.target.closest('.sticker-picker') && 
      !event.target.closest('.sticker-btn')) {
    showStickerPicker.value = false
  }
  
  if (!event.target.closest('.attachment-menu') && 
      !event.target.closest('.attachment-btn')) {
    showAttachmentMenu.value = false
  }
  
  if (!event.target.closest('.translation-suggestion')) {
    showTranslationSuggestion.value = false
  }
}

// Lifecycle
onMounted(() => {
  loadChats()
  loadUsers()
  checkMobile()
  window.addEventListener('resize', checkMobile)
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
  document.removeEventListener('click', handleClickOutside)
  
  // Clean up media streams
  if (localVideo.value && localVideo.value.srcObject) {
    localVideo.value.srcObject.getTracks().forEach(track => track.stop())
  }
  
  if (peerConnection.value) {
    peerConnection.value.close()
  }
  
  if (recordingTimer.value) {
    clearInterval(recordingTimer.value)
  }
})
</script>

<style scoped>
/* Base styles */
.chat-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.chat-container {
  display: flex;
  height: 100%;
  max-height: calc(100vh - 4rem);
  background: white;
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Enhanced Sidebar */
.chat-sidebar {
  width: 320px;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  background: #f9fafb;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.sidebar-header h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.sidebar-actions {
  display: flex;
  gap: 0.5rem;
}

.new-chat-btn,
.new-group-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #3b82f6;
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.new-group-btn {
  background: #10b981;
}

.search-section {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-box svg {
  position: absolute;
  left: 0.75rem;
  color: #6b7280;
}

.search-input {
  width: 100%;
  padding: 0.75rem 0.75rem 0.75rem 2.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  background: white;
}

.chat-tabs {
  display: flex;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.tab-btn {
  flex: 1;
  padding: 0.75rem;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.875rem;
  color: #6b7280;
  transition: all 0.2s;
}

.tab-btn.active {
  color: #3b82f6;
  background: white;
  border-bottom: 2px solid #3b82f6;
}

.chat-list {
  flex: 1;
  overflow-y: auto;
}

.chat-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid #f3f4f6;
}

.chat-item:hover {
  background: #f3f4f6;
}

.chat-item.active {
  background: #e0e7ff;
  border-right: 3px solid #3b82f6;
}

.chat-avatar {
  position: relative;
}

.avatar-img {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.group-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #e0e7ff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3730a3;
}

.online-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  background: #10b981;
  border: 2px solid white;
  border-radius: 50%;
}

.unread-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #ef4444;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.125rem 0.375rem;
  border-radius: 9999px;
  min-width: 18px;
  text-align: center;
}

.chat-info {
  flex: 1;
  min-width: 0;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
}

.chat-name {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.group-indicator {
  color: #6b7280;
}

.chat-time {
  font-size: 0.75rem;
  color: #6b7280;
}

.chat-preview {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.last-message {
  margin: 0;
  font-size: 0.875rem;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.message-type-icon {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: #6b7280;
  font-style: italic;
}

/* Main Chat Area */
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.no-chat-selected {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  text-align: center;
}

.no-chat-selected h3 {
  margin: 1rem 0 0.5rem 0;
  color: #1f2937;
}

.chat-area {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  background: white;
}

.back-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  padding: 0.5rem;
  border-radius: 0.375rem;
}

.chat-user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.header-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.group-avatar-header {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e0e7ff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3730a3;
}

.user-details h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.user-status {
  margin: 0;
  font-size: 0.75rem;
  color: #6b7280;
}

.chat-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: none;
  border: 1px solid #e5e7eb;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  transition: all 0.2s;
}

.action-btn:hover:not(:disabled) {
  background: #f3f4f6;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Translation Suggestion */
.translation-suggestion {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 0.5rem;
  padding: 0.75rem;
  margin: 0.5rem 1rem;
}

.translation-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.use-translation-btn {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 0.25rem 0.75rem;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
}

.dismiss-translation-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  padding: 0.25rem;
  border-radius: 0.25rem;
}

.suggested-text {
  font-style: italic;
  color: #374151;
  font-size: 0.875rem;
}

/* Messages */
.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.message {
  display: flex;
  gap: 0.75rem;
  max-width: 70%;
}

.message.own-message {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message-avatar,
.sender-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.message-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.own-message .message-content {
  align-items: flex-end;
}

.sender-name {
  font-size: 0.75rem;
  font-weight: 600;
  color: #3b82f6;
  margin-bottom: 0.25rem;
}

.message-bubble {
  background: #f3f4f6;
  padding: 0.75rem 1rem;
  border-radius: 1rem;
  max-width: 100%;
  word-wrap: break-word;
}

.own-message .message-bubble {
  background: #3b82f6;
  color: white;
}

.message-bubble p {
  margin: 0;
  line-height: 1.4;
}

.message-translation {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  font-size: 0.875rem;
  font-style: italic;
  opacity: 0.9;
}

/* Voice Message */
.voice-message {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  background: #f3f4f6;
  border-radius: 1rem;
  min-width: 200px;
}

.voice-play-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #3b82f6;
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.voice-waveform {
  flex: 1;
  height: 24px;
  display: flex;
  align-items: center;
}

.waveform-bars {
  display: flex;
  align-items: center;
  gap: 2px;
  width: 100%;
}

.waveform-bar {
  width: 3px;
  height: 12px;
  background: #d1d5db;
  border-radius: 1px;
  animation: waveform 1.5s ease-in-out infinite;
}

.waveform-bar:nth-child(odd) {
  animation-delay: 0.1s;
}

.waveform-bar:nth-child(even) {
  animation-delay: 0.3s;
}

@keyframes waveform {
  0%, 100% { height: 8px; }
  50% { height: 20px; }
}

.voice-duration {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
}

/* File Message */
.file-message {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #f3f4f6;
  border-radius: 0.75rem;
  min-width: 200px;
}

.file-icon {
  width: 40px;
  height: 40px;
  background: #e5e7eb;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
}

.file-info {
  flex: 1;
}

.file-name {
  font-weight: 500;
  color: #1f2937;
  font-size: 0.875rem;
}

.file-size {
  font-size: 0.75rem;
  color: #6b7280;
}

.upload-progress {
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.progress-bar {
  flex: 1;
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #3b82f6;
  transition: width 0.3s ease;
}

.file-download-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #3b82f6;
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Image Message */
.image-message {
  max-width: 300px;
}

.message-image {
  width: 100%;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: transform 0.2s;
}

.message-image:hover {
  transform: scale(1.02);
}

.image-caption {
  margin: 0.5rem 0 0 0;
  font-size: 0.875rem;
  color: #1f2937;
}

/* Video Message */
.video-message {
  max-width: 300px;
}

.message-video {
  width: 100%;
  border-radius: 0.75rem;
}

.video-caption {
  margin: 0.5rem 0 0 0;
  font-size: 0.875rem;
  color: #1f2937;
}

/* Sticker Message */
.sticker-message {
  background: none !important;
  padding: 0 !important;
}

.sticker-image {
  width: 120px;
  height: 120px;
  object-fit: contain;
}

/* System Message */
.system-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-style: italic;
  color: #6b7280;
  font-size: 0.875rem;
  background: #f9fafb !important;
  border: 1px solid #e5e7eb !important;
}

.message-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #6b7280;
}

.own-message .message-meta {
  flex-direction: row-reverse;
}

.translate-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  padding: 0.125rem;
  border-radius: 0.25rem;
  transition: all 0.2s;
}

.translate-btn:hover {
  background: #f3f4f6;
  color: #3b82f6;
}

.status-icon.read {
  color: #3b82f6;
}

.status-icon.failed {
  color: #ef4444;
}

/* Typing Indicator */
.typing-indicator {
  display: flex;
  gap: 0.75rem;
  align-items: flex-end;
}

.typing-bubble {
  background: #f3f4f6;
  padding: 0.75rem 1rem;
  border-radius: 1rem;
}

.typing-dots {
  display: flex;
  gap: 0.25rem;
}

.typing-dots span {
  width: 6px;
  height: 6px;
  background: #6b7280;
  border-radius: 50%;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-dots span:nth-child(1) { animation-delay: 0s; }
.typing-dots span:nth-child(2) { animation-delay: 0.2s; }
.typing-dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-10px);
    opacity: 1;
  }
}

/* Voice Recording Overlay */
.voice-recording-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(59, 130, 246, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  border-radius: 0.75rem;
}

.recording-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: white;
}

.recording-animation {
  position: relative;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.recording-pulse {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 2px solid white;
  border-radius: 50%;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0% {
    transform: scale(0.8);
    opacity: 1;
  }
  100% {
    transform: scale(1.4);
    opacity: 0;
  }
}

.recording-info {
  text-align: center;
}

.recording-text {
  display: block;
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.recording-time {
  font-size: 1.5rem;
  font-weight: 700;
}

.recording-actions {
  display: flex;
  gap: 1rem;
}

.cancel-recording-btn,
.stop-recording-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 2px solid white;
  background: transparent;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.cancel-recording-btn:hover {
  background: rgba(239, 68, 68, 0.2);
}

.stop-recording-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* Message Input */
.message-input-area {
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
  background: white;
  position: relative;
}

.input-container {
  display: flex;
  align-items: flex-end;
  gap: 0.75rem;
}

.attachment-btn,
.send-btn,
.voice-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.attachment-btn {
  background: #f3f4f6;
  color: #6b7280;
}

.attachment-btn:hover {
  background: #e5e7eb;
}

.send-btn {
  background: #3b82f6;
  color: white;
}

.send-btn:disabled {
  background: #d1d5db;
  cursor: not-allowed;
}

.voice-btn {
  background: #3b82f6;
  color: white;
}

.voice-btn.recording {
  background: #ef4444;
  animation: recording-pulse 1s ease-in-out infinite;
}

@keyframes recording-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.text-input-container {
  flex: 1;
  position: relative;
  display: flex;
  align-items: flex-end;
}

.message-input {
  flex: 1;
  padding: 0.75rem 4rem 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 1.5rem;
  resize: none;
  max-height: 120px;
  font-family: inherit;
  line-height: 1.4;
}

.input-actions {
  position: absolute;
  right: 0.5rem;
  bottom: 0.25rem;
  display: flex;
  gap: 0.25rem;
}

.emoji-btn,
.sticker-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f3f4f6;
  color: #6b7280;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.emoji-btn:hover,
.sticker-btn:hover {
  background: #e5e7eb;
}

/* Attachment Menu */
.attachment-menu {
  position: absolute;
  bottom: 100%;
  left: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 10;
  margin-bottom: 0.5rem;
}

.attachment-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  width: 100%;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: background-color 0.2s;
}

.attachment-option:hover {
  background: #f3f4f6;
}

/* Emoji Picker */
.emoji-picker {
  position: absolute;
  bottom: 100%;
  right: 0;
  width: 320px;
  height: 300px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  z-index: 50;
  margin-bottom: 0.5rem;
  display: flex;
  flex-direction: column;
}

.emoji-categories {
  display: flex;
  border-bottom: 1px solid #e5e7eb;
  padding: 0.5rem;
  gap: 0.25rem;
}

.emoji-category-btn {
  width: 32px;
  height: 32px;
  border-radius: 0.375rem;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.125rem;
  transition: all 0.2s;
}

.emoji-category-btn:hover {
  background: #f3f4f6;
}

.emoji-category-btn.active {
  background: #e0e7ff;
}

.emoji-grid {
  flex: 1;
  padding: 0.5rem;
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 0.25rem;
  overflow-y: auto;
}

.emoji-btn {
  width: 32px;
  height: 32px;
  border-radius: 0.375rem;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.25rem;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.emoji-btn:hover {
  background: #f3f4f6;
  transform: scale(1.2);
}

/* Sticker Picker */
.sticker-picker {
  position: absolute;
  bottom: 100%;
  right: 0;
  width: 320px;
  height: 300px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  z-index: 50;
  margin-bottom: 0.5rem;
  display: flex;
  flex-direction: column;
}

.sticker-packs {
  display: flex;
  border-bottom: 1px solid #e5e7eb;
  padding: 0.5rem;
  gap: 0.5rem;
}

.sticker-pack-btn {
  width: 40px;
  height: 40px;
  border-radius: 0.5rem;
  background: #f3f4f6;
  border: 2px solid transparent;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.2s;
}

.sticker-pack-btn.active {
  border-color: #3b82f6;
}

.sticker-pack-btn img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.sticker-grid {
  flex: 1;
  padding: 0.5rem;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
  overflow-y: auto;
}

.sticker-btn {
  aspect-ratio: 1;
  border-radius: 0.5rem;
  background: none;
  border: none;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.2s;
}

.sticker-btn:hover {
  transform: scale(1.05);
}

.sticker-btn img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* Video Call Modal */
.video-call-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #000;
  z-index: 1000;
  display: flex;
  flex-direction: column;*
}

.video-call-container {
  flex: 1;
  position: relative;
  display: flex;
  flex-direction: column;
}

.video-streams {
  flex: 1;
  position: relative;
}

.remote-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: #1f2937;
}

.local-video {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 200px;
  height: 150px;
  border-radius: 0.75rem;
  object-fit: cover;
  background: #374151;
  border: 2px solid white;
}

.call-controls {
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 1rem;
  background: rgba(0, 0, 0, 0.7);
  padding: 1rem;
  border-radius: 2rem;
  backdrop-filter: blur(10px);
}

.control-btn {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.control-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.control-btn.active {
  background: #ef4444;
}

.control-btn.end-call {
  background: #ef4444;
}

.control-btn.end-call:hover {
  background: #dc2626;
}

.call-info {
  position: absolute;
  top: 2rem;
  left: 2rem;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.call-info h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.call-info p {
  margin: 0;
  font-size: 1rem;
  opacity: 0.9;
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
  max-height: 80vh;
  overflow: hidden;
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

.new-chat-content {
  padding: 1rem;
}

.search-users {
  margin-bottom: 1rem;
}

.users-list {
  max-height: 300px;
  overflow-y: auto;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  cursor: pointer;
  border-radius: 0.5rem;
  transition: background-color 0.2s;
}

.user-item:hover {
  background: #f3f4f6;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.user-info h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.user-info p {
  margin: 0;
  font-size: 0.875rem;
  color: #6b7280;
}

/* Group Creation Modal */
.new-group-content {
  padding: 1.5rem;
  max-height: 70vh;
  overflow-y: auto;
}

.group-info-section {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.group-avatar-upload {
  position: relative;
}

.group-avatar-placeholder {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  border: 2px dashed #d1d5db;
}

.upload-group-avatar-btn {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #3b82f6;
  color: white;
  border: 2px solid white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.group-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.group-name-input,
.group-description-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 1rem;
  resize: vertical;
}

.member-selection h4 {
  margin: 0 0 1rem 0;
  color: #1f2937;
  font-size: 1.125rem;
  font-weight: 600;
}

.search-members {
  margin-bottom: 1rem;
}

.selected-members {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
  min-height: 40px;
  padding: 0.5rem;
  background: #f9fafb;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
}

.selected-member {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #3b82f6;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 1rem;
  font-size: 0.875rem;
}

.selected-member img {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  object-fit: cover;
}

.selected-member button {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.available-members {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
}

.member-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid #f3f4f6;
}

.member-item:hover {
  background: #f9fafb;
}

.member-item.selected {
  background: #eff6ff;
  color: #1e40af;
}

.member-item:last-child {
  border-bottom: none;
}

.member-item img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.member-info {
  flex: 1;
}

.member-info h5 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.member-info p {
  margin: 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.group-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.btn-primary,
.btn-secondary {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #3b82f6;
  color: white;
  border: none;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-primary:disabled {
  background: #d1d5db;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.empty-chats {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  color: #6b7280;
}

.empty-chats h3 {
  margin: 1rem 0 0.5rem 0;
  color: #1f2937;
}

.hidden-file-input {
  display: none;
}

/* Responsive Design */
@media (max-width: 768px) {
  .chat-container {
    height: 100vh;
    border-radius: 0;
  }
  
  .chat-sidebar {
    width: 100%;
    position: absolute;
    z-index: 10;
    height: 100%;
  }
  
  .sidebar-hidden {
    display: none;
  }
  
  .chat-main {
    width: 100%;
  }
  
  .main-hidden {
    display: none;
  }
  
  .message {
    max-width: 85%;
  }
  
  .chat-actions {
    gap: 0.25rem;
  }
  
  .action-btn {
    width: 36px;
    height: 36px;
  }
  
  .local-video {
    width: 120px;
    height: 90px;
    top: 0.5rem;
    right: 0.5rem;
  }
  
  .call-controls {
    bottom: 1rem;
    gap: 0.75rem;
    padding: 0.75rem;
  }
  
  .control-btn {
    width: 48px;
    height: 48px;
  }
  
  .emoji-picker,
  .sticker-picker {
    width: 280px;
    height: 250px;
  }
  
  .voice-message {
    min-width: 180px;
  }
  
  .file-message {
    min-width: 180px;
  }
  
  .group-info-section {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .selected-members {
    justify-content: center;
  }
  
  .group-actions {
    flex-direction: column;
  }
  
  .translation-suggestion {
    margin: 0.5rem;
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .recording-pulse,
  .voice-btn.recording,
  .waveform-bar,
  .typing-dots span {
    animation: none;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .chat-container {
    background: #1f2937;
    color: #f9fafb;
  }
  
  .chat-sidebar {
    background: #111827;
    border-right-color: #374151;
  }
  
  .chat-tabs {
    background: #111827;
  }
  
  .tab-btn.active {
    background: #1f2937;
  }
  
  .chat-item:hover {
    background: #374151;
  }
  
  .chat-item.active {
    background: #1e40af;
  }
  
  .message-bubble {
    background: #374151;
    color: #f9fafb;
  }
  
  .own-message .message-bubble {
    background: #3b82f6;
  }
  
  .voice-message,
  .file-message {
    background: #374151;
  }
  
  .system-message {
    background: #374151 !important;
    border-color: #4b5563 !important;
  }
  
  .emoji-picker,
  .sticker-picker {
    background: #1f2937;
    border-color: #374151;
  }
  
  .emoji-category-btn:hover {
    background: #374151;
  }
  
  .emoji-category-btn.active {
    background: #1e40af;
  }
  
  .modal-content {
    background: #1f2937;
    color: #f9fafb;
  }
  
  .translation-suggestion {
    background: #1e40af;
    border-color: #3b82f6;
  }
  
  .group-avatar-placeholder {
    background: #374151;
    border-color: #4b5563;
  }
  
  .selected-members {
    background: #374151;
    border-color: #4b5563;
  }
  
  .available-members {
    border-color: #4b5563;
  }
  
  .member-item:hover {
    background: #374151;
  }
  
  .member-item.selected {
    background: #1e40af;
    color: #f9fafb;
  }
}

/* Print styles */
@media print {
  .chat-sidebar,
  .message-input-area,
  .chat-actions,
  .voice-recording-overlay,
  .attachment-menu,
  .emoji-picker,
  .sticker-picker {
    display: none;
  }
  
  .chat-main {
    width: 100%;
  }
  
  .message-bubble {
    background: #f3f4f6 !important;
    color: #1f2937 !important;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .chat-item.active {
    border-right: 4px solid #000;
  }
  
  .message-bubble {
    border: 1px solid #000;
  }
  
  .own-message .message-bubble {
    background: #000;
    color: #fff;
  }
}

/* Focus styles for accessibility */
.chat-item:focus,
.user-item:focus,
.member-item:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.action-btn:focus,
.control-btn:focus,
.emoji-btn:focus,
.sticker-btn:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* Smooth scrolling */
.messages-container,
.chat-list,
.users-list,
.available-members {
  scroll-behavior: smooth;
}

/* Custom scrollbar */
.messages-container::-webkit-scrollbar,
.chat-list::-webkit-scrollbar,
.emoji-grid::-webkit-scrollbar,
.sticker-grid::-webkit-scrollbar {
  width: 6px;
}

.messages-container::-webkit-scrollbar-track,
.chat-list::-webkit-scrollbar-track,
.emoji-grid::-webkit-scrollbar-track,
.sticker-grid::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.messages-container::-webkit-scrollbar-thumb,
.chat-list::-webkit-scrollbar-thumb,
.emoji-grid::-webkit-scrollbar-thumb,
.sticker-grid::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.messages-container::-webkit-scrollbar-thumb:hover,
.chat-list::-webkit-scrollbar-thumb:hover,
.emoji-grid::-webkit-scrollbar-thumb:hover,
.sticker-grid::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
