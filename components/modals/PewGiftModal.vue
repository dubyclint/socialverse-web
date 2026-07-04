<!-- components/modals/PewGiftModal.vue -->
<template>
  <Teleport to="body">
    <div v-if="isOpen" class="modal-overlay" @click.self="close">
      <div class="modal-box">
        <h3>Send a Pew Gift</h3>
        <p>Support @{{ post?.author?.username }}</p>
        
        <div class="gift-options">
          <button @click="confirmGift(1)">1 Pew</button>
          <button @click="confirmGift(5)">5 Pews</button>
        </div>
        
        <button @click="close">Cancel</button>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
const props = defineProps(['isOpen', 'post']);
const emit = defineEmits(['close', 'confirm']);

const close = () => emit('close');
const confirmGift = (amount) => {
  emit('confirm', { postId: props.post.id, amount });
  close();
};
</script>
