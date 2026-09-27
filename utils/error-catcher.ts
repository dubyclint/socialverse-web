// ============================================================================
// FILE: /utils/error-catcher.ts - FULLY RECONCILED ORIGINAL STANDARD
// ============================================================================

import { ref } from 'vue'

export interface ParsedError {
  message: string
  statusCode: number
  raw?: any
}

export interface CapturedError {
  type: string
  message: string
  statusCode: number
  timestamp: string
  raw?: any
}

export interface ErrorReport {
  totalErrors: number
  errors: CapturedError[]
}

// Parse authentication errors
export const parseAuthError = (error: any): ParsedError => {
  if (!error) {
    return { message: 'An unexpected error occurred', statusCode: 500 }
  }

  // Handle Nuxt Fetch errors
  if (error.data?.statusMessage) {
    return {
      message: error.data.statusMessage,
      statusCode: error.statusCode || 500,
      raw: error
    }
  }

  if (error.data?.message) {
    return {
      message: error.data.message,
      statusCode: error.statusCode || 500,
      raw: error
    }
  }

  // Handle Supabase errors
  if (error.message) {
    return {
      message: error.message,
      statusCode: error.status || 400,
      raw: error
    }
  }

  // Handle string errors
  if (typeof error === 'string') {
    return {
      message: error,
      statusCode: 500,
      raw: error
    }
  }

  return {
    message: 'An unexpected error occurred',
    statusCode: 500,
    raw: error
  }
}

// Composable for capturing and managing signup errors
export const useSignupErrorCatcher = () => {
  const errors = ref<CapturedError[]>([])

  const captureError = (type: string, error: any): CapturedError => {
    const parsed = parseAuthError(error)
    
    const capturedError: CapturedError = {
      type,
      message: parsed.message,
      statusCode: parsed.statusCode,
      timestamp: new Date().toISOString(),
      raw: error
    }

    errors.value.push(capturedError)
    return capturedError
  }

  const getLastError = (): CapturedError | null => {
    if (errors.value.length === 0) return null
    return errors.value[errors.value.length - 1] ?? null
  }

  const getErrorsByType = (type: string): CapturedError[] => {
    return errors.value.filter(err => err.type === type)
  }

  const hasErrors = (): boolean => {
    return errors.value.length > 0
  }

  const hasErrorOfType = (type: string): boolean => {
    return errors.value.some(err => err.type === type)
  }

  const getErrorMessage = (type?: string): string => {
    if (!type) {
      const lastError = getLastError()
      return lastError?.message || 'An error occurred'
    }

    const error = errors.value.find(err => err.type === type)
    return error?.message || 'An error occurred'
  }

  const clearErrors = (): void => {
    errors.value = []
  }

  const printReport = (): ErrorReport => {
    return {
      totalErrors: errors.value.length,
      errors: errors.value
    }
  }

  return {
    errors,
    captureError,
    getLastError,
    getErrorsByType,
    hasErrors,
    hasErrorOfType,
    getErrorMessage,
    clearErrors,
    printReport
  }
}
