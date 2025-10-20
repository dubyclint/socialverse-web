<template>
  <div class="rank-admin-panel">
    <h2>🏆 Rank Management</h2>
    <div class="rank-actions">
      <button @click="refreshRanks" class="btn-primary">Refresh Rankings</button>
      <button @click="resetSeason" class="btn-secondary">Reset Season</button>
    </div>
    <div class="rank-list">
      <h3>Current Rankings</h3>
      <ul>
        <li v-for="user in topUsers" :key="user.id" class="rank-item">
          <span class="rank">{{ user.rank }}</span>
          <span class="username">{{ user.username }}</span>
          <span class="score">{{ user.score }} points</span>
          <button @click="adjustRank(user.id)" class="btn-adjust">Adjust</button>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const topUsers = ref([
  { id: 1, rank: 1, username: 'user1', score: 2500 },
  { id: 2, rank: 2, username: 'user2', score: 2200 },
  { id: 3, rank: 3, username: 'user3', score: 1900 }
]);

function refreshRanks() {
  console.log('Refreshing ranks...');
}

function resetSeason() {
  console.log('Resetting season...');
}

function adjustRank(userId) {
  console.log('Adjusting rank for user:', userId);
}
</script>

<style scoped>
.rank-admin-panel {
  padding: 2rem;
}
.rank-actions {
  display: flex;
  gap: 1rem;
  margin: 1rem 0;
}
.btn-primary, .btn-secondary, .btn-adjust {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.btn-primary {
  background: #2563eb;
  color: white;
}
.btn-secondary {
  background: #6b7280;
  color: white;
}
.btn-adjust {
  background: #f59e0b;
  color: white;
  font-size: 0.8rem;
}
.rank-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem;
  border-bottom: 1px solid #e5e7eb;
}
.rank {
  font-weight: bold;
  width: 30px;
}
.username {
  flex: 1;
}
.score {
  color: #6b7280;
}
</style>
