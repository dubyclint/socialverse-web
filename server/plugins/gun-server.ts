import { defineEventHandler, readBody } from 'h3'
import Gun from 'gun'
import type { NitroApp } from 'nitropack'

let gunInstance: any = null

export default defineNitroPlugin((nitroApp: NitroApp) => {
  // Initialize Gun instance with Nitro server
  gunInstance = Gun({
    peers: [],
    localStorage: false,
    radisk: false,
  })

  console.log('✅ GunDB peer initialized')

  // Expose Gun API endpoint
  nitroApp.router.post('/gun', defineEventHandler(async (event) => {
    try {
      const body = await readBody(event)
      // Handle Gun protocol requests
      return { success: true, data: body }
    } catch (error) {
      console.error('Gun API error:', error)
      return { success: false, error: 'Gun API error' }
    }
  }))

  // Health check endpoint
  nitroApp.router.get('/gun/health', defineEventHandler(() => {
    return { status: 'ok', gun: 'running' }
  }))
})

export { gunInstance }
