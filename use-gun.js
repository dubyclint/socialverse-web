import Gun from 'gun/gun'
import 'gun/sea'

// Connect to your local Nuxt server's Gun peer
const gun = Gun({
  peers: [
    typeof window !== 'undefined' && window.location.origin 
      ? `${window.location.origin}/gun`
      : 'http://localhost:3000/gun'
  ],
})

export default gun

