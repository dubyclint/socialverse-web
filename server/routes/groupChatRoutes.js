// server/routes/groupChatRoutes.js
// Nuxt 3 Consolidated Route Handler - Group Chat Management
import groupChatController from '../api/controllers/groupChatController'
import { authenticateToken } from '../api/middleware/auth'

export default defineEventHandler(async (event) => {
  const { method } = event
  const path = event.node.req.url?.split('?')[0] || ''
  
  // Extract route parameters
  const groupIdMatch = path.match(/\/group-chat\/([^/]+)/)
  const groupId = groupIdMatch?.[1]
  
  const memberIdMatch = path.match(/\/group-chat\/([^/]+)\/members\/([^/]+)/)
  const memberId = memberIdMatch?.[2]

  try {
    // Create new group
    if (method === 'POST' && path.endsWith('/group-chat/create')) {
      await authenticateToken(event)
      return await groupChatController.createGroup(event)
    }

    // Get user's groups
    if (method === 'GET' && path === '/group-chat') {
      await authenticateToken(event)
      return await groupChatController.getUserGroups(event)
    }

    // Get group details
    if (method === 'GET' && groupId && !path.includes('/members') && !path.includes('/info') && !path.includes('/settings')) {
      await authenticateToken(event)
      return await groupChatController.getGroupDetails(event, groupId)
    }

    // Update group info (name, description, avatar)
    if (method === 'PATCH' && path.includes('/info')) {
      await authenticateToken(event)
      return await groupChatController.updateGroupInfo(event, groupId)
    }

    // Update group settings
    if (method === 'PATCH' && path.includes('/settings')) {
      await authenticateToken(event)
      return await groupChatController.updateGroupSettings(event, groupId)
    }

    // Add members to group
    if (method === 'POST' && path.includes('/members') && !memberId) {
      await authenticateToken(event)
      return await groupChatController.addMembers(event, groupId)
    }

    // Remove member from group
    if (method === 'DELETE' && memberId) {
      await authenticateToken(event)
      return await groupChatController.removeMember(event, groupId, memberId)
    }

    throw createError({
      statusCode: 404,
      message: 'Route not found'
    })
  } catch (error) {
    console.error('Group Chat Route Error:', error)
    throw error
  }
})
