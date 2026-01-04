<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <!-- Logo/Header -->
      <div class="text-center mb-8">
        <NuxtLink to="/" class="inline-block">
          <h1 class="text-4xl font-bold text-white mb-2">🌐 SocialVerse</h1>
        </NuxtLink>
        <p class="text-slate-300">Verify your email address</p>
      </div>

      <!-- Verification Card -->
      <div class="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
        <!-- Loading State -->
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

        <!-- Success State -->
        <div v-else-if="success" class="text-center space-y-4">
          <div class="flex justify-center">
            <div class="text-6xl">✅</div>
          </div>
          <h2 class="text-2xl font-bold text-white">Email Verified!</h2>
          <p class="text-slate-300">Your email has been successfully verified.</p>
          <p class="text-slate-400 text-sm">Redirecting to your feed in {{ redirectCountdown }} seconds...</p>
          <div class="w-full bg-white/10 rounded-full h-2 overflow-hidden">
            <div class="bg-gradient-to-r from-blue-600 to-indigo-600 h-full transition-all" :style="{ width: ((5 - redirectCountdown) / 5) * 100 + '%' }"></div>
          </div>
        </div>

        <!-- Error State -->
        <div v-else class="text-center space-y-4">
          <div class="flex justify-center">
            <div class="text-6xl">❌</div>
          </div>
          <h2 class="text-2xl font-bold text-white">Verification Failed</h2>
          <div class="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
            <p class="text-red-200 text-sm">{{ error }}</p>
          </div>
          
          <!-- Resend Email Section -->
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

            <!-- Resend Success Message -->
            <div v-if="resendSuccess" class="bg-green-500/20 border border-green-500/50 rounded-lg p-4">
              <p class="text-green-200 text-sm flex items-center">
                <span class="mr-2">✅</span>
                {{ resendSuccess }}
              </p>
            </div>
          </div>

          <!-- Back to Signin Link -->
          <div class="relative my-6">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-white/20"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-4 bg-transparent text-slate-300">or</span>
            </div>
          </div>

          <NuxtLink
            to="/auth/signin"
            class="block w-full text-center bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 border border-white/20"
          >
            Back to Sign In
          </NuxtLink>
        </div>
      </div>

      <!-- Footer Links -->
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

definePageMeta({
  layout: 'blank'
})

const route = useRoute()
const router = useRouter()
const { verifyEmail } = useEmailVerification()

const loading = ref(true)
const success = ref(false)
const error = ref('')
const redirectCountdown = ref(5)
const resendLoading = ref(false)
const resendSuccess = ref('')

// Debug info
const currentUrl = ref('')
const hashToken = ref('')
const windowHash = ref('')

/**
 * Extract token from Supabase email link
 * Supabase can send in two formats:
 * 1. Hash format: #access_token=xxx&type=signup&refresh_token=yyy
 * 2. Query format: ?code=xxx (newer format)
 */
const getTokenFromUrl = (): { token: string | null; type: string } => {
  currentUrl.value = window.location.href
  windowHash.value = window.location.hash
  
  console.log('[Verify Email] ============ TOKEN EXTRACTION START ============')
  console.log('[Verify Email] Current URL:', currentUrl.value)
  console.log('[Verify Email] Hash:', window.location.hash)
  console.log('[Verify Email] Search:', window.location.search)

  // ✅ FORMAT 1: Hash format (#access_token=...)
  const hash = window.location.hash
  if (hash) {
    console.log('[Verify Email] Hash found:', hash)
    
    const accessTokenMatch = hash.match(/access_token=([^&]+)/)
    if (accessTokenMatch && accessTokenMatch[1]) {
      const token = accessTokenMatch[1]
      console.log('[Verify Email] ✅ Token found in hash (access_token)')
      hashToken.value = token.substring(0, 20) + '...'
      
      const typeMatch = hash.match(/type=([^&]+)/)
      const type = typeMatch && typeMatch[1] ? typeMatch[1] : 'signup'
      
      console.log('[Verify Email] Type:', type)
      console.log('[Verify Email] ============ TOKEN EXTRACTION END ============')
      
      return { token, type }
    }
  }

  // ✅ FORMAT 2: Query parameter (?code=...)
  const search = window.location.search
  if (search) {
    console.log('[Verify Email] Search params found:', search)
    
    const codeMatch = search.match(/code=([^&]+)/)
    if (codeMatch && codeMatch[1]) {
      const token = codeMatch[1]
      console.log('[Verify Email] ✅ Token found in query params (code)')
      hashToken.value = token.substring(0, 20) + '...'
      
      console.log('[Verify Email] Type: signup (default for query format)')
      console.log('[Verify Email] ============ TOKEN EXTRACTION END ============')
      
      return { token, type: 'signup' }
    }
  }

  // ✅ FORMAT 3: Route query params
  const queryTokenParam = route.query.token as string
  if (queryTokenParam) {
    console.log('[Verify Email] ✅ Token found in route query params')
    return { 
      token: queryTokenParam, 
      type: (route.query.type as string) || 'signup'
    }
  }

  console.error('[Verify Email] ❌ No token found in any format')
  console.log('[Verify Email] ============ TOKEN EXTRACTION END ============')
  return { token: null, type: 'signup' }
}

