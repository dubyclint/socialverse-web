<template>
  <Teleport to="body">
    <div v-if="isOpen" class="modal-overlay" @click.self="close">
      <div class="modal-box">
        <header class="modal-head">
          <h3>Send a Pew Gift</h3>
          <button class="close-btn" @click="close">✕</button>
        </header>
        <p class="recipient">Support @{{ post?.author?.username }}</p>

        <PewgiftPicker
          v-if="post?.id && post?.author?.id"
          target-type="post"
          :post-id="post.id"
          :recipient-id="post.author.id"
          @gift-sent="onSent"
        />
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import PewgiftPicker from '~/components/financial/gifts/pewgift-picker.vue'

interface GiftPost {
  id: string
  author?: { id?: string, username?: string } | null
}

defineProps<{ isOpen: boolean, post: GiftPost | null }>()
const emit = defineEmits<{ (e: 'close'): void, (e: 'confirm', payload: unknown): void }>()

const close = () => emit('close')

const onSent = (payload: unknown) => {
  emit('confirm', payload)
  close()
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(2, 6, 23, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-box {
  background: #0f172a;
  color: #e2e8f0;
  border-radius: 0.75rem;
  padding: 1rem;
  width: min(560px, 100%);
  max-height: 90vh;
  overflow-y: auto;
}

.modal-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-head h3 {
  margin: 0;
  font-size: 1.1rem;
}

.close-btn {
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 1rem;
  cursor: pointer;
}

.recipient {
  margin: 0.25rem 0 0.75rem;
  color: #94a3b8;
  font-size: 0.85rem;
}
</style>
