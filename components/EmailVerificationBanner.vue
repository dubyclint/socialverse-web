// ============================================================================
// FILE 1: /components/EmailVerificationBanner.vue
// ============================================================================
// PHASE 5: Email Verification Banner Component
// Purpose: Display on feed if email not verified
// Features:
//   ✅ Shows only if email not verified
//   ✅ Displays verification status
//   ✅ Provides "Send Verification Email" button
//   ✅ Shows success/error messages
//   ✅ Can be dismissed
//   ✅ Appears at top of feed
// ============================================================================

<template>
  <div v-if="shouldShow" class="email-verification-banner">
    <!-- Banner Container -->
    <div class="banner-content">
      <!-- Icon -->
      <div class="banner-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
        </svg>
      </div>

      <!-- Text Content -->
      <div class="banner-text">
        <h3 class="banner-title">Verify Your Email</h3>
        <p class="banner-description">
          We sent a verification link to <strong>{{ userEmail }}</strong>. 
          Click the link in your email or request a new one below.
        </p>
      </div>

      <!-- Action Buttons -->
      <div class="banner-actions">
        <!-- Send Verification Email Button -->
        <button 
          @click="handleSendVerification"
          :disabled="isLoading || resendCooldown > 0"
          class="btn-send-verification"
          :title="resendCooldown > 0 ? `Wait ${resendCooldown}s` : 'Send verification email'"
        >
          <span v-if="isLoading" class="button-spinner"></span>
          <span v-else-if="resendCooldown > 0">
            Resend in {{ resendCooldown }}s
          </span>
          <span v-else>
            Resend Email
          </span>
        </button>

        <!-- Dismiss Button -->
        <button 
          @click="handleDismiss"
          class="btn-dismiss"
          title="Dismiss banner"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>

    <!-- Success Message -->
    <div v-if="successMessage" class="banner-message success-message">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      {{ successMessage }}
    </div>

    <!-- Error Message -->
    <div v-if="errorMessage" class="banner-message error-message">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'

// ============================================================================
// PROPS & EMITS
// ============================================================================
interface Props {
  isVerified?: boolean
  email?: string
  onDismiss?: () => void
}

const props = withDefaults(defineProps<Props>(), {
  isVerified: false,
  email: ''
})

const emit = defineEmits<{
  'send-verification': []
  'dismiss': []
  'verified': []
}>()

// ============================================================================
// COMPOSABLES & STORES
// ============================================================================
const authStore = useAuthStore()

// ============================================================================
// REACTIVE STATE
// ============================================================================
const isLoading = ref(false)
const isDismissed = ref(false)
const successMessage = ref('')
const errorMessage = ref('')
const resendCooldown = ref(0)

// ============================================================================
// COMPUTED PROPERTIES
// ============================================================================

/**
 * Determine if banner should be shown
 * Show if:
 * - Email is not verified
 * - Banner is not dismissed
 * - User is authenticated
 */
const shouldShow = computed(() => {
  const isEmailVerified = props.isVerified || authStore.isEmailVerified
  const isAuthenticated = authStore.isAuthenticated
  
  console.log('[EmailVerificationBanner] shouldShow computed:', {
    isEmailVerified,
    isAuthenticated,
    isDismissed: isDismissed.value,
    show: !isEmailVerified && isAuthenticated && !isDismissed.value
  })
  
  return !isEmailVerified && isAuthenticated && !isDismissed.value
})

/**
 * Get user email from props or auth store
 */
const userEmail = computed(() => {
  return props.email || authStore.userEmail || 'your email'
})

// ============================================================================
// METHODS
// ============================================================================

/**
 * Handle send verification email
 */
const handleSendVerification = async () => {
  console.log('[EmailVerificationBanner] Sending verification email...')
  
  if (!userEmail.value || userEmail.value === 'your email') {
    errorMessage.value = 'Email address not found'
    console.error('[EmailVerificationBanner] Email not found')
    return
  }

  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    console.log('[EmailVerificationBanner] Calling resend-verification API...')
    
    const response = await $fetch('/api/auth/resend-verification', {
      method: 'POST',
      body: { email: userEmail.value }
    })

    console.log('[EmailVerificationBanner] ✅ Verification email sent:', response)
    
    successMessage.value = 'Verification email sent! Check your inbox and spam folder.'
    
    // Start cooldown
    resendCooldown.value = 60
    const interval = setInterval(() => {
      resendCooldown.value--
      if (resendCooldown.value <= 0) {
        clearInterval(interval)
      }
    }, 1000)

    // Clear success message after 5 seconds
    setTimeout(() => {
      successMessage.value = ''
    }, 5000)

    // Emit event
    emit('send-verification')

  } catch (err: any) {
    console.error('[EmailVerificationBanner] Error sending verification email:', err)
    
    let errorMsg = 'Failed to send verification email'
    
    if (err.data?.statusMessage) {
      errorMsg = err.data.statusMessage
    } else if (err.message) {
      errorMsg = err.message
    }

    errorMessage.value = errorMsg
    
    // Clear error message after 5 seconds
    setTimeout(() => {
      errorMessage.value = ''
    }, 5000)

  } finally {
    isLoading.value = false
  }
}

/**
 * Handle dismiss banner
 */
const handleDismiss = () => {
  console.log('[EmailVerificationBanner] Dismissing banner')
  isDismissed.value = true
  emit('dismiss')
  
  if (props.onDismiss) {
    props.onDismiss()
  }
}

/**
 * Handle email verified event
 */
const handleEmailVerified = () => {
  console.log('[EmailVerificationBanner] Email verified, hiding banner')
  isDismissed.value = true
  emit('verified')
}