/**
 * Verify email on page load
 */
onMounted(async () => {
  console.log('[Verify Email Page] ============ MOUNTED ============')
  console.log('[Verify Email Page] Window location:', window.location.href)
  
  const { token, type } = getTokenFromUrl()
  
  if (!token) {
    console.error('[Verify Email Page] ❌ No token found')
    error.value = 'No verification token found. Please check your email link or try resending the verification email.'
    loading.value = false
    return
  }

  console.log('[Verify Email Page] ✅ Token found, verifying...')

  // Call the verification API
  const result = await verifyEmail(token, type as 'email' | 'recovery' | 'signup')

  if (result.success) {
    console.log('[Verify Email Page] ✅ Email verified successfully')
    console.log('[Verify Email Page] Result:', result)
    console.log('[Verify Email Page] User:', result.user)
    
    // ✅ FIX: Get user ID from result.user or result.data.user
    const userId = result.user?.id || result.data?.user?.id
    const userEmail = result.user?.email || result.data?.user?.email
    const username = result.user?.username || result.data?.user?.username || userEmail?.split('@')[0]
    const fullName = result.user?.full_name || result.data?.user?.full_name || username
    
    console.log('[Verify Email Page] Extracted user data:', {
      userId,
      userEmail,
      username,
      fullName
    })
    
    if (!userId) {
      console.error('[Verify Email Page] ❌ No user ID found in verification response')
      error.value = 'Verification successful but user data is missing'
      loading.value = false
      return
    }

    console.log('[Verify Email Page] Creating user profile...')
    
    try {
      const completeResult = await $fetch('/api/auth/complete-signup', {
        method: 'POST',
        body: {
          userId: userId,
          username: username,
          fullName: fullName,
          email: userEmail
        }
      })

      if (completeResult.success) {
        console.log('[Verify Email Page] ✅ Profile created successfully')
      } else {
        console.warn('[Verify Email Page] ⚠️ Profile creation returned non-success:', completeResult)
      }
    } catch (profileErr: any) {
      console.error('[Verify Email Page] ⚠️ Profile creation error (non-critical):', profileErr)
    }

    success.value = true
    loading.value = false

    sessionStorage.removeItem('verificationEmail')

    // ✅ Redirect to /feed after countdown
    const interval = setInterval(() => {
      redirectCountdown.value--
      if (redirectCountdown.value <= 0) {
        clearInterval(interval)
        router.push('/feed')
      }
    }, 1000)
  } else {
    console.error('[Verify Email Page] ❌ Verification failed:', result.error)
    error.value = result.error || 'Email verification failed'
    loading.value = false
  }
})

/**
 * Resend verification email
 */
const resendEmail = async () => {
  let email = prompt('Please enter your email address:') || ''
  
  if (!email) {
    return
  }

  resendLoading.value = true
  resendSuccess.value = ''

  try {
    console.log('[Verify Email Page] Resending verification email to:', email)
    const { resendVerificationEmail } = useEmailVerification()
    const result = await resendVerificationEmail(email)

    if (result.success) {
      resendSuccess.value = 'Verification email sent! Check your inbox.'
      console.log('[Verify Email Page] ✅ Verification email resent')
    } else {
      error.value = result.error || 'Failed to resend email'
      console.error('[Verify Email Page] ❌ Resend failed:', result.error)
    }
  } catch (err) {
    console.error('[Verify Email Page] Resend error:', err)
    error.value = 'Failed to resend verification email'
  } finally {
    resendLoading.value = false
  }
}
</script>

<style scoped>
/* Custom scrollbar for the page */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}
</style>
