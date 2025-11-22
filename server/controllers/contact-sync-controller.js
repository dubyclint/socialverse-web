// server/controllers/contact-sync-controller.js
const UserContact = require('../models/userContact');
const { User } = require('../models/user');
const { Pal } = require('../models/pal');
const { supabase } = require('../utils/supabase');
const { Op } = require('sequelize');

class ContactSyncController {
  // Sync user's phone/email contacts
  async syncContacts(req, res) {
    try {
      const { contacts } = req.body; // Array of {name, phone, email}
      const userId = req.user.id;

      if (!contacts || !Array.isArray(contacts)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Contacts array is required' 
        });
      }

      const syncResults = {
        registered: [],
        unregistered: [],
        alreadyPals: [],
        errors: []
      };

      for (const contact of contacts) {
        try {
          const { name, phone, email } = contact;
          
          if (!name || (!phone && !email)) {
            syncResults.errors.push({ contact, error: 'Name and phone/email required' });
            continue;
          }

          // Normalize phone number (remove spaces, dashes, etc.)
          const normalizedPhone = phone ? phone.replace(/\D/g, '') : null;
          const normalizedEmail = email ? email.toLowerCase().trim() : null;

          // Check if contact is already in user's contact list
          const existingContact = await UserContact.findOne({
            where: {
              userId,
              [Op.or]: [
                normalizedPhone ? { contactPhone: normalizedPhone } : {},
                normalizedEmail ? { contactEmail: normalizedEmail } : {}
              ]
            }
          });

          if (existingContact) {
            // Update existing contact
            await existingContact.update({
              contactName: name,
              contactPhone: normalizedPhone,
              contactEmail: normalizedEmail
            });
            continue;
          }

          // Check if contact is a registered user
          const registeredUser = await this.findRegisteredUser(normalizedPhone, normalizedEmail);
          
          let contactUserId = null;
          let isRegistered = false;
          let isPal = false;

          if (registeredUser) {
            contactUserId = registeredUser.id;
            isRegistered = true;

            // Check if already pals
            const palRelation = await this.checkPalRelation(userId, registeredUser.id);
            isPal = palRelation !== null;

            syncResults.registered.push({
              ...registeredUser,
              contactName: name,
              isPal,
              palStatus: palRelation?.status || null
            });

            if (isPal) {
              syncResults.alreadyPals.push(registeredUser);
            }
          } else {
            syncResults.unregistered.push({
              name,
              phone: normalizedPhone,
              email: normalizedEmail
            });
          }

          // Create/update contact record
          await UserContact.create({
            userId,
            contactUserId,
            contactPhone: normalizedPhone,
            contactEmail: normalizedEmail,
            contactName: name,
            isRegistered,
            isPal
          });

        } catch (contactError) {
          console.error('Contact sync error:', contactError);
          syncResults.errors.push({ 
            contact, 
            error: contactError.message 
          });
        }
      }

