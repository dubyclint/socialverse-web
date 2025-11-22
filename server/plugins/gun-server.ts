// server/plugins/gun-server.ts
// ✅ FIXED - Proper ES module import
import type { NitroApp } from 'nitropack';
import Gun from 'gun';

let gunInstance: any = null;

export default defineNitroPlugin((nitroApp: NitroApp) => {
  try {
    gunInstance = Gun({
      peers: [],
      localStorage: false,
      radisk: false,
    });

    console.log('✅ GunDB peer initialized');
    
    // Make Gun instance available globally
    (globalThis as any).gun = gunInstance;
  } catch (error) {
    console.warn('⚠️ GunDB initialization skipped:', error instanceof Error ? error.message : 'Unknown error');
  }
});



