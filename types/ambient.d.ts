// Lightweight ambient declarations to reduce noise during staged TS remediation.
// These are intentionally permissive (any) and are temporary until proper types are added.

// Expose commonly used runtime/global helpers as permissive globals.
declare global {
  // Nuxt/Nitro helpers and auto-imports
  function $fetch<T = any>(url: string, opts?: any): Promise<T>
  namespace $fetch {
    function create(defaults?: any): typeof $fetch
  }
  function useRuntimeConfig(): any
  function useSupabaseClient(...args: any[]): any
  function useSupabaseUser(): any
  function useNuxtApp(): any
  const api: any
  function useCookie(name?: string): { value: any }
  function useState<T = any>(key: string, init?: any): any

  // Vue auto-import helpers used widely in the codebase
  function ref<T = any>(value?: T): any
  function computed<T = any>(fn?: any): any
  function watch(...args: any[]): any
  function readonly<T = any>(v: T): any

  // Pinia helper (lightweight)
  function defineStore(id: string, setup?: any): any

  // Global window extensions (web3 + app init)
  interface Window {
    ethereum?: any
    __appPluginReady?: boolean
  }

  // Process flags used in the code (Nuxt-like)
  namespace NodeJS {
    interface Process {
      client: boolean
      server: boolean
    }
  }

  // Nitro / runtime helpers
  function defineWebSocketHandler(handler: any): any
}

// Module shims for the Nuxt auto-import proxy modules and aliases
declare module '#imports' {
  export function useSupabaseClient(...args: any[]): any
  export function useRuntimeConfig(): any
  export function useCookie(name?: string): { value: any }
  export const $fetch: typeof globalThis.$fetch
  export const api: any
}

declare module '#imports/*' {
  const _default: any
  export default _default
}

declare module '#app' {
  export function defineNuxtPlugin(fn: any): any
  export function useNuxtApp(): any
  export function useCookie(name?: string): any
  export function useRuntimeConfig(): any
  export function navigateTo(to: any, options?: any): any
  export function createError(err: any): any
  export function useRouter(): any
  export function useRoute(): any
  export function useHead(meta: any): any
  export function useSeoMeta(meta: any): any
}

declare module '#supabase/server' {
  export const serverSupabaseClient: any
  export default serverSupabaseClient
}

declare module '@/abis/*' {
  const value: any
  export default value
}

declare module '@/*' {
  const value: any
  export default value
}

// Permissive shims for server models referenced in ws handlers
declare module '~/models/Stream' { const Stream: any; export { Stream } }
declare module '~/models/StreamChat' { const StreamChat: any; export { StreamChat } }
declare module '~/models/StreamViewer' { const StreamViewer: any; export { StreamViewer } }
declare module '~/models/StreamPewGift' { const StreamPewGift: any; export { StreamPewGift } }

declare module '*.json' {
  const value: any
  export default value
}

declare module 'h3' {
  export type H3Event = any
}

export {}
