<!-- components/chat/GroupCreator.vue -->
<template>
  <div class="group-creator-overlay" @click="handleOverlayClick">
    <div class="group-creator" @click.stop>
      <div class="creator-header">
        <button class="back-btn" @click="goBack" v-if="currentStep > 1">
          <Icon name="arrow-left" />
        </button>
        <h3>{{ stepTitles[currentStep - 1] }}</h3>
        <button class="close-btn" @click="$emit('close')">
          <Icon name="x" />
        </button>
      </div>

      <div class="creator-content">
        <!-- Step 1: Select Contacts -->
        <div v-if="currentStep === 1" class="step-contacts">
          <div class="search-container">
            <input
              v-model="searchQuery"
              placeholder="Search contacts..."
              class="search-input"
            />
            <Icon name="search" class="search-icon" />
          </div>

          <div class="contacts-list">
            <div class="selected-contacts" v-if="selectedContacts.length > 0">
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
                  <button @click="removeContact(contact.id)">
                    <Icon name="x" />
                  </button>
                </div>
              </div>
            </div>

            <div class="available-contacts">
              <div class="contacts-section" v-if="onlineContacts.length > 0">
                <div class="section-header">Online</div>
                <ContactItem
                  v-for="contact in onlineContacts"
                  :key="contact.id"
                  :contact="contact"
                  :selected="isContactSelected(contact.id)"
                  @toggle="toggleContact"
                />
              </div>

              <div class="contacts-section" v-if="offlineContacts.length > 0">
                <div class="section-header">Offline</div>
                <ContactItem
                  v-for="contact in offlineContacts"
                  :key="contact.id"
                  :contact="contact"
                  :selected="isContactSelected(contact.id)"
                  @toggle="toggleContact"
                />
              </div>

              <div v-if="filteredContacts.length === 0" class="no-contacts">
                No contacts found
              </div>
            </div>
          </div>

          <div class="step-footer">
            <button 
              class="next-btn"
              @click="nextStep"
              :disabled="selectedContacts.length === 0"
            >
              Next ({{ selectedContacts.length }})
            </button>
          </div>
        </div>

        <!-- Step 2: Group Details -->
        <div v-if="currentStep === 2" class="step-details">
          <div class="form-group">
            <label>Group Name *</label>
            <input
              v-model="groupName"
              @blur="validateGroupName"
              placeholder="Enter group name"
              class="form-input"
              maxlength="50"
            />
            <div v-if="groupNameError" class="error-message">
              {{ groupNameError }}
            </div>
            <div class="char-count">{{ groupName.length }}/50</div>
          </div>

          <div class="form-group">
            <label>Group Description</label>
            <textarea
              v-model="groupDescription"
              placeholder="Enter group description (optional)"
              class="form-textarea"
              maxlength="200"
              rows="3"
            ></textarea>
            <div class="char-count">{{ groupDescription.length }}/200</div>
          </div>

          <div class="form-group">
            <label>Group Avatar</label>
            <div class="avatar-upload">
              <div v-if="groupAvatarPreview" class="avatar-preview">
                <img :src="groupAvatarPreview" alt="Group avatar preview" />
                <button @click="groupAvatar = null; groupAvatarPreview = ''" class="remove-avatar">
                  <Icon name="x" />
                </button>
              </div>
              <div v-else class="avatar-placeholder" @click="selectGroupAvatar">
                <Icon name="image" />
                <span>Click to upload</span>
              </div>
              <input
                ref="avatarInput"
                type="file"
                accept="image/*"
                @change="handleAvatarUpload"
                style="display: none"
              />
            </div>
          </div>

          <div class="form-group">
            <label>Group Type</label>
            <div class="template-options">
              <div 
                v-for="template in ['open', 'closed', 'secret']"
                :key="template"
                class="template-option"
                :class="{ active: selectedTemplate === template }"
                @click="selectTemplate(template)"
              >
                <div class="template-icon">
                  <Icon :name="template === 'open' ? 'globe' : template === 'closed' ? 'lock' : 'eye-off'" />
                </div>
                <div class="template-info">
                  <div class="template-name">{{ template.charAt(0).toUpperCase() + template.slice(1) }}</div>
                  <div class="template-description">
                    {{ getTemplateDescription(template) }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="step-footer">
            <button class="back-btn-footer" @click="goBack">Back</button>
            <button 
              class="next-btn"
              @click="nextStep"
              :disabled="!isDetailsValid"
            >
              Next
            </button>
          </div>
        </div>

        <!-- Step 3: Group Settings -->
        <div v-if="currentStep === 3" class="step-settings">
          <div class="permissions-section">
            <div class="permissions-header">
              <h4>Custom Permissions</h4>
            </div>

            <div class="permission-items">
              <div 
                v-for="permission in customPermissions"
                :key="permission.key"
                class="permission-item"
              >
                <div class="permission-info">
                  <div class="permission-name">{{ permission.name }}</div>
                  <div class="permission-description">{{ permission.description }}</div>
                </div>
                <div class="permission-toggle">
                  <label class="toggle-switch">
                    <input 
                      type="checkbox" 
                      v-model="groupPermissions[permission.key]"
                    />
                    <span class="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div class="step-footer">
            <button class="back-btn-footer" @click="goBack">Back</button>
            <button 
              class="create-btn"
              @click="createGroup"
              :disabled="isCreating"
            >
              {{ isCreating ? 'Creating...' : 'Create Group' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useChatStore } from '@/stores/chat'
import Icon from '@/components/ui/icon.vue'
import ContactItem from './ContactItem.vue'

// Props
const props = defineProps({
  contacts: { type: Array, default: () => [] }
})

// Emits
const emit = defineEmits(['close', 'created'])

// Stores
const chatStore = useChatStore()

// Reactive data
const currentStep = ref(1)
const searchQuery = ref('')
const selectedContacts = ref([])
const groupName = ref('')
const groupDescription = ref('')
const groupNameError = ref('')
const groupAvatar = ref(null)
const groupAvatarPreview = ref('')
const selectedTemplate = ref('open')
const groupPermissions = ref({})
const isCreating = ref(false)

// Refs
const avatarInput = ref(null)

// Computed properties
const stepTitles = computed(() => [
  'Add Group Participants',
  'Group Details',
  'Group Settings'
])

const filteredContacts = computed(() => {
  if (!searchQuery.value) return props.contacts
  
  return props.contacts.filter(contact =>
    contact.username.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    contact.email?.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

const onlineContacts = computed(() =>
  filteredContacts.value.filter(contact => 
    contact.isOnline && !isContactSelected(contact.id)
  )
)

const offlineContacts = computed(() =>
  filteredContacts.value.filter(contact => 
    !contact.isOnline && !isContactSelected(contact.id)
  )
)

const isDetailsValid = computed(() => {
  return groupName.value.trim().length > 0 && groupName.value.trim().length <= 50
})

const customPermissions = computed(() => [
  {
    key: 'onlyAdminsCanMessage',
    name: 'Only admins can message',
    description: 'Restrict messaging to group admins only'
  },
  {
    key: 'onlyAdminsCanAddMembers',
    name: 'Only admins can add members',
    description: 'Only admins can invite new members'
  },
  {
    key: 'onlyAdminsCanRemoveMembers',
    name: 'Only admins can remove members',
    description: 'Only admins can remove group members'
  },
  {
    key: 'onlyAdminsCanChangeGroupInfo',
    name: 'Only admins can edit group info',
    description: 'Only admins can change group name, description, and photo'
  },
  {
    key: 'allowMemberExit',
    name: 'Allow members to leave',
    description: 'Members can leave the group on their own'
  },
  {
    key: 'readReceipts',
    name: 'Read receipts',
    description: 'Show when messages are read'
  }
])

// Methods
const handleOverlayClick = () => {
  emit('close')
}

const goBack = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const nextStep = () => {
  if (currentStep.value < 3) {
    currentStep.value++
  }
}

const isContactSelected = (contactId) => {
  return selectedContacts.value.some(contact => contact.id === contactId)
}

const toggleContact = (contact) => {
  const index = selectedContacts.value.findIndex(c => c.id === contact.id)
  
  if (index > -1) {
    selectedContacts.value.splice(index, 1)
  } else {
    if (selectedContacts.value.length >= 256) {
      alert('Maximum 256 participants allowed')
      return
    }
    selectedContacts.value.push(contact)
  }
}

const removeContact = (contactId) => {
  const index = selectedContacts.value.findIndex(c => c.id === contactId)
  if (index > -1) {
    selectedContacts.value.splice(index, 1)
  }
}

const validateGroupName = () => {
  const name = groupName.value.trim()
  
  if (name.length === 0) {
    groupNameError.value = 'Group name is required'
  } else if (name.length > 50) {
    groupNameError.value = 'Group name must be 50 characters or less'
  } else {
    groupNameError.value = ''
  }
}

const selectGroupAvatar = () => {
  avatarInput.value?.click()
}

const handleAvatarUpload = (event) => {
  const file = event.target.files?.[0]
  if (file) {
    groupAvatar.value = file
    const reader = new FileReader()
    reader.onload = (e) => {
      groupAvatarPreview.value = e.target?.result
    }
    reader.readAsDataURL(file)
  }
}

const selectTemplate = (template) => {
  selectedTemplate.value = template
}

const getTemplateDescription = (template) => {
  const descriptions = {
    open: 'Anyone can find and join',
    closed: 'Members must be invited',
    secret: 'Hidden from search, invite only'
  }
  return descriptions[template] || ''
}

const createGroup = async () => {
  validateGroupName()
  
  if (groupNameError.value) {
    return
  }
  
  try {
    isCreating.value = true
    
    const groupData = {
      name: groupName.value,
      description: groupDescription.value,
      type: selectedTemplate.value,
      participantIds: selectedContacts.value.map(c => c.id),
      permissions: groupPermissions.value
    }
    
    if (groupAvatar.value) {
      const formData = new FormData()
      formData.append('name', groupData.name)
      formData.append('description', groupData.description)
      formData.append('participantIds', JSON.stringify(groupData.participantIds))
      formData.append('permissions', JSON.stringify(groupData.permissions))
      formData.append('avatar', groupAvatar.value)
      
      await chatStore.createGroup(formData)
    } else {
      await chatStore.createGroup(groupData)
    }
    
    emit('created')
    
  } catch (error) {
    console.error('Error creating group:', error)
    alert('Failed to create group. Please try again.')
  } finally {
    isCreating.value = false
  }
}

// Lifecycle
onMounted(() => {
  // Initialize with open template
  selectTemplate('open')
})
</script>

<style scoped>
.group-creator-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.group-creator {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.creator-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e0e0e0;
}

.back-btn,
.close-btn {
  background: none;
  border: none;
  padding: 8px;
  border-radius: 50%;
  cursor: pointer;
  color: #666;
  transition: background-color 0.2s;
}

.back-btn:hover,
.close-btn:hover {
  background: #f5f5f5;
}

.creator-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.creator-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.search-container {
  position: relative;
  margin-bottom: 20px;
}

.search-input {
  width: 100%;
  padding: 12px 40px 12px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  outline: none;
  font-size: 14px;
  transition: border-color 0.2s;
}

.search-input:focus {
  border-color: #1976d2;
}

.search-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
  pointer-events: none;
}

.contacts-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.selected-contacts {
  padding: 12px;
  background: #f5f5f5;
  border-radius: 8px;
}

.selected-header {
  font-size: 12px;
  font-weight: 600;
  color: #666;
  margin-bottom: 8px;
  text-transform: uppercase;
}

.selected-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.contact-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  padding: 4px 8px 4px 4px;
  font-size: 13px;
}

.contact-chip img {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}

.contact-chip button {
  background: none;
  border: none;
  padding: 2px;
  cursor: pointer;
  color: #999;
  display: flex;
  align-items: center;
}

.contact-chip button:hover {
  color: #333;
}

.available-contacts {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.contacts-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-header {
  font-size: 12px;
  font-weight: 600;
  color: #999;
  text-transform: uppercase;
  padding: 0 8px;
}

.no-contacts {
  text-align: center;
  padding: 20px;
  color: #999;
  font-size: 14px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-textarea:focus {
  border-color: #1976d2;
}

.char-count {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
  text-align: right;
}

.error-message {
  color: #d32f2f;
  font-size: 12px;
  margin-top: 4px;
}

.avatar-upload {
  display: flex;
  gap: 12px;
}

.avatar-preview,
.avatar-placeholder {
  width: 100px;
  height: 100px;
  border-radius: 8px;
  border: 2px dashed #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.avatar-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  flex-direction: column;
  gap: 8px;
  color: #999;
  transition: border-color 0.2s;
}

.avatar-placeholder:hover {
  border-color: #1976d2;
}

.remove-avatar {
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(0, 0, 0, 0.6);
  border: none;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.template-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.template-option {
  display: flex;
  gap: 12px;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.template-option:hover {
  border-color: #1976d2;
  background: #f5f5f5;
}

.template-option.active {
  border-color: #1976d2;
  background: #e3f2fd;
}

.template-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  flex-shrink: 0;
}

.template-option.active .template-icon {
  background: #1976d2;
  color: white;
}

.template-info {
  flex: 1;
}

.template-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 2px;
}

.template-description {
  font-size: 13px;
  color: #999;
}

.permissions-section {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 16px;
}

.permissions-header {
  margin-bottom: 16px;
}

.permissions-header h4 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.permission-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.permission-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: white;
  border-radius: 8px;
}

.permission-info {
  flex: 1;
}

.permission-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 2px;
}

.permission-description {
  font-size: 13px;
  color: #999;
}

.permission-toggle {
  margin-left: 12px;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.3s;
  border-radius: 24px;
}

.toggle-slider:before {
  position: absolute;
  content: '';
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

input:checked + .toggle-slider {
  background-color: #1976d2;
}

input:checked + .toggle-slider:before {
  transform: translateX(20px);
}

.step-footer {
  display: flex;
  gap: 12px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #e0e0e0;
}

.next-btn,
.create-btn,
.back-btn-footer {
  flex: 1;
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.next-btn,
.create-btn {
  background: #1976d2;
  color: white;
}

.next-btn:hover:not(:disabled),
.create-btn:hover:not(:disabled) {
  background: #1565c0;
}

.next-btn:disabled,
.create-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.back-btn-footer {
  background: #f5f5f5;
  color: #333;
}

.back-btn-footer:hover {
  background: #e0e0e0;
}

@media (max-width: 600px) {
  .group-creator {
    max-width: 100%;
    max-height: 100vh;
    border-radius: 0;
  }
  
  .creator-content {
    padding: 16px;
  }
}
</style>
