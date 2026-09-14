<template>
  <div class="create-group">
    <h2>Create New Group</h2>
    <form @submit.prevent="createGroup">
      <input v-model="groupName" placeholder="Group Name" required />
      <textarea v-model="groupDescription" placeholder="Group Description"></textarea>
      <div class="actions">
        <button type="button" @click="emit('close')">Cancel</button>
        <button type="submit">Create Group</button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const emit = defineEmits<{ close: []; create: [payload: { name: string; description: string }] }>();

const groupName = ref('');
const groupDescription = ref('');

function createGroup() {
  emit('create', {
    name: groupName.value.trim(),
    description: groupDescription.value.trim()
  });

  groupName.value = '';
  groupDescription.value = '';
}
</script>

<style scoped>
.create-group {
  padding: 2rem;
}
form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>



