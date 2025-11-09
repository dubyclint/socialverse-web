// services/contactSyncService.js
const UserContact = require('../models/userContact');
const { supabase } = require('../utils/supabase');
const gun = require('../utils/gunInstance');

class ContactSyncService {
  // Background sync for newly registered users
  async syncNewUserContacts(newUserId, userPhone, userEmail) {
    try {
      console.log(`Syncing contacts for new user: ${newUserId}`);

      // Find existing contacts that match this new user
      const matchingContacts = await UserContact.findAll({
        where: {
          [Op.or]: [
            userPhone ? { contactPhone: userPhone } : {},
            userEmail ? { contactEmail: userEmail } : {}
          ],
          isRegistered: false
        }
      });

      // Update matching contacts to registered
      for (const contact of matchingContacts) {
        await contact.update({
          contactUserId: newUserId,
          isRegistered: true
        });

        // Notify the contact owner that their contact joined
        await this.notifyContactJoined(contact.userId, newUserId);
      }

      console.log(`Updated ${matchingContacts.length} contacts for new user`);
      return matchingContacts.length;

    } catch (error) {
      console.error('Sync new user contacts error:', error);
      return 0;
    }
  }

  // Notify user that their contact joined
  async notifyContactJoined(userId, joinedUserId) {
    try {
      const { data: joinedUser } = await supabase
        .from('users')
        .select('username, avatar_url')
        .eq('id', joinedUserId)
        .single();

      await supabase
        .from('notifications')
        .insert([{
          user_id: userId,
          type: 'contact_joined',
          title: 'Contact Joined SocialVerse',
          message: `${joinedUser.username} is now on SocialVerse!`,
          data: {
            joinedUserId,
            joinedUsername: joinedUser.username,
            joinedAvatar: joinedUser.avatar_url
          }
        }]);

    } catch (error) {
      console.error('Notify contact joined error:', error);
    }
  }

  // Periodic cleanup of expired invitations
  async cleanupExpiredInvitations() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Remove old unregistered contacts that haven't been interacted with
      const deletedCount = await UserContact.destroy({
        where: {
          isRegistered: false,
          lastInteraction: null,
          createdAt: { [Op.lt]: thirtyDaysAgo }
        }
      });

      console.log(`Cleaned up ${deletedCount} expired contact invitations`);
      return deletedCount;

    } catch (error) {
      console.error('Cleanup expired invitations error:', error);
      return 0;
    }
  }

  // Sync contacts with Gun.js for real-time updates
  async syncContactsWithGun(userId, contacts) {
    try {
      const gunContacts = gun.get('contacts').get(userId);
      
      const contactsData = contacts.reduce((acc, contact) => {
        acc[contact.id] = {
          id: contact.id,
          name: contact.contactName,
          isRegistered: contact.isRegistered,
          isPal: contact.isPal,
          isBlocked: contact.isBlocked,
          lastInteraction: contact.lastInteraction,
          contactUserId: contact.contactUserId
        };
        return acc;
      }, {});

      gunContacts.put(contactsData);

    } catch (error) {
      console.error('Sync contacts with Gun error:', error);
    }
  }

  // Get contact suggestions based on mutual friends
  async getContactSuggestions(userId, limit = 10) {
    try {
      // Get user's current pals
      const { data: userPals } = await supabase
        .from('pals')
        .select('requester_id, addressee_id')
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
        .eq('status', 'accepted');

      const palIds = userPals.map(pal => 
        pal.requester_id === userId ? pal.addressee_id : pal.requester_id
      );

      if (palIds.length === 0) return [];

      // Find mutual friends
      const { data: suggestions } = await supabase
        .from('pals')
        .select(`
          requester_id,
          addressee_id,
          requester:requester_id(id, username, avatar_url, is_verified),
          addressee:addressee_id(id, username, avatar_url, is_verified)
        `)
        .in('requester_id', palIds)
        .eq('status', 'accepted')
        .limit(limit);

      // Filter out current user and existing pals
      const filteredSuggestions = suggestions
        .map(suggestion => {
          const suggestedUser = suggestion.requester_id !== userId ? 
            suggestion.requester : suggestion.addressee;
          return suggestedUser;
        })
        .filter(user => user.id !== userId && !palIds.includes(user.id));

      return filteredSuggestions;

    } catch (error) {
      console.error('Get contact suggestions error:', error);
      return [];
    }
  }
}

module.exports = new ContactSyncService();
