// composables/useChat.ts - ENHANCED WITH GUNDB + SOCKET.IO
// =========================================================

import { ref, computed, onMounted, onUnmounted } from 'vue'
import { io, Socket } from 'socket.io-client'
import Gun from 'gun'
import 'gun/sea'
import { useChatStore } from '~/stores/chat'
import { useAuthStore } from '~/stores/auth'

interface ChatMessage {
  id: string
  chatId: string
  senderId: string
  senderName: string
  content: string
  timestamp: string
  isEdited: boolean
  isDeleted: boolean
  messageType: 'text' | 'image' | 'file' | 'system'
}

export const useChat = () => {
  const chatStore = useChatStore()
  const authStore = useAuthStore()
  
  let socket: Socket | null = null
  let gun: any = null
  let gunUser: any = null
  
  const isOnline = ref(true)
  const isSyncing = ref(false)
  const lastSyncTime = ref<number>(0)

  // ===== INITIALIZE GUNDB =====
  const initializeGunDB = async () => {
    try {
      // Initialize Gun with peers
      gun = Gun({
        peers: [
          typeof window !== 'undefined' && window.location.origin
            ? `${window.location.origin}/gun`
            : 'http://localhost:3000/gun'
        ],
        localStorage: true // Enable local storage for offline support
      });

      // Authenticate Gun user
      const user = authStore.user;
      if (user) {
        gunUser = gun.user();
        
        // Try to authenticate or create account
        gunUser.auth(user.email, user.id, (ack: any) => {
          if (ack.err) {
            console.log('Gun auth error, creating new user:', ack.err);
            gunUser.create(user.email, user.id, (ack: any) => {
              if (ack.err) {
                console.error('Failed to create Gun user:', ack.err);
              } else {
                console.log('Gun user created successfully');
              }
            });
          } else {
            console.log('Gun user authenticated');
          }
        });
      }

      console.log('GunDB initialized');
      return gun;

    } catch (error) {
      console.error('Failed to initialize GunDB:', error);
      return null;
    }
  };

  // ===== INITIALIZE SOCKET.IO =====
  const initializeSocket = async () => {
    try {
      const user = authStore.user;
      if (!user) {
        console.warn('No authenticated user');
        return null;
      }

      const socketUrl = process.client
        ? window.location.origin
        : 'http://localhost:3000';

      socket = io(socketUrl, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
        transports: ['websocket', 'polling'],
        auth: {
          userId: user.id,
          username: user.username,
          token: authStore.token
        }
      });

      // Connection events
      socket.on('connect', () => {
        console.log('Socket connected:', socket?.id);
        chatStore.setConnected(true);
        isOnline.value = true;
        
        // Sync offline messages when reconnected
        syncOfflineMessages();
      });

      socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        chatStore.setConnected(false);
        isOnline.value = false;
      });

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        chatStore.setConnected(false);
      });

      // Message events
      socket.on('message:new', (message: ChatMessage) => {
        console.log('New message received:', message);
        chatStore.addMessage(message);
        
        // Also store in GunDB
        if (gun && gunUser) {
          gun.get(`chats/${message.chatId}`)
            .get('messages')
            .get(message.id)
            .put(message);
        }
      });

      socket.on('message:updated', (message: ChatMessage) => {
        chatStore.updateMessage(message);
        if (gun) {
          gun.get(`chats/${message.chatId}`)
            .get('messages')
            .get(message.id)
            .put(message);
        }
      });

      socket.on('message:deleted', (data: { messageId: string }) => {
        chatStore.deleteMessage(data.messageId);
      });

      socket.on('messages:loaded', (data: { messages: ChatMessage[]; source: string }) => {
        console.log(`Messages loaded from ${data.source}:`, data.messages.length);
        chatStore.addMessages(chatStore.currentChatId || '', data.messages);
      });

      socket.on('messages:history', (data: { messages: ChatMessage[]; source: string }) => {
        console.log(`Message history loaded from ${data.source}:`, data.messages.length);
        chatStore.addMessages(chatStore.currentChatId || '', data.messages);
      });

      socket.on('user:typing', (data: { userId: string; username: string; isTyping: boolean }) => {
        if (data.isTyping) {
          chatStore.addTypingUser({
            userId: data.userId,
            username: data.username,
            roomId: chatStore.currentChatId || ''
          });
        } else {
          chatStore.removeTypingUser(data.userId);
        }
      });

      socket.on('user:joined', (data: any) => {
        console.log('User joined:', data.username);
      });

      socket.on('user:left', (data: any) => {
        console.log('User left:', data.username);
      });

      socket.on('error', (error: any) => {
        console.error('Socket error:', error);
        chatStore.setError(error.message);
      });

      socket.on('sync:offline-messages', (data: { messages: ChatMessage[]; syncTime: string }) => {
        console.log('Offline messages synced:', data.messages.length);
        chatStore.addMessages(chatStore.currentChatId || '', data.messages);
        lastSyncTime.value = new Date(data.syncTime).getTime();
        isSyncing.value = false;
      });

      console.log('Socket.io initialized');
      return socket;

    } catch (error) {
      console.error('Failed to initialize Socket.io:', error);
      return null;
    }
  };

  // ===== JOIN CHAT =====
  const joinChat = (chatId: string) => {
    if (!socket?.connected) {
      console.warn('Socket not connected');
      return;
    }

    socket.emit('join_chat', { chatId });
    chatStore.setCurrentChat(chatId);
  };

  // ===== SEND MESSAGE =====
  const sendMessage = async (chatId: string, content: string, messageType: string = 'text') => {
    if (!socket?.connected) {
      console.warn('Socket not connected, saving to GunDB for offline sync');
      
      // Save to GunDB for offline support
      if (gun && gunUser) {
        const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const message: ChatMessage = {
          id: messageId,
          chatId,
          senderId: authStore.user?.id || '',
          senderName: authStore.user?.username || '',
          content,
          timestamp: new Date().toISOString(),
          isEdited: false,
          isDeleted: false,
          messageType: messageType as any
        };

        gun.get(`chats/${chatId}`)
          .get('messages')
          .get(messageId)
          .put(message);

        chatStore.addMessage(message);
      }
      return;
    }

    socket.emit('message:send', {
      chatId,
      content,
      messageType
    });
  };

  // ===== EDIT MESSAGE =====
  const editMessage = (chatId: string, messageId: string, content: string) => {
    if (!socket?.connected) {
      console.warn('Socket not connected');
      return;
    }

    socket.emit('message:edit', {
      chatId,
      messageId,
      content
    });
  };

  // ===== DELETE MESSAGE =====
  const deleteMessage = (chatId: string, messageId: string) => {
    if (!socket?.connected) {
      console.warn('Socket not connected');
      return;
    }

    socket.emit('message:delete', {
      chatId,
      messageId
    });
  };

  // ===== TYPING INDICATOR =====
  const sendTypingIndicator = (chatId: string, isTyping: boolean) => {
    if (!socket?.connected) return;

    socket.emit('user:typing', {
      chatId,
      isTyping
    });
  };

  // ===== SYNC OFFLINE MESSAGES =====
  const syncOfflineMessages = () => {
    if (!socket?.connected || !chatStore.currentChatId) return;

    isSyncing.value = true;
    socket.emit('sync:offline-messages', {
      chatId: chatStore.currentChatId,
      lastSyncTime: lastSyncTime.value
    });
  };

  // ===== LEAVE CHAT =====
  const leaveChat = (chatId: string) => {
    if (!socket?.connected) return;

    socket.emit('leave_chat', { chatId });
  };

  // ===== DISCONNECT =====
  const disconnect = () => {
    if (socket?.connected) {
      socket.disconnect();
      socket = null;
      chatStore.setConnected(false);
    }

    if (gun) {
      gun = null;
    }
  };

  // ===== INITIALIZE ALL =====
  const initialize = async () => {
    try {
      await initializeGunDB();
      await initializeSocket();
    } catch (error) {
      console.error('Failed to initialize chat:', error);
    }
  };

  return {
    socket,
    gun,
    isOnline,
    isSyncing,
    initialize,
    joinChat,
    sendMessage,
    editMessage,
    deleteMessage,
    sendTypingIndicator,
    syncOfflineMessages,
    leaveChat,
    disconnect
  };
};
