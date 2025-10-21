import Gun from 'gun/gun'
import 'gun/sea'

// Initialize Gun instance with peer server
const gunInstance = Gun(['https://gun-messaging-peer.herokuapp.com/gun'])

// Export a function to get the Gun instance
export const useGun = () => {
  return gunInstance
}

// Export the Gun instance directly for backward compatibility
export default gunInstance

// Nuxt plugin export
export default defineNuxtPlugin(() => {
  return {
    provide: {
      gun: gunInstance
    }
  }
})

