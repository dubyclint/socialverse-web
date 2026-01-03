// ============================================================================
// CORRECTED FILE 2: /pages/auth/verify-email.vue (Script section only)
// ============================================================================
// FIX: Handle both hash and query parameter formats from Supabase
// ============================================================================

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
    console.log('[Verify Email Page] User ID:', result.user?.id)
    
    console.log('[Verify Email Page] Creating user profile...')
    
    try {
      const username = result.user?.username || result.user?.email?.split('@')[0] || 'user'
      const fullName = result.user?.full_name || username
      const email = result.user?.email || ''
      
      console.log('[Verify Email Page] Profile creation params:', {
        userId: result.user?.id,
        username: username,
        fullName: fullName,
        email: email
      })
      
      const completeResult = await $fetch('/api/auth/complete-signup', {
        method: 'POST',
        body: {
          userId: result.user?.id,
          username: username,
          fullName: fullName,
          email: email
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
