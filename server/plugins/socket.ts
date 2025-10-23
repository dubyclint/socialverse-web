// server/plugins/socket.ts
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
  // Skip Socket.IO initialization during prerender
  if (process.env.NITRO_PRERENDER) {
    console.log('⏭️ Skipping Socket.IO initialization during prerender');
    return;
  }

  try {
    // Initialize Socket.IO server only if router is available
    if (nitroApp.router?.stack?.[0]?.handle) {
      io = new SocketIOServer(nitroApp.router.stack[0].handle, {
        cors: {
          origin: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
          credentials: true
        }
      });

      // Socket.IO event handlers
      io.on('connection', (socket) => {
        console.log('✅ User connected:', socket.id);
        // ... rest of your socket handlers
      });
    } else {
      console.warn('⚠️ Socket.IO router not available');
    }
  } catch (error) {
    console.warn('⚠️ Socket.IO initialization failed:', error instanceof Error ? error.message : 'Unknown error');
  }
});

