<!-- components/chat/ContactSyncModal.vue -->
<template>
  <div class="modal-overlay" @click="handleClose">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>Sync Contacts</h3>
        <button class="close-btn" @click="handleClose">
          <Icon name="x" size="20" />
        </button>
      </div>

      <div class="modal-body">
        <div v-if="!syncing && !completed" class="sync-info">
          <Icon name="users" size="48" class="info-icon" />
          <p class="info-text">Sync your phone contacts to find friends on Socialverse</p>
          <p class="info-subtext">Your contacts will be securely synced and stored</p>
        </div>

        <div v-if="syncing" class="sync-progress">
          <div class="spinner"></div>
          <p>Syncing contacts...</p>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: syncProgress + '%' }"></div>
          </div>
          <p class="progress-text">{{ syncProgress }}%</p>
        </div>

        <div v-if="completed" class="sync-completed">
          <Icon name="check-circle" size="48" class="success-icon" />
          <p class="success-text">Contacts synced successfully!</p>
          <p class="success-subtext">Found {{ foundContacts }} contacts on Socialverse</p>
        </div>
      </div>

      <div class="modal-footer">
        <button 
          v-if="!syncing && !completed"
          class="btn btn-secondary"
          @click="handleClose"
        >
          Cancel
        </button>
        <button 
          v-if="!syncing && !completed"
          class="btn btn-primary"
          @click="handleSync"
        >
          Sync Contacts
        </button>
        <button 
          v-if="completed"
          class="btn btn-primary"
          @click="handleClose"
        >
          Done
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineEmits } from 'vue'
import Icon from '@/components/ui/Icon.vue'

const emit = defineEmits(['close', 'synced'])

const syncing = ref(false)
const completed = ref(false)
const syncProgress = ref(0)
const foundContacts = ref(0)

const handleSync = async () => {
  syncing.value = true
  syncProgress.value = 0

  // Simulate sync progress
  const interval = setInterval(() => {
    syncProgress.value += Math.random() * 30
    if (syncProgress.value >= 100) {
      syncProgress.value = 100
      clearInterval(interval)
      
      // Simulate finding contacts
      foundContacts.value = Math.floor(Math.random() * 50) + 10
      
      setTimeout(() => {
        syncing.value = false
        completed.value = true
        
        // Emit synced event after a delay
        setTimeout(() => {
          emit('synced', { count: foundContacts.value })
        }, 1000)
      }, 500)
    }
  }, 300)
}

const handleClose = () => {
  if (!syncing.value) {
    emit('close')
  }
}
</script>

<style scoped>
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
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #666;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background: #f5f5f5;
}

.modal-body {
  padding: 40px 20px;
  text-align: center;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.sync-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.info-icon {
  color: #1976d2;
}

.info-text {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.info-subtext {
  margin: 0;
  font-size: 14px;
  color: #666;
}

.sync-progress {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e0e0e0;
  border-top-color: #1976d2;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: #e0e0e0;
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #1976d2;
  transition: width 0.3s ease;
}

.progress-text {
  margin: 0;
  font-size: 12px;
  color: #666;
}

.sync-completed {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.success-icon {
  color: #4caf50;
}

.success-text {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.success-subtext {
  margin: 0;
  font-size: 14px;
  color: #666;
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid #e0e0e0;
  justify-content: flex-end;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #1976d2;
  color: white;
}

.btn-primary:hover {
  background: #1565c0;
}

.btn-secondary {
  background: #f5f5f5;
  color: #333;
  border: 1px solid #e0e0e0;
}

.btn-secondary:hover {
  background: #e0e0e0;
}
</style>
