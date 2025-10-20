// composables/useGun.js
import Gun from 'gun/gun'
import 'gun/sea'

const gun = Gun(['https://gun-messaging-peer.herokuapp.com/gun'])

export default gun
