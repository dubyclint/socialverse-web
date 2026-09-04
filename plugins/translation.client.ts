// ============================================================================
// FILE: /plugins/translation.client.ts
// Description: Pinia-sequenced internationalization bootstrap and safe runtime fallback.
// ============================================================================
import { defineNuxtPlugin } from '#app'

export default defineNuxtPlugin({
  name: 'socialverse-translation',

  // ✅ FIX: Force Pinia core to load first before importing stateful localization composables
  dependsOn: ['pinia'],

  async setup(_nuxtApp: any) {
    console.log('[Plugin] Translation plugin initializing...')
    
    try {
      const { loadTranslations, detectBrowserLanguage, t, setLanguage, getCurrentLang } = await import('@/composables/use-I18n')

      const browserLang = detectBrowserLanguage()
      
      // ✅ CRITICAL: Load translations in background, don't block app initialization
      loadTranslations(browserLang).catch((err) => {
        console.warn('[Plugin] Failed to load translations in background:', err)
        // Continue anyway - app should work with initial local fallback buffers
      })
      
      console.log('[Plugin] Translation plugin initialized successfully')
      
      return {
        provide: {
          t: (key: string, defaultValue?: string) => t(key, defaultValue || key),
          setLanguage,
          getCurrentLang,
        },
      }
    } catch (err) {
      console.error('[Plugin] Translation plugin initialization failed:', err)
      
      // ✅ CRITICAL FALLBACK: Provide safe global dummy properties so the layout template engine doesn't throw white-screen runtime exceptions
      return {
        provide: {
          t: (key: string, defaultValue?: string) => defaultValue || key,
          setLanguage: async () => {},
          getCurrentLang: () => 'en',
        },
      }
    }
  }
})
