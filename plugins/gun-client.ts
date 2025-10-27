import Gun from 'gun/gun'
import 'gun/sea'

// Initialize Gun instance with peer server
// Wrapped in try-catch to prevent app breaking if Gun fails
let gunInstance: any = null

try {
  gunInstance = Gun({
    peers: ['https://gun-messaging-peer.herokuapp.com/gun'],
    localStorage: false, // Disable localStorage to avoid issues
    radisk: false // Disable radisk
  })
  console.log('Gun: Initialized successfully')
} catch (err) {
  console.error('Gun: Initialization failed:', err)
  // Create a dummy Gun instance that doesn't do anything
  gunInstance = {
    get: () => ({ on: () => {}, once: () => {} }),
    put: () => ({ on: () => {}, once: () => {} }),
    set: () => ({ on: () => {}, once: () => {} }),
  }
}

// Export a function to get the Gun instance
export const useGun = () => {
  return gunInstance
}

// Nuxt plugin export
export default defineNuxtPlugin(() => {
  return {
    provide: {
      gun: gunInstance
    }
  }
})
