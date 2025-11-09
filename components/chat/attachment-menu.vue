<!-- components/chat/AttachmentMenu.vue -->
<template>
  <div class="attachment-menu-overlay" @click="$emit('close')">
    <div class="attachment-menu" @click.stop>
      <div class="menu-header">
        <h4>Share</h4>
        <button class="close-btn" @click="$emit('close')">
          <Icon name="x" />
        </button>
      </div>
      
      <div class="menu-options">
        <button class="menu-option" @click="selectOption('camera')">
          <div class="option-icon camera">
            <Icon name="camera" />
          </div>
          <span>Camera</span>
        </button>
        
        <button class="menu-option" @click="selectOption('gallery')">
          <div class="option-icon gallery">
            <Icon name="image" />
          </div>
          <span>Gallery</span>
        </button>
        
        <button class="menu-option" @click="selectOption('document')">
          <div class="option-icon document">
            <Icon name="file-text" />
          </div>
          <span>Document</span>
        </button>
        
        <button class="menu-option" @click="selectOption('audio')">
          <div class="option-icon audio">
            <Icon name="music" />
          </div>
          <span>Audio</span>
        </button>
        
        <button class="menu-option" @click="selectOption('location')">
          <div class="option-icon location">
            <Icon name="map-pin" />
          </div>
          <span>Location</span>
        </button>
        
        <button class="menu-option" @click="selectOption('contact')">
          <div class="option-icon contact">
            <Icon name="user" />
          </div>
          <span>Contact</span>
        </button>
      </div>
      
      <!-- Hidden file inputs -->
      <input
        ref="imageInput"
        type="file"
        accept="image/*"
        multiple
        @change="handleFileSelect('image', $event)"
        style="display: none"
      />
      <input
        ref="documentInput"
        type="file"
        accept=".pdf,.doc,.docx,.txt,.zip,.rar"
        @change="handleFileSelect('document', $event)"
        style="display: none"
      />
      <input
        ref="audioInput"
        type="file"
        accept="audio/*"
        @change="handleFileSelect('audio', $event)"
        style="display: none"
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Icon from '@/components/ui/Icon.vue'

// Emits
const emit = defineEmits(['close', 'selectFile', 'selectCamera', 'selectLocation'])

// Refs
const imageInput = ref(null)
const documentInput = ref(null)
const audioInput = ref(null)

// Methods
const selectOption = (type) => {
  switch (type) {
    case 'camera':
      emit('selectCamera')
      break
    case 'gallery':
      imageInput.value?.click()
      break
    case 'document':
      documentInput.value?.click()
      break
    case 'audio':
      audioInput.value?.click()
      break
    case 'location':
      emit('selectLocation')
      break
    case 'contact':
      // Handle contact sharing
      console.log('Share contact')
      emit('close')
      break
  }
}

const handleFileSelect = (type, event) => {
  const files = Array.from(event.target.files)
  
  files.forEach(file => {
    emit('selectFile', { file, type })
  })
  
  // Reset input
  event.target.value = ''
}
</script>

<style scoped>
.attachment-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
}

.attachment-menu {
  background: white;
  border-radius: 16px 16px 0 0;
  width: 100%;
  max-width: 400px;
  padding: 20px;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.menu-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.menu-header h4 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  padding: 8px;
  border-radius: 50%;
  cursor: pointer;
  color: #666;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background: #f5f5f5;
}

.menu-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.menu-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 8px;
  border: none;
  background: none;
  border-radius: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.menu-option:hover {
  background: #f5f5f5;
}

.option-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin-bottom: 4px;
}

.option-icon.camera {
  background: #f44336;
}

.option-icon.gallery {
  background: #9c27b0;
}

.option-icon.document {
  background: #2196f3;
}

.option-icon.audio {
  background: #ff9800;
}

.option-icon.location {
  background: #4caf50;
}

.option-icon.contact {
  background: #607d8b;
}

.menu-option span {
  font-size: 12px;
  font-weight: 500;
  color: #333;
}

/* Desktop responsive */
@media (min-width: 769px) {
  .attachment-menu-overlay {
    align-items: center;
  }
  
  .attachment-menu {
    border-radius: 16px;
    max-width: 320px;
    animation: scaleIn 0.2s ease-out;
  }
  
  @keyframes scaleIn {
    from {
      transform: scale(0.9);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }
}
</style>
