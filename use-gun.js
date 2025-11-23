// use-gun.ts
import Gun from 'gun/gun'
import 'gun/sea'

interface GunInstance {
  get: (key: string) => any
  put: (data: any) => any
  on: (callback: (data: any) => void) => any
}

const gun: GunInstance = Gun({
  peers: [
    typeof window !== 'undefined' && window.location.origin
      ? `${window.location.origin}/gun`
      : 'http://localhost:3000/gun'
  ]
})

export default gun

