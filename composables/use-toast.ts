import { useNuxtApp } from '#app'

interface ToastOptions {
  duration?: number
  position?: 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  type?: 'success' | 'error' | 'warning' | 'info'
}

export interface ToastApi {
  success: (message: string, options?: ToastOptions) => string
  error: (message: string, options?: ToastOptions) => string
  warning: (message: string, options?: ToastOptions) => string
  info: (message: string, options?: ToastOptions) => string
  show: (message: string, options?: ToastOptions) => string
  remove: (id: string) => void
  clear: () => void
}

/**
 * Access the toast notification API provided by `plugins/toast.client.ts`.
 */
export function useToast(): ToastApi {
  const { $toast } = useNuxtApp()
  return $toast as ToastApi
}
