// ============================================================================
// plugins/socket.client.ts - SOCKET.IO CLIENT PLUGIN (LAZY LOADED)
// ============================================================================

declare global {
  interface Window {
    $socket?: any
  }
}

let io: any = null;
let socketInstance: any = null;

async function getSocketIO() {
  if (!io) {
    const module = await import('socket.io-client');
    io = module.io;
  }
  return io;
}

export default defineNuxtPlugin(() => {
  return {
    provide: {
      socket: {
        async connect(url?: string) {
          if (socketInstance) {
            return socketInstance;
          }

          const ioLib = await getSocketIO();
          const socketUrl = url || window.location.origin;
          
          socketInstance = ioLib(socketUrl, {
            transports: ['websocket', 'polling'],
            autoConnect: false
          });

          return socketInstance;
        },
        getInstance() {
          return socketInstance;
        },
        async disconnect() {
          if (socketInstance) {
            socketInstance.disconnect();
            socketInstance = null;
          }
        }
      }
    }
  }
})
