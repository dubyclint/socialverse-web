// server/plugins/gun-server.ts
// FIXED: No type imports, simple mock

export default defineNitroPlugin((nitroApp) => {
  console.log('[Gun Server] GUN DISABLED - causes History error during build')
  
  const gunMock = {
    get: () => ({
      on: () => {},
      once: () => {},
      put: () => ({ on: () => {}, once: () => {} }),
    }),
    put: () => ({
      on: () => {},
      once: () => {},
    }),
    set: () => ({
      on: () => {},
      once: () => {},
    }),
    off: () => {},
  }

  if (typeof globalThis !== 'undefined') {
    (globalThis as any).gun = gunMock
  }
})


