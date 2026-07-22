<!-- ============================================================================
     FILE: /pages/profile/complete-success.vue - RECONCILED ORIGINAL STANDARD
     ============================================================================
     ✅ NEW: Success page shown after profile completion
     ✅ Shows success message with profile summary
     ✅ Button to navigate to feed page
     ============================================================================ -->

<template>
  <div class="success-page">
    <!-- Background Animation -->
    <div class="background-animation">
      <div class="animated-blob blob-1"></div>
      <div class="animated-blob blob-2"></div>
      <div class="animated-blob blob-3"></div>
    </div>

    <!-- Main Content -->
    <div class="success-container">
      <!-- Success Icon -->
      <div class="success-icon-wrapper">
        <div class="success-icon">
          <Icon name="check-circle" size="80" />
        </div>
        <div class="success-ring"></div>
      </div>

      <!-- Success Message -->
      <h1 class="success-title">Profile Completed!</h1>
      <p class="success-subtitle">Welcome to Socialverse, {{ displayName }}!</p>

      <!-- Profile Summary Card -->
      <div class="profile-summary">
        <div class="summary-item">
          <div class="summary-icon">
            <Icon name="user" size="24" />
          </div>
          <div class="summary-content">
            <p class="summary-label">Full Name</p>
            <p class="summary-value">{{ displayName }}</p>
          </div>
        </div>

        <div class="summary-divider"></div>

        <div class="summary-item">
          <div class="summary-icon">
            <Icon name="mail" size="24" />
          </div>
          <div class="summary-content">
            <p class="summary-label">Email</p>
            <p class="summary-value">{{ userEmail }}</p>
          </div>
        </div>

        <div class="summary-divider"></div>

        <div class="summary-item">
          <div class="summary-icon">
            <Icon name="heart" size="24" />
          </div>
          <div class="summary-content">
            <p class="summary-label">Interests</p>
            <p class="summary-value">{{ interestCount }} selected</p>
          </div>
        </div>
      </div>

      <!-- Features List -->
      <div class="features-list">
        <h2 class="features-title">What's Next?</h2>
        <ul class="features">
          <li class="feature-item">
            <Icon name="users" size="20" />
            <span>Connect with people who share your interests</span>
          </li>
          <li class="feature-item">
            <Icon name="message-circle" size="20" />
            <span>Start conversations and make new friends</span>
          </li>
          <li class="feature-item">
            <Icon name="star" size="20" />
            <span>Explore trending content and communities</span>
          </li>
          <li class="feature-item">
            <Icon name="settings" size="20" />
            <span>Customize your profile and preferences anytime</span>
          </li>
        </ul>
      </div>

      <!-- Action Buttons -->
      <div class="action-buttons">
        <button class="btn-primary" @click="goToFeed">
          <Icon name="arrow-right" size="20" />
          Go to Feed
        </button>
        <button class="btn-secondary" @click="editProfile">
          <Icon name="edit" size="20" />
          Edit Profile
        </button>
      </div>

      <!-- Skip Message -->
      <p class="skip-message">
        You can edit your profile anytime from your settings
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '~/stores/user' 
import { api } from '~/lib/api'
import type { AuthUser } from '~/types/user'

const router = useRouter()
const userStore = useUserStore()

// Bind to userStore instead of authStore/profileStore
const displayName = computed(() => userStore.user?.full_name || userStore.user?.username || 'User')
const userEmail = computed(() => userStore.user?.email || 'Unspecified')
const interestCount = computed(() => userStore.profile?.interests?.length || 0)

const goToFeed = () => router.push('/feed')
const editProfile = () => router.push('/profile/edit')

onMounted(async () => {
  try {
    // Refresh user store state after completion
    const p = await api<AuthUser>('/profile/me')
    userStore.setUser(p) // Ensure your userStore has a method to update state
  } catch (e) {
    console.warn('[complete-success] profile refresh failed:', e)
  }
})
     
</script>
<style scoped>
.success-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  position: relative;
  overflow: hidden;
}
.background-animation { position: absolute; inset: 0; overflow: hidden; z-index: 0; }
.animated-blob { position: absolute; border-radius: 50%; opacity: 0.1; animation: float 20s infinite ease-in-out; }
.blob-1 { width: 400px; height: 400px; background: #3b82f6; top: -100px; left: -100px; }
.blob-2 { width: 300px; height: 300px; background: #10b981; bottom: -50px; right: -50px; animation-delay: 2s; }
.blob-3 { width: 350px; height: 350px; background: #8b5cf6; top: 50%; right: -100px; animation-delay: 4s; }

@keyframes float {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(30px, 30px); }
}

.success-container {
  max-width: 600px;
  width: 100%;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 16px;
  padding: 3rem 2rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}
.success-icon-wrapper { position: relative; margin-bottom: 2rem; }
.success-icon {
  width: 120px;
  height: 120px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  animation: scaleIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
  z-index: 2;
}
.success-ring {
  position: absolute;
  inset: -10px;
  border: 3px solid #10b981;
  border-radius: 50%;
  animation: ringPulse 2s ease-out infinite;
  opacity: 0.5;
}

@keyframes scaleIn { 0% { transform: scale(0); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
@keyframes ringPulse { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(1.3); opacity: 0; } }

.success-title { margin: 0 0 0.5rem 0; font-size: 2rem; font-weight: 700; color: #f1f5f9; }
.success-subtitle { margin: 0 0 2rem 0; font-size: 1.1rem; color: #94a3b8; }
.profile-summary { width: 100%; background: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 1.5rem; margin-bottom: 2rem; }
.summary-item { display: flex; align-items: center; gap: 1rem; }
.summary-icon { width: 48px; height: 48px; background: #334155; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #3b82f6; }
.summary-content { text-align: left; flex: 1; }
.summary-label { margin: 0; font-size: 0.875rem; color: #94a3b8; }
.summary-value { margin: 0.25rem 0 0 0; font-size: 1rem; color: #f1f5f9; font-weight: 600; }
.summary-divider { height: 1px; background: #334155; margin: 1rem 0; }
.features-list { width: 100%; margin-bottom: 2rem; }
.features-title { margin: 0 0 1rem 0; font-size: 1.1rem; font-weight: 700; color: #f1f5f9; text-align: left; }
.features { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 0.75rem; }
.feature-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; background: #0f172a; border: 1px solid #334155; border-radius: 8px; color: #cbd5e1; font-size: 0.95rem; }
.action-buttons { display: flex; flex-direction: column; gap: 1rem; width: 100%; margin-bottom: 1.5rem; }
.btn-primary { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; }
.btn-secondary { background: transparent; color: #3b82f6; border: 2px solid #3b82f6; }
.skip-message { margin: 0; font-size: 0.875rem; color: #64748b; }

@media (max-width: 768px) {
  .success-container { padding: 2rem 1.5rem; }
  .success-title { font-size: 1.75rem; }
}
</style>
