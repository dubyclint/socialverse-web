<template>
  <div v-if="isOpen" class="edit-profile-modal-overlay" @click="emit('close')">
    <div class="edit-profile-modal" @click.stop>
      <div class="modal-header">
        <h2 class="modal-title">{{ isNewProfile ? 'Complete Profile' : 'Edit Profile' }}</h2>
        <button class="close-btn" @click="emit('close')" aria-label="Close modal">
          <Icon name="x" size="20" />
        </button>
      </div>

      <div class="modal-content">
        <ProfileEditProfile
          :is-new-profile="isNewProfile"
          :initial-data="initialData"
          @success="handleSuccess"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ProfileEditProfile from '~/components/profile/edit-profile.vue'

defineProps<{
  isOpen: boolean
  isNewProfile?: boolean
  initialData?: Record<string, any>
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'success', data: any): void
}>()

const handleSuccess = (data: any) => {
  emit('success', data)
  emit('close')
}
</script>

<style scoped>
.edit-profile-modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,.7);
  display: flex; align-items: center; justify-content: center; z-index: 1000;
}
.edit-profile-modal {
  width: min(900px, 96vw);
  max-height: 92vh;
  overflow: auto;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 12px;
}
.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 1rem 1.25rem; border-bottom: 1px solid #334155;
}
.modal-title { margin: 0; color: #f1f5f9; }
.close-btn { background: none; border: none; color: #94a3b8; cursor: pointer; }
.modal-content { padding: 1.25rem; }
</style>
