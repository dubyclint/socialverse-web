// server/ws/contactEvents.js
const UserContact = require('../../models/userContact');
const { Pal } = require('../../models/pal');
const { supabase } = require('../../utils/supabase');

class ContactEvents {
  static setupContactEvents(io, socket) {
    // Friend request sent
    socket.on('send_friend_request', async (data) => {
      try {
        const { contactUserId, message = "Hi! 👋" } = data;
        const senderId = socket.userId;

        // Send friend request
        const friendRequest = await Pal.sendFriendRequest(senderId, contactUserId);

        // Notify recipient
        const recipientSocketId = io.connectedUsers?.get(contactUserId);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('friend_request_received', {
            request: friendRequest,
            message,
            sender: {
              id: senderId,
              username: socket.username,
              avatar: socket.userAvatar
            }
          });
        }

        socket.emit('friend_request_sent', {
          success: true,
          request: friendRequest
        });

      } catch (error) {
        console.error('Send friend request error:', error);
        socket.emit('friend_request_sent', {
          success: false,
          error: error.message
        });
      }
    });

    // Friend request response
    socket.on('respond_friend_request', async (data) => {
      try {
        const { requestId, action } = data; // 'accept' | 'block'
        const userId = socket.userId;

        if (action === 'accept') {
          // Accept friend request
          const { data: friendRequest } = await supabase
            .from('pals')
            .select(`
              *,
              requester:requester_id(id, username, avatar_url)
            `)
            .eq('id', requestId)
            .eq('addressee_id', userId)
            .single();

          if (friendRequest) {
            await Pal.acceptFriendRequest(friendRequest.requester_id, userId);

            // Update contact records
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

            // Notify requester
            const requesterSocketId = io.connectedUsers?.get(friendRequest.requester_id);
            if (requesterSocketId) {
              io.to(requesterSocketId).emit('friend_request_accepted', {
                acceptedBy: {
                  id: userId,
                  username: socket.username,
                  avatar: socket.userAvatar
                },
                requestId
              });
            }

            socket.emit('friend_request_responded', {
              success: true,
              action: 'accepted',
              requestId
            });
          }

        } else if (action === 'block') {
          // Block user
          await supabase
            .from('pals')
            .update({ status: 'blocked' })
            .eq('id', requestId);

          socket.emit('friend_request_responded', {
            success: true,
            action: 'blocked',
            requestId
          });
        }

      } catch (error) {
        console.error('Respond friend request error:', error);
        socket.emit('friend_request_responded', {
          success: false,*_
// server/ws/contactEvents.js (continued)
          error: error.message
        });
      }
    });

    // Contact sync status
    socket.on('sync_contacts', async (data) => {
      try {
        const { contacts } = data;
        const userId = socket.userId;

        // Emit sync progress
        socket.emit('contact_sync_progress', {
          status: 'started',
          total: contacts.length
        });

        let processed = 0;
        const syncResults = {
          registered: [],
          unregistered: [],
          alreadyPals: []
        };

        for (const contact of contacts) {
          try {
            // Process contact sync logic here
            // This would call the contact sync service
            processed++;
            
            socket.emit('contact_sync_progress', {
              status: 'processing',
              processed,
              total: contacts.length,
              currentContact: contact.name
            });

          } catch (contactError) {
            console.error('Contact sync error:', contactError);
          }
        }

        socket.emit('contact_sync_completed', {
          status: 'completed',
          results: syncResults
        });

      } catch (error) {
        console.error('Sync contacts error:', error);
        socket.emit('contact_sync_error', {
          error: error.message
        });
      }
    });

    // Contact online status updates
    socket.on('subscribe_contact_status', async (data) => {
      try {
        const { contactIds } = data;
        const userId = socket.userId;

        // Verify contacts are user's pals
        const { data: pals } = await supabase
          .from('pals')
          .select('requester_id, addressee_id')
          .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
          .eq('status', 'accepted');

        const palIds = pals.map(pal => 
          pal.requester_id === userId ? pal.addressee_id : pal.requester_id
        );

        const validContactIds = contactIds.filter(id => palIds.includes(id));

        // Send current online status for valid contacts
        const onlineStatuses = {};
        for (const contactId of validContactIds) {
          onlineStatuses[contactId] = io.connectedUsers?.has(contactId) || false;
        }

        socket.emit('contact_statuses', onlineStatuses);

      } catch (error) {
        console.error('Subscribe contact status error:', error);
      }
    });

    // Block/Unblock contact
    socket.on('toggle_block_contact', async (data) => {
      try {
        const { contactUserId, action } = data; // 'block' | 'unblock'
        const userId = socket.userId;

        const contact = await UserContact.findOne({
          where: { userId, contactUserId }
        });

        if (contact) {
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

          // Notify blocked user if they're online
          if (isBlocked) {
            const blockedUserSocketId = io.connectedUsers?.get(contactUserId);
            if (blockedUserSocketId) {
              io.to(blockedUserSocketId).emit('blocked_by_user', {
                blockedBy: userId
              });
            }
          }

          socket.emit('contact_block_toggled', {
            success: true,
            contactUserId,
            isBlocked
          });
        }

      } catch (error) {
        console.error('Toggle block contact error:', error);
        socket.emit('contact_block_toggled', {
          success: false,
          error: error.message
        });
      }
    });

    // Contact search
    socket.on('search_contacts', async (data) => {
      try {
        const { query, type = 'all' } = data; // 'all', 'pals', 'registered'
        const userId = socket.userId;

        let whereClause = { userId };
        
        if (type === 'pals') {
          whereClause.isPal = true;
        } else if (type === 'registered') {
          whereClause.isRegistered = true;
        }

        if (query) {
          whereClause.contactName = { [Op.iLike]: `%${query}%` };
        }

        const contacts = await UserContact.findAll({
          where: whereClause,
          include: [{
            model: User,
            as: 'ContactUser',
            attributes: ['id', 'username', 'avatar', 'isOnline', 'lastSeen'],
            required: false
          }],
          limit: 20,
          order: [['contactName', 'ASC']]
        });

        socket.emit('contact_search_results', {
          query,
          type,
          contacts
        });

      } catch (error) {
        console.error('Search contacts error:', error);
        socket.emit('contact_search_results', {
          query: data.query,
          error: error.message
        });
      }
    });
  }
}

module.exports = ContactEvents;
