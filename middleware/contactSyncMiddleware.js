// middleware/contactSyncMiddleware.js
const contactSyncService = require('../services/contactSyncService');

// Middleware to sync contacts when user registers
const syncContactsOnRegistration = async (req, res, next) => {
  try {
    // This runs after successful user registration
    if (req.newUser && req.newUser.id) {
      const { id, phone, email } = req.newUser;
      
      // Background sync - don't wait for completion
      contactSyncService.syncNewUserContacts(id, phone, email)
        .catch(error => console.error('Background contact sync failed:', error));
    }
    
    next();
  } catch (error) {
    console.error('Contact sync middleware error:', error);
    next(); // Don't block registration if sync fails
  }
};

module.exports = { syncContactsOnRegistration };
