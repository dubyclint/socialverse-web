export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validateUserId = (userId: string): boolean => {
  return userId && userId.length > 0
}

export const validateFeature = (feature: string): boolean => {
  return feature && feature.length > 0
}

export const validatePriority = (priority: string): boolean => {
  return ['LOW', 'MEDIUM', 'HIGH'].includes(priority)
}

export const validateStatus = (status: string): boolean => {
  return ['ACTIVE', 'INACTIVE', 'DRAFT'].includes(status)
}
