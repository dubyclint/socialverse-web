// server/routes/contactSyncRoutes.js
// Nuxt 3 Server Route - Contact Synchronization
import contactSyncController from '../api/controllers/contactSyncController'
import { authenticateToken } from '../api/middleware/auth'

export default defineEventHandler(async (event) => {
  const { method, node } = event
  const path = getRouterParam(event, 'path')
  
  // Sync contacts from device
  if (method === 'POST' && path === '/sync') {
    await authenticateToken(event)
    return await contactSyncController.syncContacts(event)
  }
  
  // Send hi message with friend request
  if (method === 'POST' && path === '/send-hi') {
    await authenticateToken(event)
    return await contactSyncController.sendHiMessage(event)
  }
  
  // Respond to friend request
  if (method === 'POST' && path === '/friend-request/respond') {
    await authenticateToken(event)
    return await contactSyncController.respondToFriendRequest(event)
  }
  
  // Get user contacts
  if (method === 'GET' && path === '/') {
    await authenticateToken(event)
    return await contactSyncController.getUserContacts(event)
  }
  
  // Invite unregistered contacts
  if (method === 'POST' && path === '/invite') {
    await authenticateToken(event)
    return await contactSyncController.inviteContacts(event)
  }
  
  // Block/Unblock contact
  if (method === 'PATCH' && path?.startsWith('/')) {
    const contactUserId = path.split('/')[1]
    if (path.endsWith('/block')) {
      await authenticateToken(event)
      return await contactSyncController.toggleBlockContact(event, contactUserId)
    }
  }
})

