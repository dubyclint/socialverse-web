<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <NuxtLink to="/" class="inline-block">
          <h1 class="text-4xl font-bold text-white mb-2">🌐 SocialVerse</h1>
        </NuxtLink>
        <p class="text-slate-300">Verify your email address</p>
      </div>

      <div class="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
        
        <div v-if="loading" class="text-center space-y-4">
          <div class="flex justify-center">
            <svg class="animate-spin h-12 w-12 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h2 class="text-2xl font-bold text-white">Verifying Email</h2>
          <p class="text-slate-300">Please wait while we verify your email address...</p>
        </div>

        <div v-if="success" class="text-center space-y-4">
          <div class="flex justify-center">
            <div class="text-6xl">✅</div>
          </div>
          <h2 class="text-2xl font-bold text-white">Email Verified!</h2>
          <p class="text-slate-300">Your email has been successfully verified.</p>
          <p class="text-slate-400 text-sm">Redirecting to your onboarding sequence in {{ redirectCountdown }} seconds...</p>
          <div class="w-full bg-white/10 rounded-full h-2 overflow-hidden">
            <div class="bg-gradient-to-r from-blue-600 to-indigo-600 h-full transition-all" :style="{ width: ((5 - redirectCountdown) / 5) * 100 + '%' }"></div>
          </div>
        </div>

        <div v-else class="text-center space-y-4">
          <div class="flex justify-center">
            <div class="text-6xl">❌</div>
          </div>
          <h2 class="text-2xl font-bold text-white">Verification Failed</h2>
          <div class="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
            <p class="text-red-200 text-sm">{{ error }}</p>
          </div>
          
          <div class="space-y-3 mt-6">
            <p class="text-slate-300 text-sm">Didn't receive the email or link expired?</p>
            
            <button
              @click="resendEmail"
              :disabled="resendLoading"
              class="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <span v-if="resendLoading" class="flex items-center">
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending...
              </span>
              <span v-else>Resend Verification Email</span>
            </button>

            <div v-if="resendSuccess" class="bg-green-500/20 border border-green-500/50 rounded-lg p-4">
              <p class="text-green-200 text-sm flex items-center">
                <span class="mr-2">✅</span>
                {{ resendSuccess }}
              </p>
            </div>
          </div>

          <div class="relative my-6">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-white/20"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-4 bg-transparent text-slate-300">or</span>
            </div>
          </div>

          <NuxtLink
            to="/signin"
            class="block w-full text-center bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 border border-white/20"
          >
            Back to Sign In
          </NuxtLink>
        </div>
      </div>

      <div class="text-center mt-6 space-x-4">
        <NuxtLink to="/terms-and-policy" class="text-slate-300 hover:text-white text-sm transition-colors">
          Terms
        </NuxtLink>
        <span class="text-slate-500">•</span>
        <NuxtLink to="/terms-and-policy" class="text-slate-300 hover:text-white text-sm transition-colors">
          Privacy
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth' // ✅ FIXED: Explicitly import Pinia store context dependencies
import { useEmailVerification } from '~/composables/use-email-verification'

definePageMeta({
  layout: 'blank'
})

const route = useRoute()
const router = useRouter()
const { verifyEmail, resendVerificationEmail } = useEmailVerification()

const loading = ref(true)
const success = ref(false)
const error = ref('')
const redirectCountdown = ref(5)
const resendLoading = ref(false)
const resendSuccess = ref('')

const getTokenFromUrl = (): { token: string | null; type: string } => {
  console.log('[Verify Email] ============ TOKEN EXTRACTION START ============')
  const hash = window.location.hash
  if (hash) {
    const accessTokenMatch = hash.match(/access_token=([^&]+)/)
    if (accessTokenMatch && accessTokenMatch) {
      const typeMatch = hash.match(/type=([^&]+)/)
      return { token: accessTokenMatch, type: typeMatch && typeMatch ? typeMatch : 'signup' }
    }
  }

  const search = window.location.search
  if (search) {
    const codeMatch = search.match(/code=([^&]+)/)
    if (codeMatch && codeMatch) {
      return { token: codeMatch, type: 'signup' }
    }
  }

  if (route.query.token) {
    return { token: route.query.token as string, type: (route.query.type as string) || 'signup' }
  }

  return { token: null, type: 'signup' }
}

onMounted(async () => {
  const { token, type } = getTokenFromUrl()
  
  if (!token) {
    error.value = 'No verification token found. Please check your email link or try resending.'
    loading.value = false
    return
  }

  const result = await verifyEmail(token, type as 'email' | 'recovery' | 'signup')

  if (result.success) {
    let userId = result.user?.id
    let userEmail = result.user?.email
    let username = result.user?.username
    let fullName = result.user?.full_name

    // Fallback sync hook using explicitly imported store context
    if (!userId) {
      try {
        const authStore = useAuthStore()
        if (authStore && authStore.userId) {
          userId = authStore.userId
          userEmail = authStore.userEmail
        }
      } catch (err) {
        console.warn('[Verify Email Page] Store state contextual fallback recovery skipped.')
      }
    }

    if (userId) {
      try {
        await $fetch('/api/auth/complete-signup', {
          method: 'POST',
          body: { userId, username, fullName, email: userEmail }
        })
      } catch (profileErr) {
        console.error('[Verify Email Page] Handled profile upsert fallback logic:', profileErr)
      }
    }

    success.value = true
    loading.value = false
    sessionStorage.removeItem('verificationEmail')

    const interval = setInterval(() => {
      redirectCountdown.value--
      if (redirectCountdown.value <= 0) {
        clearInterval(interval)
        // ✅ FIXED: Routes to verified target application paths matching your layout architecture
        router.push('/profile/complete')
      }
    }, 1000)
  } else {
    error.value = result.error || 'Email verification failed'
    loading.value = false
  }
})

const resendEmail = async () => {
  let email = prompt('Please enter your email address:') || ''
  if (!email) return

  resendLoading.value = true
  resendSuccess.value = ''

  const result = await resendVerificationEmail(email)
  if (result.success) {
    resendSuccess.value = 'Verification email sent! Check your inbox.'
  } else {
    error.value = result.error || 'Failed to resend email'
  }
  resendLoading.value = false
}
</script>

<style scoped>
::-webkit-scrollbar { width: 8px; }
::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.1); }
::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.3); border-radius: 4px; }
</style>
