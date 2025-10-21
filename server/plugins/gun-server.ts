// ✅ FIXED - Simplified GunDB initialization with error handling
import type { NitroApp } from 'nitropack'

let gunInstance: any = null

export default defineNitroPlugin((nitroApp: NitroApp) => {
  try {
    // Initialize Gun instance with minimal config
    const Gun = require('gun')
    
    gunInstance = Gun({
      peers: [],
      localStorage: false,
      radisk: false,
    })

    console.log('✅ GunDB peer initialized')
  } catch (error) {
    console.warn('⚠️ GunDB initialization skipped:', error instanceof Error ? error.message : 'Unknown error')
    // App continues without GunDB
  }
})