      res.json({ 
        success: true, 
        syncResults,
        message: `Synced ${contacts.length} contacts. Found ${syncResults.registered.length} registered users.`
      });

    } catch (error) {
      console.error('Sync contacts error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Find registered user by phone or email
  async findRegisteredUser(phone, email) {
    try {
      const whereClause = [];
      
      if (phone) {
        whereClause.push({ phone: phone });
      }
      
      if (email) {
        whereClause.push({ email: email });
      }

      if (whereClause.length === 0) return null;

      // Query Supabase for registered user
      let query = supabase
        .from('users')
        .select('id, username, email, phone, avatar_url, is_verified, is_online, last_seen');

      if (phone && email) {
        query = query.or(`phone.eq.${phone},email.eq.${email}`);
      } else if (phone) {
        query = query.eq('phone', phone);
      } else if (email) {
        query = query.eq('email', email);
      }

      const { data, error } = await query.single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Find registered user error:', error);
      return null;
    }
  }

  // Check if two users are already pals
  async checkPalRelation(userId1, userId2) {
    try {
      const { data, error } = await supabase
        .from('pals')
        .select('*')
        .or(`and(requester_id.eq.${userId1},addressee_id.eq.${userId2}),and(requester_id.eq.${userId2},addressee_id.eq.${userId1})`)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Check pal relation error:', error);
      return null;
    }
  }

  // Send "Hi" message with friend request
  async sendHiMessage(req, res) {
    try {
      const { contactUserId, message = "Hi! 👋" } = req.body;
      const senderId = req.user.id;

      // Verify contact exists and is registered
      const contact = await UserContact.findOne({
        where: {
          userId: senderId,
          contactUserId,
          isRegistered: true
        }
      });

      if (!contact) {
        return res.status(404).json({ 
          success: false, 
          error: 'Contact not found or not registered' 
        });
      }

      // Check if already pals
      const existingPal = await this.checkPalRelation(senderId, contactUserId);
      
      if (existingPal && existingPal.status === 'accepted') {
        return res.status(400).json({ 
          success: false, 
          error: 'Already friends with this user' 
        });
      }

      if (existingPal && existingPal.status === 'pending') {
        return res.status(400).json({ 
          success: false, 
          error: 'Friend request already sent' 
        });
      }

      // Send friend request with hi message
      const friendRequest = await Pal.sendFriendRequest(senderId, contactUserId);

      // Create notification for the recipient
      await this.createFriendRequestNotification(senderId, contactUserId, message);

      // Update contact interaction
      await contact.update({ lastInteraction: new Date() });

      res.json({ 
        success: true, 
        friendRequest,
        message: 'Hi message sent with friend request!' 
      });

    } catch (error) {
      console.error('Send hi message error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Handle friend request response (accept/block)
  async respondToFriendRequest(req, res) {
    try {
      const { requestId, action, response } = req.body; // action: 'accept' | 'block'
      const userId = req.user.id;

      // Get friend request
      const { data: friendRequest, error } = await supabase
        .from('pals')
        .select(`
          *,
          requester:requester_id(id, username, avatar_url)
        `)
        .eq('id', requestId)
        .eq('addressee_id', userId)
        .eq('status', 'pending')
        .single();

      if (error || !friendRequest) {
        return res.status(404).json({ 
          success: false, 
          error: 'Friend request not found' 
        });
      }

      if (action === 'accept') {
        // Accept friend request
        const acceptedRequest = await Pal.acceptFriendRequest(
          friendRequest.requester_id, 
          userId
        );

        // Update both users' contact records
        await UserContact.update(
          { isPal: true, lastInteraction: new Date() },
          { 
            where: {
              [Op.or]: [
                { userId, contactUserId: friendRequest.requester_id },
                { userId: friendRequest.requester_id, contactUserId: userId }
              ]
            }
          }
        );

        // Create direct chat between the users
        const chatController = require('./chatController');
        await chatController.createDirectChat({
          body: { contactUserId: friendRequest.requester_id },
          user: { id: userId }
        }, { json: () => {} });

        // Notify requester of acceptance
        await this.createFriendAcceptedNotification(userId, friendRequest.requester_id);

        res.json({ 
          success: true, 
          message: 'Friend request accepted!',
          friendship: acceptedRequest
        });

      } else if (action === 'block') {
        // Block user
        await supabase
          .from('pals')
          .update({ status: 'blocked' })
          .eq('id', requestId);

        // Update contact record
        await UserContact.update(
          { isBlocked: true },
          { where: { userId, contactUserId: friendRequest.requester_id } }
        );

        res.json({ 
          success: true, 
          message: 'User blocked successfully' 
        });

      } else {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid action. Use "accept" or "block"' 
        });
      }

    } catch (error) {
      console.error('Respond to friend request error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Get user's contacts with status
  async getUserContacts(req, res) {
    try {
      const userId = req.user.id;
      const { filter = 'all' } = req.query; // 'all', 'registered', 'pals', 'unregistered'

      let whereClause = { userId };

      switch (filter) {
        case 'registered':
          whereClause.isRegistered = true;
          break;
        case 'pals':
          whereClause.isPal = true;
          break;
        case 'unregistered':
          whereClause.isRegistered = false;
          break;
      }

      const contacts = await UserContact.findAll({
        where: whereClause,
        include: [{
          model: User,
          as: 'ContactUser',
          attributes: ['id', 'username', 'avatar', 'isOnline', 'lastSeen', 'isVerified'],
          required: false
        }],
        order: [
          ['isPal', 'DESC'],
          ['isRegistered', 'DESC'],
          ['lastInteraction', 'DESC'],
          ['contactName', 'ASC']
        ]
      });

      res.json({ success: true, contacts });

    } catch (error) {
      console.error('Get user contacts error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Invite unregistered contacts
  async inviteContacts(req, res) {
    try {
      const { contactIds, customMessage } = req.body;
      const userId = req.user.id;

      const contacts = await UserContact.findAll({
        where: {
          id: { [Op.in]: contactIds },
          userId,
          isRegistered: false
        }
      });

      const inviteResults = [];

      for (const contact of contacts) {
        try {
          // Send SMS/Email invitation
          const inviteResult = await this.sendInvitation(contact, customMessage);
          inviteResults.push({
            contact: contact.contactName,
            success: inviteResult.success,
            method: inviteResult.method
          });
        } catch (inviteError) {
          inviteResults.push({
            contact: contact.contactName,
            success: false,
            error: inviteError.message
          });
        }
      }

      res.json({ 
        success: true, 
        inviteResults,
        message: `Sent ${inviteResults.filter(r => r.success).length} invitations`
      });

    } catch (error) {
      console.error('Invite contacts error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Send invitation via SMS or Email
  async sendInvitation(contact, customMessage) {
    const defaultMessage = `Hey ${contact.contactName}! Join me on SocialVerse - a private social platform. Download: [APP_LINK]`;
    const message = customMessage || defaultMessage;

    if (contact.contactPhone) {
      // Send SMS invitation
      return await this.sendSMSInvitation(contact.contactPhone, message);
    } else if (contact.contactEmail) {
      // Send Email invitation
      return await this.sendEmailInvitation(contact.contactEmail, contact.contactName, message);
    }

    throw new Error('No phone or email available for invitation');
  }

  // SMS invitation service
  async sendSMSInvitation(phone, message) {
    // Implement your SMS service (Twilio, AWS SNS, etc.)
    // This is a placeholder implementation
    console.log(`SMS Invitation to ${phone}: ${message}`);
    
    return {
      success: true,
      method: 'SMS',
      phone
    };
  }

  // Email invitation service
  async sendEmailInvitation(email, name, message) {
    // Implement your email service (SendGrid, AWS SES, etc.)
    // This is a placeholder implementation
    console.log(`Email Invitation to ${email} (${name}): ${message}`);
    
    return {
      success: true,
      method: 'Email',
      email
    };
  }

  // Create friend request notification
  async createFriendRequestNotification(senderId, recipientId, message) {
    try {
      const { data: sender } = await supabase
        .from('users')
        .select('username, avatar_url')
        .eq('id', senderId)
        .single();

      await supabase
        .from('notifications')
        .insert([{
          user_id: recipientId,
          type: 'friend_request',
          title: 'New Friend Request',
          message: `${sender.username} sent you a friend request: "${message}"`,
          data: {
            senderId,
            senderUsername: sender.username,
            senderAvatar: sender.avatar_url,
            message
          }
        }]);

    } catch (error) {
      console.error('Create friend request notification error:', error);
    }
  }

  // Create friend accepted notification
  async createFriendAcceptedNotification(accepterId, requesterId) {
    try {
      const { data: accepter } = await supabase
        .from('users')
        .select('username, avatar_url')
        .eq('id', accepterId)
        .single();

      await supabase
        .from('notifications')
        .insert([{
          user_id: requesterId,
          type: 'friend_accepted',
          title: 'Friend Request Accepted',
          message: `${accepter.username} accepted your friend request!`,
          data: {
            accepterId,
            accepterUsername: accepter.username,
            accepterAvatar: accepter.avatar_url
          }
        }]);

    } catch (error) {
      console.error('Create friend accepted notification error:', error);
    }
  }

  // Block/Unblock contact
  async toggleBlockContact(req, res) {
    try {
      const { contactUserId } = req.params;
      const { action } = req.body; // 'block' | 'unblock'
      const userId = req.user.id;

      const contact = await UserContact.findOne({
        where: { userId, contactUserId }
      });

      if (!contact) {
        return res.status(404).json({ 
          success: false, 
          error: 'Contact not found' 
        });
      }

      const isBlocked = action === 'block';
      
      await contact.update({ isBlocked });

      // Update pal relationship if exists
      if (contact.isPal) {
        const status = isBlocked ? 'blocked' : 'accepted';
        await supabase
          .from('pals')
          .update({ status })
          .or(`and(requester_id.eq.${userId},addressee_id.eq.${contactUserId}),and(requester_id.eq.${contactUserId},addressee_id.eq.${userId})`);
      }

      res.json({ 
        success: true, 
        message: `Contact ${isBlocked ? 'blocked' : 'unblocked'} successfully` 
      });

    } catch (error) {
      console.error('Toggle block contact error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new ContactSyncController();
