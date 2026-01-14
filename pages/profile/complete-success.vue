<!-- ============================================================================
     FILE: /pages/profile/complete-success.vue - NEW SUCCESS PAGE
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
      <p class="success-subtitle">Welcome to Socialverse, {{ profileStore.displayName }}!</p>

      <!-- Profile Summary Card -->
      <div class="profile-summary">
        <div class="summary-item">
          <div class="summary-icon">
            <Icon name="user" size="24" />
          </div>
          <div class="summary-content">
            <p class="summary-label">Full Name</p>
            <p class="summary-value">{{ profileStore.displayName }}</p>
          </div>
        </div>

        <div class="summary-divider"></div>

        <div class="summary-item">
          <div class="summary-icon">
            <Icon name="mail" size="24" />
          </div>
          <div class="summary-content">
            <p class="summary-label">Email</p>
            <p class="summary-value">{{ authStore.userEmail }}</p>
          </div>
        </div>

        <div class="summary-divider"></div>

        <div class="summary-item">
          <div class="summary-icon">
            <Icon name="heart" size="24" />
          </div>
          <div class="summary-content">
            <p class="summary-label">Interests</p>
            <p class="summary-value">{{ profileStore.interests.length }} selected</p>
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
definePageMeta({
  middleware: ['auth'],
  layout: 'default'
})

import { useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import { useProfileStore } from '~/stores/profile'

const router = useRouter()
const authStore = useAuthStore()
const profileStore = useProfileStore()

const goToFeed = () => {
  console.log('[ProfileCompleteSuccess] Navigating to feed')
  router.push('/feed')
}

const editProfile = () => {
  console.log('[ProfileCompleteSuccess] Navigating to edit profile')
  router.push('/profile/edit')
}

onMounted(() => {
  console.log('[ProfileCompleteSuccess] Component mounted')
  console.log('[ProfileCompleteSuccess] User:', {
    displayName: profileStore.displayName,
    email: authStore.userEmail,
    interests: profileStore.interests.length
  })
})
</script>

<style scoped>
/* ============================================================================
   GLOBAL STYLES
   ============================================================================ */
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

/* ============================================================================
   BACKGROUND ANIMATION
   ============================================================================ */
.background-animation {
  position: absolute;
  inset: 0;
  overflow: hidden;
  z-index: 0;
}

.animated-blob {
  position: absolute;
  border-radius: 50%;
  opacity: 0.1;
  animation: float 20s infinite ease-in-out;
}

.blob-1 {
  width: 400px;
  height: 400px;
  background: #3b82f6;
  top: -100px;
  left: -100px;
  animation-delay: 0s;
}

.blob-2 {
  width: 300px;
  height: 300px;
  background: #10b981;
  bottom: -50px;
  right: -50px;
  animation-delay: 2s;
}

.blob-3 {
  width: 350px;
  height: 350px;
  background: #8b5cf6;
  top: 50%;
  right: -100px;
  animation-delay: 4s;
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0);
  }
  50% {
    transform: translate(30px, 30px);
  }
}

/* ============================================================================
   SUCCESS CONTAINER
   ============================================================================ */
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

/* ============================================================================
   SUCCESS ICON
   ============================================================================ */
.success-icon-wrapper {
  position: relative;
  margin-bottom: 2rem;
}

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

.success-icon :deep(svg) {
  filter: drop-shadow(0 4px 12px rgba(16, 185, 129, 0.3));
}

.success-ring {
  position: absolute;
  inset: -10px;
  border: 3px solid #10b981;
  border-radius: 50%;
  animation: ringPulse 2s ease-out infinite;
  opacity: 0.5;
}

@keyframes scaleIn {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes ringPulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(1.3);
    opacity: 0;
  }
}

/* ============================================================================
   SUCCESS MESSAGE
   ============================================================================ */
.success-title {
  margin: 0 0 0.5rem 0;
  font-size: 2rem;
  font-weight: 700;
  color: #f1f5f9;
  animation: slideUp 0.6s ease-out 0.2s both;
}

