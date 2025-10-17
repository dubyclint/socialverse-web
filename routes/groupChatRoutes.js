// routes/groupChatRoutes.js
const express = require('express');
const router = express.Router();
const groupChatController = require('../controllers/groupChatController');
const { authenticateToken } = require('../middleware/auth');

// Create new group
router.post('/create', authenticateToken, groupChatController.createGroup);

// Get user's groups
router.get('/', authenticateToken, groupChatController.getUserGroups);

// Get group details
router.get('/:groupId', authenticateToken, groupChatController.getGroupDetails);

// Update group info (name, description, avatar)
router.patch('/:groupId/info', authenticateToken, groupChatController.updateGroupInfo);

// Update group settings
router.patch('/:groupId/settings', authenticateToken, groupChatController.updateGroupSettings);

// Add members to group
router.post('/:groupId/members', authenticateToken, groupChatController.addMembers);

// Remove member from group
router.delete('/:groupId/members/:memberId', authenticateToken, groupChatController.removeMember);

// Change member role (promote/demote)
router.patch('/:groupId/members/:memberId/role', authenticateToken, groupChatController.changeRole);

module.exports = router;
