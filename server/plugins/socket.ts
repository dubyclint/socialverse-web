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
  console.log('[Socket.IO Plugin] Initializing...');
  console.log('[Socket.IO Plugin] NODE_ENV:', process.env.NODE_ENV);
  console.log('[Socket.IO Plugin] NITRO_PRERENDER:', process.env.NITRO_PRERENDER);
  
  // Skip Socket.IO initialization during prerender
  if (process.env.NITRO_PRERENDER === 'true' || process.env.NITRO_PRERENDER === '1') {
    console.log('⏭️ [Socket.IO Plugin] Skipping Socket.IO initialization during prerender');
    return;
  }

  try {
    console.log('[Socket.IO Plugin] Checking router availability...');
    console.log('[Socket.IO Plugin] nitroApp.router exists:', !!nitroApp.router);
    console.log('[Socket.IO Plugin] nitroApp.router.stack exists:', !!nitroApp.router?.stack);
    console.log('[Socket.IO Plugin] nitroApp.router.stack length:', nitroApp.router?.stack?.length);
    
    // Initialize Socket.IO server only if router is available
    if (nitroApp.router?.stack?.[0]?.handle) {
      console.log('[Socket.IO Plugin] Router available, initializing Socket.IO...');
      
      io = new SocketIOServer(nitroApp.router.stack[0].handle, {
        cors: {
          origin: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
          credentials: true
        }
      });

      console.log('✅ [Socket.IO Plugin] Socket.IO initialized successfully');

      // Socket.IO event handlers
      io.on('connection', (socket) => {
        console.log('✅ [Socket.IO] User connected:', socket.id);
      });
    } else {
      console.warn('⚠️ [Socket.IO Plugin] Socket.IO router not available - this is normal during prerender');
    }
  } catch (error) {
    console.error('❌ [Socket.IO Plugin] Initialization failed:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error: error
    });
  }
});