// ============================================================================
// WATCHERS
// ============================================================================

/**
 * Watch for email verification status changes
 */
watch(() => props.isVerified, (newValue) => {
  console.log('[EmailVerificationBanner] isVerified prop changed:', newValue)
  if (newValue) {
    handleEmailVerified()
  }
})

/**
 * Watch for auth store email verification status
 */
watch(() => authStore.isEmailVerified, (newValue) => {
  console.log('[EmailVerificationBanner] Auth store isEmailVerified changed:', newValue)
  if (newValue) {
    handleEmailVerified()
  }
})

/**
 * Watch for auth store user changes
 */
watch(() => authStore.user, (newUser) => {
  console.log('[EmailVerificationBanner] Auth store user changed:', {
    userId: newUser?.id,
    email: newUser?.email
  })
}, { deep: true })

/**
 * Watch for authentication status
 */
watch(() => authStore.isAuthenticated, (isAuth) => {
  console.log('[EmailVerificationBanner] Auth status changed:', isAuth)
  if (!isAuth) {
    isDismissed.value = false
  }
})

// ============================================================================
// LIFECYCLE HOOKS
// ============================================================================

onMounted(() => {
  console.log('[EmailVerificationBanner] Component mounted')
  console.log('[EmailVerificationBanner] Initial state:', {
    isVerified: props.isVerified,
    email: userEmail.value,
    isAuthenticated: authStore.isAuthenticated,
    shouldShow: shouldShow.value
  })
})
</script>

<style scoped>
/* ============================================================================
   BANNER CONTAINER
   ============================================================================ */
.email-verification-banner {
  background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);
  border: 1px solid #3b82f6;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 12px rgba(30, 64, 175, 0.15);
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ============================================================================
   BANNER CONTENT
   ============================================================================ */
.banner-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

/* ============================================================================
   BANNER ICON
   ============================================================================ */
.banner-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  color: #60a5fa;
}

.banner-icon svg {
  width: 20px;
  height: 20px;
}

/* ============================================================================
   BANNER TEXT
   ============================================================================ */
.banner-text {
  flex: 1;
  min-width: 0;
}

.banner-title {
  margin: 0 0 0.25rem 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: white;
}

.banner-description {
  margin: 0;
  font-size: 0.85rem;
  color: #dbeafe;
  line-height: 1.4;
}

.banner-description strong {
  color: white;
  font-weight: 600;
}

/* ============================================================================
   BANNER ACTIONS
   ============================================================================ */
.banner-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

/* Send Verification Button */
.btn-send-verification {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: white;
  color: #1e40af;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-send-verification:hover:not(:disabled) {
  background: #f0f9ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 255, 255, 0.2);
}

.btn-send-verification:active:not(:disabled) {
  transform: translateY(0);
}

.btn-send-verification:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Button Spinner */
.button-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid #1e40af;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Dismiss Button */
.btn-dismiss {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.1);
  color: #dbeafe;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-dismiss:hover {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.btn-dismiss:active {
  transform: scale(0.95);
}

.btn-dismiss svg {
  width: 18px;
  height: 18px;
}

/* ============================================================================
   BANNER MESSAGES
   ============================================================================ */
.banner-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding: 0.75rem;
  border-radius: 6px;
  font-size: 0.85rem;
  animation: slideDown 0.3s ease-out;
}

.banner-message svg {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
}

/* Success Message */
.success-message {
  background: rgba(16, 185, 129, 0.1);
  color: #a7f3d0;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.success-message svg {
  color: #10b981;
}

/* Error Message */
.error-message {
  background: rgba(239, 68, 68, 0.1);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.error-message svg {
  color: #ef4444;
}

/* ============================================================================
   RESPONSIVE DESIGN
   ============================================================================ */
@media (max-width: 768px) {
  .email-verification-banner {
    padding: 0.75rem;
  }

  .banner-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .banner-icon {
    width: 36px;
    height: 36px;
  }

  .banner-actions {
    width: 100%;
    flex-direction: column;
  }

  .btn-send-verification {
    width: 100%;
    justify-content: center;
  }

  .btn-dismiss {
    align-self: flex-end;
  }

  .banner-title {
    font-size: 0.9rem;
  }

  .banner-description {
    font-size: 0.8rem;
  }
}

@media (max-width: 480px) {
  .email-verification-banner {
    padding: 0.5rem;
    margin-bottom: 1rem;
  }

  .banner-icon {
    width: 32px;
    height: 32px;
  }

  .banner-title {
    font-size: 0.85rem;
  }

  .banner-description {
    font-size: 0.75rem;
  }

  .btn-send-verification {
    padding: 0.5rem 0.75rem;
    font-size: 0.8rem;
  }
}

/* ============================================================================
   ACCESSIBILITY
   ============================================================================ */
.btn-send-verification:focus-visible,
.btn-dismiss:focus-visible {
  outline: 2px solid white;
  outline-offset: 2px;
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .email-verification-banner,
  .banner-message {
    animation: none;
  }

  .btn-send-verification:hover:not(:disabled),
  .btn-dismiss:hover {
    transform: none;
  }

  .button-spinner {
    animation: none;
    border-top-color: #1e40af;
  }
}

/* Dark mode support (already in dark mode, but for completeness) */
@media (prefers-color-scheme: dark) {
  /* Already styled for dark mode */
}

/* High contrast mode support */
@media (prefers-contrast: more) {
  .email-verification-banner {
    border-width: 2px;
  }

  .btn-send-verification,
  .btn-dismiss {
    border: 2px solid currentColor;
  }
}
</style>
