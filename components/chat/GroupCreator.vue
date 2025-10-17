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
                  :isSelected="isContactSelected(contact.id)"
                  @toggle="toggleContact"
                />
              </div>

              <div class="contacts-section" v-if="offlineContacts.length > 0">
                <div class="section-header">All Contacts</div>
                <ContactItem
                  v-for="contact in offlineContacts"
                  :key="contact.id"
                  :contact="contact"
                  :isSelected="isContactSelected(contact.id)"
                  @toggle="toggleContact"
                />
              </div>

              <div v-if="filteredContacts.length === 0" class="no-contacts">
                <Icon name="users" />
                <p>No contacts found</p>
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
          <div class="group-avatar-section">
            <div class="avatar-container" @click="selectGroupAvatar">
              <div v-if="!groupAvatar" class="avatar-placeholder">
                <Icon name="camera" />
                <span>Add Group Photo</span>
              </div>
              <img v-else :src="groupAvatarPreview" alt="Group avatar" />
            </div>
          </div>

          <div class="group-info">
            <div class="input-group">
              <label>Group Name *</label>
              <input
                v-model="groupName"
                placeholder="Enter group name"
                class="group-input"
                maxlength="50"
                @input="validateGroupName"
              />
              <div class="input-error" v-if="groupNameError">
                {{ groupNameError }}
              </div>
            </div>

            <div class="input-group">
              <label>Description (Optional)</label>
              <textarea
                v-model="groupDescription"
                placeholder="What's this group about?"
                class="group-textarea"
                maxlength="500"
                rows="3"
              ></textarea>
            </div>
          </div>

          <div class="step-footer">
            <button class="next-btn" @click="nextStep" :disabled="!isDetailsValid">
              Next
            </button>
          </div>
        </div>

        <!-- Step 3: Group Permissions -->
        <div v-if="currentStep === 3" class="step-permissions">
          <div class="permission-templates">
            <div class="templates-header">
              <h4>Choose Group Type</h4>
              <p>You can change these settings later</p>
            </div>

            <div class="template-options">
              <div 
                v-for="template in permissionTemplates"
                :key="template.id"
                class="template-option"
                :class="{ active: selectedTemplate === template.id }"
                @click="selectTemplate(template.id)"
              >
                <div class="template-icon">
                  <Icon :name="template.icon" />
                </div>
                <div class="template-info">
                  <div class="template-name">{{ template.name }}</div>
                  <div class="template-description">{{ template.description }}</div>
                </div>
                <div class="template-radio">
                  <div class="radio-dot" v-if="selectedTemplate === template.id"></div>
                </div>
              </div>
            </div>
          </div>

          <div class="custom-permissions" v-if="selectedTemplate === 'custom'">
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

      <!-- Hidden file input -->
      <input
        ref="avatarInput"
        type="file"
        accept="image/*"
        @change="handleAvatarSelect"
        style="display: none"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useChatStore } from '@/stores/chatStore'
import Icon from '@/components/ui/Icon.vue'
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
  return groupName.value.trim().length > 0 && !groupNameError.value
})

const permissionTemplates = computed(() => [
  {
    id: 'open',
    name: 'Open Group',
    description: 'Anyone can message, add members, and change basic info',
    icon: 'unlock'
  },
  {
    id: 'moderated',
    name: 'Moderated Group',
    description: 'Only admins can add/remove members and change group info',
    icon: 'shield'
  },
  {
    id: 'restricted',
    name: 'Restricted Group',
    description: 'Only admins can message and manage the group',
    icon: 'lock'
  },
  {
    id: 'announcement',
    name: 'Announcement Group',
    description: 'Only admins can send messages, members can only read',
    icon: 'megaphone'
  },
  {
    id: 'custom',
    name: 'Custom Settings',
    description: 'Configure permissions manually',
    icon: 'settings'
  }
])

const customPermissions = computed(() => [
  {
    key: 'onlyAdminsCanMessage',
    name: 'Only admins can send messages',
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

const handleAvatarSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('Image size must be less than 5MB')
      return
    }
    
    groupAvatar.value = file
    groupAvatarPreview.value = URL.createObjectURL(file)
  }
}

const selectTemplate = (templateId) => {
  selectedTemplate.value = templateId
  
  // Set default permissions based on template
  const templates = {
    open: {
      onlyAdminsCanMessage: false,
      onlyAdminsCanAddMembers: false,
      onlyAdminsCanRemoveMembers: false,
      onlyAdminsCanChangeGroupInfo: false,
      allowMemberExit: true,
      readReceipts: true
    },
    moderated: {
      onlyAdminsCanMessage: false,
      onlyAdminsCanAddMembers: true,
      onlyAdminsCanRemoveMembers: true,
      onlyAdminsCanChangeGroupInfo: true,
      allowMemberExit: true,
      readReceipts: true
    },
    restricted: {
      onlyAdminsCanMessage: true,
      onlyAdminsCanAddMembers: true,
      onlyAdminsCanRemoveMembers: true,
      onlyAdminsCanChangeGroupInfo: true,
      allowMemberExit: false,
      readReceipts: true
    },
    announcement: {
      onlyAdminsCanMessage: true,
      onlyAdminsCanAddMembers: true,
      onlyAdminsCanRemoveMembers: true,
      onlyAdminsCanChangeGroupInfo: true,
      allowMemberExit: true,
      readReceipts: false
    }
  }
  
  if (templates[templateId]) {
    groupPermissions.value = { ...templates[templateId] }
  }
}

