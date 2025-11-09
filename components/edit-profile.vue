<template>
  <div class="edit-profile">
    <h2>Edit Profile</h2>
    <form @submit.prevent="saveProfile">
      <input v-model="profile.name" placeholder="Name" />
      <input v-model="profile.email" placeholder="Email" />
      <textarea v-model="profile.bio" placeholder="Bio"></textarea>
      <button type="submit">Save Changes</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
// import { gun } from '~/gundb/client'; // Commented out - may not exist

const profile = ref({
  name: '',
  email: '',
  bio: ''
});

onMounted(() => {
  // Load existing profile data
});

function saveProfile() {
  // Save profile logic
}
</script>

<style scoped>
.edit-profile {
  padding: 2rem;
}
form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>


