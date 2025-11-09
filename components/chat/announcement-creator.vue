<!-- components/chat/AnnouncementCreator.vue -->
<template>
  <div class="announcement-creator-overlay" @click="handleOverlayClick">
    <div class="announcement-creator" @click.stop>
      <div class="creator-header">
        <button class="close-btn" @click="$emit('close')">
          <Icon name="x" />
        </button>
        <h3>Create Announcement</h3>
        <button 
          class="send-btn" 
          @click="sendAnnouncement"
          :disabled="!canSend || isSending"
        >
          {{ isSending ? 'Sending...' : 'Send' }}
        </button>
      </div>

      <div class="creator-content">
        <!-- Recipients Selection -->
        <div class="recipients-section">
          <label class="section-label">Send to:</label>
          <div class="recipient-options">
            <label class="option">
              <input 
                v-model="recipientType" 
                type="radio" 
                value="all"
              />
              <span>All Pals</span>
            </label>
            <label class="option">
              <input 
                v-model="recipientType" 
                type="radio" 
                value="selected"
              />
              <span>Selected Pals</span>
            </label>
          </div>

          <!-- Selected Pals List -->
          <div v-if="recipientType === 'selected'" class="pals-selector">
            <div class="search-container">
              <input
                v-model="searchQuery"
                placeholder="Search pals..."
                class="search-input"
              />
              <Icon name="search" class="search-icon" />
            </div>

            <div class="pals-list">
              <label 
                v-for="pal in filteredPals" 
                :key="pal.id"
                class="pal-item"
              >
                <input 
                  v-model="selectedPals" 
                  type="checkbox" 
                  :value="pal.id"
                />
                <img :src="pal.avatar" :alt="pal.name" class="pal-avatar" />
                <span>{{ pal.name }}</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Announcement Content -->
        <div class="content-section">
          <label class="section-label">Announcement Title:</label>
          <input
            v-model="title"
            placeholder="Enter announcement title..."
            class="title-input"
            maxlength="100"
          />
          <div class="char-count">{{ title.length }}/100</div>
        </div>

        <div class="content-section">
          <label class="section-label">Message:</label>
          <textarea
            v-model="message"
            placeholder="Enter your announcement message..."
            class="message-textarea"
            maxlength="1000"
            @input="adjustTextareaHeight"
            ref="textareaRef"
          ></textarea>
          <div class="char-count">{{ message.length }}/1000</div>
        </div>

        <!-- Priority Level -->
        <div class="priority-section">
          <label class="section-label">Priority:</label>
          <div class="priority-options">
            <button 
              v-for="level in priorityLevels"
              :key="level.id"
              class="priority-btn"
              :class="{ active: priority === level.id }"
              @click="priority = level.id"
            >
              <span class="priority-dot" :style="{ backgroundColor: level.color }"></span>
              {{ level.label }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

// Props
defineProps({
  pals: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits(['close', 'sent'])

// Reactive data
const recipientType = ref('all')
const selectedPals = ref([])
const searchQuery = ref('')
const title = ref('')
const message = ref('')
const priority = ref('normal')
const isSending = ref(false)
const textareaRef = ref(null)

// Priority levels
const priorityLevels = [
  { id: 'low', label: 'Low', color: '#4CAF50' },
  { id: 'normal', label: 'Normal', color: '#2196F3' },
  { id: 'high', label: 'High', color: '#FF9800' },
  { id: 'urgent', label: 'Urgent', color: '#F44336' }
]

// Computed
const filteredPals = computed(() => {
  if (!searchQuery.value) return pals
  const query = searchQuery.value.toLowerCase()
  return pals.filter(pal => 
    pal.name.toLowerCase().includes(query) ||
    pal.email?.toLowerCase().includes(query)
  )
})

const canSend = computed(() => {
  return title.value.trim() && message.value.trim() && 
    (recipientType.value === 'all' || selectedPals.value.length > 0)
})

// Methods
const handleOverlayClick = () => {
  emit('close')
}

const adjustTextareaHeight = () => {
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto'
    textareaRef.value.style.height = textareaRef.value.scrollHeight + 'px'
  }
}

const sendAnnouncement = async () => {
  if (!canSend.value) return

  isSending.value = true
  try {
    const announcementData = {
      title: title.value,
      message: message.value,
      priority: priority.value,
      recipientType: recipientType.value,
      recipients: recipientType.value === 'all' ? null : selectedPals.value,
      createdAt: new Date().toISOString()
    }

    // Emit the announcement data
    emit('sent', announcementData)
    
    // Reset form
    resetForm()
  } catch (error) {
    console.error('Error sending announcement:', error)
  } finally {
    isSending.value = false
  }
}

const resetForm = () => {
  recipientType.value = 'all'
  selectedPals.value = []
  searchQuery.value = ''
  title.value = ''
  message.value = ''
  priority.value = 'normal'
}
</script>

<style scoped>
.announcement-creator-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.announcement-creator {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.creator-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.creator-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.close-btn,
.send-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background-color: #f0f0f0;
}

.send-btn {
  background-color: #2196F3;
  color: white;
  padding: 8px 16px;
  font-weight: 600;
}

.send-btn:hover:not(:disabled) {
  background-color: #1976D2;
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.creator-content {
  overflow-y: auto;
  padding: 16px;
  flex: 1;
}

.section-label {
  display: block;
  font-weight: 600;
  margin-bottom: 8px;
  font-size: 14px;
  color: #333;
}

.recipients-section,
.content-section,
.priority-section {
  margin-bottom: 20px;
}

.recipient-options,
.priority-options {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.option,
.priority-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.option:hover,
.priority-btn:hover {
  background-color: #f5f5f5;
}

.option input[type="radio"],
.option input[type="checkbox"] {
  cursor: pointer;
}

.priority-btn.active {
  background-color: #e3f2fd;
  border-color: #2196F3;
}

.priority-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.pals-selector {
  margin-top: 12px;
}

.search-container {
  position: relative;
  margin-bottom: 12px;
}

.search-input {
  width: 100%;
  padding: 10px 12px 10px 36px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.search-input:focus {
  border-color: #2196F3;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
  pointer-events: none;
}

.pals-list {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
}

.pal-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid #f0f0f0;
}

.pal-item:last-child {
  border-bottom: none;
}

.pal-item:hover {
  background-color: #f9f9f9;
}

.pal-item input[type="checkbox"] {
  cursor: pointer;
}

.pal-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.title-input,
.message-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-family: inherit;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
  resize: none;
}

.title-input:focus,
.message-textarea:focus {
  border-color: #2196F3;
}

.title-input {
  margin-bottom: 4px;
}

.message-textarea {
  min-height: 120px;
  margin-bottom: 4px;
}

.char-count {
  font-size: 12px;
  color: #999;
  text-align: right;
  margin-bottom: 12px;
}
</style>