const createGroup = async () => {
  if (isCreating.value) return
  
  isCreating.value = true
  
  try {
    const groupData = {
      name: groupName.value.trim(),
      description: groupDescription.value.trim(),
      participantIds: selectedContacts.value.map(c => c.id),
      permissions: groupPermissions.value
    }
    
    // Handle avatar upload
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
  color: #666;
  width: 16px;
  height: 16px;
}

.contacts-list {
  max-height: 400px;
  overflow-y: auto;
}

.selected-contacts {
  margin-bottom: 20px;
}

.selected-header {
  font-size: 14px;
  font-weight: 600;
  color: #666;
  margin-bottom: 8px;
}

.selected-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.contact-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #e3f2fd;
  border: 1px solid #1976d2;
  border-radius: 20px;
  padding: 4px 8px 4px 4px;
  font-size: 12px;
  color: #1976d2;
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
  color: #1976d2;
  cursor: pointer;
  padding: 2px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.contact-chip button:hover {
  background: rgba(25, 118, 210, 0.1);
}

.contacts-section {
  margin-bottom: 16px;
}

.section-header {
  font-size: 12px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.no-contacts {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.no-contacts svg {
  width: 48px;
  height: 48px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.step-footer {
  border-top: 1px solid #e0e0e0;
  padding: 16px 0 0;
  margin-top: 20px;
}

.next-btn,
.create-btn {
  width: 100%;
  background: #1976d2;
  color: white;
  border: none;
  padding: 12px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
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

.group-avatar-section {
  text-align: center;
  margin-bottom: 24px;
}

.avatar-container {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 2px dashed #e0e0e0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin: 0 auto;
  transition: border-color 0.2s;
  overflow: hidden;
}

.avatar-container:hover {
  border-color: #1976d2;
}

.avatar-placeholder {
  text-align: center;
  color: #666;
}

.avatar-placeholder svg {
  width: 24px;
  height: 24px;
  margin-bottom: 4px;
}

.avatar-placeholder span {
  font-size: 12px;
}

.avatar-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.input-group {
  margin-bottom: 20px;
}

.input-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
}

.group-input,
.group-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  outline: none;
  font-size: 14px;
  transition: border-color 0.2s;
  font-family: inherit;
}

.group-input:focus,
.group-textarea:focus {
  border-color: #1976d2;
}

.group-textarea {
  resize: vertical;
  min-height: 80px;
}

.input-error {
  color: #f44336;
  font-size: 12px;
  margin-top: 4px;
}

.permission-templates {
  margin-bottom: 24px;
}

.templates-header {
  margin-bottom: 16px;
}

.templates-header h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
  color: #333;
}

.templates-header p {
  margin: 0;
  font-size: 14px;
  color: #666;
}

.template-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.template-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.template-option:hover {
  border-color: #1976d2;
}

.template-option.active {
  border-color: #1976d2;
  background: #e3f2fd;
}

.template-icon {
  width: 40px;
  height: 40px;
  background: #f5f5f5;
  border-radius: 50%;
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
  margin-bottom: 4px;
}

.template-description {
  font-size: 13px;
  color: #666;
  line-height: 1.4;
}

.template-radio {
  width: 20px;
  height: 20px;
  border: 2px solid #e0e0e0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.template-option.active .template-radio {
  border-color: #1976d2;
}

.radio-dot {
  width: 10px;
  height: 10px;
  background: #1976d2;
  border-radius: 50%;
}

.custom-permissions {
  border-top: 1px solid #e0e0e0;
  padding-top: 20px;
}

.permissions-header h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #333;
}

.permission-items {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.permission-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.permission-info {
  flex: 1;
}

.permission-name {
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.permission-description {
  font-size: 13px;
  color: #666;
  line-height: 1.4;
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
  transition: 0.2s;
  border-radius: 24px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.2s;
  border-radius: 50%;
}

input:checked + .toggle-slider {
  background-color: #1976d2;
}

input:checked + .toggle-slider:before {
  transform: translateX(20px);
}

/* Mobile responsive */
@media (max-width: 768px) {
  .group-creator-overlay {
    padding: 10px;
  }
  
  .group-creator {
    max-height: 95vh;
  }
  
  .creator-content {
    padding: 16px;
  }
  
  .contacts-list {
    max-height: 300px;
  }
  
  .avatar-container {
    width: 80px;
    height: 80px;
  }
  
  .template-option {
    padding: 12px;
  }
  
  .template-icon {
    width: 32px;
    height: 32px;
  }
}
</style>
