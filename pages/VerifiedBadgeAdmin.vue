<template>
  <div class="verified-badge-admin">
    <div class="pending-requests">
      <h3>Pending Verification Requests</h3>
      <div v-if="pendingRequests.length === 0" class="no-requests">
        No pending requests
      </div>
      <div v-else>
        <div v-for="request in pendingRequests" :key="request.id" class="request-card">
          <div class="user-info">
            <img :src="request.avatar" :alt="request.username" class="avatar" />
            <div>
              <h4>{{ request.username }}</h4>
              <p>{{ request.reason }}</p>
            </div>
          </div>
          <div class="actions">
            <button @click="approveRequest(request.id)" class="btn-approve">✅ Approve</button>
            <button @click="denyRequest(request.id)" class="btn-deny">❌ Deny</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const pendingRequests = ref([
  {
    id: 1,
    username: 'john_doe',
    avatar: 'https://via.placeholder.com/40',
    reason: 'Content creator with 10k+ followers'
  },
  {
    id: 2,
    username: 'jane_smith',
    avatar: 'https://via.placeholder.com/40',
    reason: 'Verified business account'
  }
]);

function approveRequest(requestId) {
  pendingRequests.value = pendingRequests.value.filter(r => r.id !== requestId);
  console.log('Approved request:', requestId);
}

function denyRequest(requestId) {
  pendingRequests.value = pendingRequests.value.filter(r => r.id !== requestId);
  console.log('Denied request:', requestId);
}
</script>

<style scoped>
.verified-badge-admin {
  max-width: 800px;
}
.request-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 1rem;
}
.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
}
.actions {
  display: flex;
  gap: 0.5rem;
}
.btn-approve, .btn-deny {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}
.btn-approve {
  background: #10b981;
  color: white;
}
.btn-deny {
  background: #ef4444;
  color: white;
}
.no-requests {
  text-align: center;
  color: #6b7280;
  padding: 2rem;
}
</style>
