<!-- ============================================================================
     FILE: /pages/auth/complete-profile.vue - UPDATED TO REDIRECT
     ============================================================================
     ✅ FIXED: Now redirects to /profile/edit
     ✅ REMOVED: EditProfile component usage
     ✅ IMPROVED: Better redirect flow
     ============================================================================ -->

<template>
  <div class="redirect-page">
    <div class="redirect-container">
      <div class="spinner"></div>
      <h1>Redirecting to Profile Setup...</h1>
      <p>Please wait while we prepare your profile editor.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

definePageMeta({
  layout: 'blank',
  middleware: 'auth'
})

const router = useRouter()

console.log('[Complete Profile Page] Component mounted')
console.log('[Complete Profile Page] Redirecting to /profile/edit')

// Redirect to profile edit page immediately
navigateTo('/profile/edit', { replace: true })
</script>

<style scoped>
.redirect-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.redirect-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  text-align: center;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  margin: 0;
}

p {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
}
</style>
