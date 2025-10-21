// server/plugins/socket.ts
// ✅ FIXED - Proper Socket.IO initialization
import type { NitroApp } from 'nitropack';
import { Server as SocketIOServer } from 'socket.io';

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: number;
  avatar?: string;
  roomId?: string;
}

interface User {
  id: string;
  username: string;
  avatar?: string;
  socketId: string;
}

let io: SocketIOServer | null = null;
const connectedUsers = new Map<string, User>();
const chatRooms = new Map<string, ChatMessage[]>();

export default defineNitroPlugin((nitroApp: NitroApp) => {
  try {
    // Initialize Socket.IO server
    if (nitroApp.router) {
      io = new SocketIOServer(nitroApp.router.stack[0]?.handle, {
        cors: {
          origin: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
          credentials: true
        }
      });

      // Socket.IO event handlers
      io.on('connection', (socket) => {
        console.log('✅ User connected:', socket.id);

        socket.on('join_room', (data) => {
          socket.join(data.roomId);
          if (!chatRooms.has(data.roomId)) {
            chatRooms.set(data.roomId, []);
          }
        });

        socket.on('send_message', (data) => {
          const message: ChatMessage = {
            id: socket.id,
            userId: data.userId,
            username: data.username,
            message: data.message,
            timestamp: Date.now(),
            avatar: data.avatar,
            roomId: data.roomId
          };

          if (chatRooms.has(data.roomId)) {
            chatRooms.get(data.roomId)!.push(message);
          }

          io?.to(data.roomId).emit('receive_message', message);
        });

        socket.on('disconnect', () => {
          console.log('✅ User disconnected:', socket.id);
          connectedUsers.delete(socket.id);
        });
      });

      console.log('✅ Socket.IO server initialized');
    }
  } catch (error) {
    console.warn('⚠️ Socket.IO initialization skipped:', error instanceof Error ? error.message : 'Unknown error');
  }
});

// Export for use in other parts of the app
export { io, connectedUsers, chatRooms };