.success-subtitle {
  margin: 0 0 2rem 0;
  font-size: 1.1rem;
  color: #94a3b8;
  animation: slideUp 0.6s ease-out 0.3s both;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ============================================================================
   PROFILE SUMMARY
   ============================================================================ */
.profile-summary {
  width: 100%;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  animation: slideUp 0.6s ease-out 0.4s both;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.summary-icon {
  width: 48px;
  height: 48px;
  background: #334155;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3b82f6;
  flex-shrink: 0;
}

.summary-content {
  text-align: left;
  flex: 1;
}

.summary-label {
  margin: 0;
  font-size: 0.875rem;
  color: #94a3b8;
  font-weight: 500;
}

.summary-value {
  margin: 0.25rem 0 0 0;
  font-size: 1rem;
  color: #f1f5f9;
  font-weight: 600;
  word-break: break-word;
}

.summary-divider {
  height: 1px;
  background: #334155;
  margin: 1rem 0;
}

/* ============================================================================
   FEATURES LIST
   ============================================================================ */
.features-list {
  width: 100%;
  margin-bottom: 2rem;
  animation: slideUp 0.6s ease-out 0.5s both;
}

.features-title {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #f1f5f9;
  text-align: left;
}

.features {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 8px;
  color: #cbd5e1;
  font-size: 0.95rem;
  transition: all 0.2s;
}

.feature-item:hover {
  border-color: #475569;
  background: #1e293b;
}

.feature-item :deep(svg) {
  color: #3b82f6;
  flex-shrink: 0;
}

/* ============================================================================
   ACTION BUTTONS
   ============================================================================ */
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  margin-bottom: 1.5rem;
  animation: slideUp 0.6s ease-out 0.6s both;
}

.btn-primary,
.btn-secondary {
  padding: 1rem 2rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
}

.btn-primary:active {
  transform: translateY(0);
}

.btn-secondary {
  background: transparent;
  color: #3b82f6;
  border: 2px solid #3b82f6;
}

.btn-secondary:hover {
  background: rgba(59, 130, 246, 0.1);
  border-color: #60a5fa;
  color: #60a5fa;
}

.btn-secondary:active {
  background: rgba(59, 130, 246, 0.2);
}

/* ============================================================================
   SKIP MESSAGE
   ============================================================================ */
.skip-message {
  margin: 0;
  font-size: 0.875rem;
  color: #64748b;
  animation: slideUp 0.6s ease-out 0.7s both;
}

/* ============================================================================
   RESPONSIVE DESIGN
   ============================================================================ */
@media (max-width: 768px) {
  .success-container {
    padding: 2rem 1.5rem;
  }

  .success-title {
    font-size: 1.75rem;
  }

  .success-subtitle {
    font-size: 1rem;
  }

  .profile-summary {
    padding: 1rem;
  }

  .summary-icon {
    width: 40px;
    height: 40px;
  }

  .summary-label {
    font-size: 0.8rem;
  }

  .summary-value {
    font-size: 0.95rem;
  }

  .features-title {
    font-size: 1rem;
  }

  .feature-item {
    font-size: 0.9rem;
    padding: 0.65rem 0.85rem;
  }

  .btn-primary,
  .btn-secondary {
    padding: 0.85rem 1.5rem;
    font-size: 0.95rem;
  }
}

@media (max-width: 480px) {
  .success-container {
    padding: 1.5rem 1rem;
    border-radius: 12px;
  }

  .success-icon {
    width: 100px;
    height: 100px;
  }

  .success-icon :deep(svg) {
    width: 60px;
    height: 60px;
  }

  .success-title {
    font-size: 1.5rem;
  }

  .success-subtitle {
    font-size: 0.95rem;
  }

  .profile-summary {
    padding: 0.75rem;
  }

  .summary-divider {
    margin: 0.75rem 0;
  }

  .features-title {
    font-size: 0.95rem;
  }

  .feature-item {
    font-size: 0.85rem;
    padding: 0.6rem 0.75rem;
    gap: 0.5rem;
  }

  .feature-item :deep(svg) {
    width: 18px;
    height: 18px;
  }

  .action-buttons {
    gap: 0.75rem;
  }

  .btn-primary,
  .btn-secondary {
    padding: 0.75rem 1.25rem;
    font-size: 0.9rem;
  }

  .skip-message {
    font-size: 0.8rem;
  }
}
</style>
