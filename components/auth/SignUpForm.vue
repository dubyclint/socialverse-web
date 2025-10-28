const completeSignup = async () => {
  isSigningUp.value = true
  
  try {
    console.log('[SignUp] Submitting form with interests:', selectedInterests.value)
    
    // Create user account
    const response = await $fetch('/api/auth/signup', {
      method: 'POST',
      body: {
        email: formData.value.email,
        username: formData.value.username,
        phone: formData.value.phone,
        fullName: formData.value.displayName,
        password: formData.value.password,
        bio: formData.value.bio,
        location: formData.value.location,
        interests: selectedInterests.value
      }
    })
    
    console.log('[SignUp] Response:', response)
    
    if (response.success) {
      console.log('[SignUp] ✅ Account created successfully')
      // Redirect to welcome page or login
      await navigateTo('/auth/verify-email')
    } else {
      throw new Error(response.statusMessage || 'Signup failed')
    }
  } catch (error: any) {
    console.error('[SignUp] Error:', error)
    
    // Handle error message
    const errorMessage = 
      error.data?.statusMessage || 
      error.statusMessage || 
      error.message || 
      'Signup failed. Please try again.'
    
    // Show error to user (you may need to add error state to component)
    alert(errorMessage)
  } finally {
    isSigningUp.value = false
  }
}
