<!-- FILE: /pages/error.vue - ERROR PAGE -->
<!-- ============================================================================
     ERROR PAGE - Displayed when routing fails
     ============================================================================ -->

<template>
  <div class="error-page">
    <div class="error-container">
      <div class="error-icon">
        <Icon name="alert-circle" size="64" />
      </div>
      <h1 class="error-title">{{ error.statusCode }}</h1>
      <p class="error-message">{{ error.statusMessage }}</p>
      <p v-if="error.data?.message" class="error-details">{{ error.data.message }}</p>
      
      <div class="error-actions">
        <NuxtLink to="/feed" class="btn btn-primary">
          Go to Feed
        </NuxtLink>
        <button @click="clearError" class="btn btn-secondary">
          Try Again
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue'

defineProps({
  error: {
    type: Object,
    required: true,
  },
})

const clearError = () => {
  clearError()
}
</script>

<style scoped>
.error-page {
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.error-container {
  text-align: center;
  max-width: 500px;
}

.error-icon {
  color: #ef4444;
  margin-bottom: 1.5rem;
}

.error-title {
  font-size: 3rem;
  font-weight: 700;
  color: white;
  margin: 0 0 0.5rem 0;
}

.error-message {
  font-size: 1.25rem;
  color: #cbd5e1;
  margin: 0 0 1rem 0;
}

.error-details {
  color: #94a3b8;
  margin-bottom: 2rem;
}

.error-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  display: inline-block;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-secondary {
  background: #334155;
  color: #e2e8f0;
}

.btn-secondary:hover {
  background: #475569;
}
</style>
