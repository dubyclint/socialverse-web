// routes/contactSyncRoutes.js
const express = require('express');
const router = express.Router();
const contactSyncController = require('../controllers/contactSyncController');
const { authenticateToken } = require('../middleware/auth');

// Sync contacts from device
router.post('/sync', authenticateToken, contactSyncController.syncContacts);

// Send hi message with friend request
router.post('/send-hi', authenticateToken, contactSyncController.sendHiMessage);

// Respond to friend request
router.post('/friend-request/respond', authenticateToken, contactSyncController.respondToFriendRequest);

// Get user contacts
router.get('/', authenticateToken, contactSyncController.getUserContacts);

// Invite unregistered contacts
router.post('/invite', authenticateToken, contactSyncController.inviteContacts);

// Block/Unblock contact
router.patch('/:contactUserId/block', authenticateToken, contactSyncController.toggleBlockContact);

module.exports = router;
