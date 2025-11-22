<template>
  <div class="group-detail">
    <div v-if="pending" class="loading">
      <p>Loading group...</p>
    </div>
    <div v-else-if="error" class="error">
      <p>Error: {{ error }}</p>
    </div>
    <div v-else-if="group" class="group-content">
      <h1>{{ group.name }}</h1>
      <p>{{ group.description }}</p>
      <div class="group-members">
        <h3>Members: {{ group.memberCount || 0 }}</h3>
      </div>
    </div>
    <div v-else class="not-found">
      <p>Group not found</p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'language-check', 'security-middleware'],
  layout: 'default'
})
 
const route = useRoute();
const groupId = route.params.id as string;

// Initialize reactive state
const group = ref(null);
const pending = ref(true);
const error = ref(null);

// Fetch group data
try {
  const { data } = await $fetch(`/api/groups/${groupId}`);
  group.value = data;
} catch (err: any) {
  error.value = err.message || 'Failed to load group';
} finally {
  pending.value = false;
}
</script>

<style scoped>
.group-detail {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
}

.loading, .error, .not-found {
  text-align: center;
  padding: 2rem;
}

.error {
  color: #dc3545;
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
}

.group-content h1 {
  color: #333;
  margin-bottom: 1rem;
}

.group-members {
  margin-top: 2rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 4px;
}
</style>

