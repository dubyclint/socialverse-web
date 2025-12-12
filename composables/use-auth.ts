// In the signup function, update error handling:
const signup = async (data: {
  email: string
  password: string
  username: string
  fullName?: string
}) => {
  loading.value = true
  error.value = ''

  try {
    console.log('[useAuth] Signup attempt:', data.email)

    const result = await $fetch('/api/auth/signup', {
      method: 'POST',
      body: data
    })

    console.log('[useAuth] Signup response:', result)

    if (!result?.success) {
      throw new Error(result?.error || 'Signup failed')
    }

    // ... rest of the code
  } catch (err: any) {
    // Extract detailed error message
    let errorMessage = 'Signup failed'
    
    if (err.data?.data?.details) {
      errorMessage = err.data.data.details
    } else if (err.data?.statusMessage) {
      errorMessage = err.data.statusMessage
    } else if (err.statusMessage) {
      errorMessage = err.statusMessage
    } else if (err.message) {
      errorMessage = err.message
    }
    
    console.error('[useAuth] ✗ Signup failed:', errorMessage)
    console.error('[useAuth] Full error:', err)
    error.value = errorMessage
    return { success: false, error: errorMessage }
  } finally {
    loading.value = false
  }
}
