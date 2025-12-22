<!-- FILE: /pages/match.vue - FIXED FOR SSR HYDRATION -->
<template>
  <div class="match-page">
    <div class="page-header">
      <h1>Find a Match</h1>
      <p class="subtitle">Discover compatible groups and connections</p>
    </div>

    <ClientOnly>
      <div class="match-container">
        <form @submit.prevent="submit" class="match-form">
          <div class="form-group">
            <label>Group Size</label>
            <select v-model="filters.size" class="form-select">
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
            </select>
          </div>

          <div class="form-group">
            <label>Region</label>
            <select v-model="filters.region" class="form-select">
              <option value="">Any</option>
              <option value="Rivers State">Rivers State</option>
              <option value="Lagos">Lagos</option>
              <option value="Nairobi">Nairobi</option>
            </select>
          </div>

          <div class="form-group">
            <label>Trade Category</label>
            <select v-model="filters.category" class="form-select">
              <option value="">Any</option>
              <option value="electronics">Electronics</option>
              <option value="crypto">Crypto</option>
              <option value="fashion">Fashion</option>
            </select>
          </div>

          <button type="submit" class="btn-submit">Find Group</button>
        </form>

        <div v-if="groups.length > 0" class="groups-list">
          <div v-for="group in groups" :key="group.groupScore" class="group-card">
            <div class="group-header">
              <h4>Group Score: {{ group.groupScore }}</h4>
              <span class="group-size">{{ group.members.length }} members</span>
            </div>
            <div class="group-members">
              <div v-for="member in group.members" :key="member.id" class="member-item">
                <img :src="member.avatar || '/default-avatar.png'" :alt="member.name" class="member-avatar" />
                <span class="member-name">{{ member.name }}</span>
              </div>
            </div>
            <button class="btn-join">Join Group</button>
          </div>
        </div>

        <div v-else class="empty-state">
          <Icon name="users" size="48" />
          <p>No groups found. Try adjusting your filters.</p>
        </div>
      </div>

      <template #fallback>
        <div class="match-loading">
          <div class="spinner"></div>
          <p>Loading matches...</p>
        </div>
      </template>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

definePageMeta({
  middleware: ['auth'],
  layout: 'default'
})

const filters = ref({
  size: '3',
  region: '',
  category: ''
})

const groups = ref([])
const loading = ref(false)

const submit = async () => {
  loading.value = true
  try {
    console.log('Finding groups with filters:', filters.value)
    await new Promise(resolve => setTimeout(resolve, 1000))
    groups.value = []
  } catch (error) {
    console.error('Error finding groups:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.match-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
  background: #0f172a;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  color: white;
  font-size: 2.5rem;
  margin: 0 0 0.5rem 0;
}

.subtitle {
  color: #94a3b8;
  font-size: 1.125rem;
}

.match-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  color: #cbd5e1;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #334155;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.match-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.match-form {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  color: #cbd5e1;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.form-select {
  width: 100%;
  padding: 0.75rem;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 8px;
  color: white;
  font-size: 0.875rem;
}

.form-select:focus {
  outline: none;
  border-color: #3b82f6;
}

.btn-submit {
  width: 100%;
  padding: 0.75rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  margin-top: 1rem;
}

.btn-submit:hover {
  background: #2563eb;
}

.groups-list {
  display: grid;
  gap: 1.5rem;
}

.group-card {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 1.5rem;
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.group-header h4 {
  color: white;
  margin: 0;
  font-size: 1.125rem;
}

.group-size {
  color: #64748b;
  font-size: 0.875rem;
}

.group-members {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.member-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.member-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #334155;
}

.member-name {
  font-size: 0.75rem;
  color: #cbd5e1;
  text-align: center;
  max-width: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.btn-join {
  width: 100%;
  padding: 0.75rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-join:hover {
  background: #059669;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4rem 2rem;
  color: #64748b;
  text-align: center;
}

.empty-state p {
  margin-top: 1rem;
  font-size: 1.125rem;
}

@media (max-width: 768px) {
  .match-page {
    padding: 1rem;
  }

  .page-header h1 {
    font-size: 1.875rem;
  }

  .match-form {
    padding: 1.5rem;
  }

  .group-members {
    gap: 0.75rem;
  }

  .member-avatar {
    width: 40px;
    height: 40px;
  }
}
</style>
