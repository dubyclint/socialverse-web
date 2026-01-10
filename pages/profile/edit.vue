<!-- ============================================================================
     FILE 2: /pages/profile/edit.vue - COMPLETE FIXED VERSION (saveProfile method)
     ============================================================================
     ✅ FIXED: Removed username from updateData
     ✅ FIXED: Proper Authorization header
     ✅ FIXED: Correct field mapping
     ============================================================================ -->

<!-- ONLY SHOWING THE FIXED saveProfile() METHOD -->
<!-- Replace the existing saveProfile() method with this one -->

/**
 * Save profile changes
 */
const saveProfile = async () => {
  try {
    console.log('[ProfileEdit] Saving profile...')
    
    // Validate form
    if (!validateUsername()) {
      return
    }

    isSaving.value = true
    saveError.value = null
    successMessage.value = null

    // Prepare data - REMOVED username from here
    const updateData = {
      full_name: formData.value.full_name,
      bio: formData.value.bio,
      avatar_url: formData.value.avatar_url,
      location: formData.value.location,
      website: formData.value.website,
      birth_date: formData.value.birth_date || null,
      gender: formData.value.gender || null,
      is_private: formData.value.is_private
    }

    console.log('[ProfileEdit] Sending update request:', updateData)

    // Send update request with proper Authorization header
    const response = await fetch('/api/profile/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify(updateData)
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Failed to save profile')
    }

    const data = await response.json()
    console.log('[ProfileEdit] ✅ Profile saved:', data)

    // Update store
    profileStore.setProfile({
      ...profileStore.profile,
      ...data.data
    })

    // Update original data
    originalFormData.value = { ...formData.value }

    // Show success message
    const message = isNewProfile.value 
      ? 'Profile completed successfully!' 
      : 'Profile updated successfully!'
    successMessage.value = message

    // Redirect after delay
    setTimeout(() => {
      router.push(`/profile/${formData.value.username}`)
    }, 1500)

  } catch (err: any) {
    console.error('[ProfileEdit] Error saving profile:', err)
    saveError.value = err.message || 'Failed to save profile'
  } finally {
    isSaving.value = false
  }
}
