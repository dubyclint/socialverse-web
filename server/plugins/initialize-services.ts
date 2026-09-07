// /server/plugins/initialize-services.ts
// FIXED: No type imports, no dynamic imports

export default defineNitroPlugin((_nitroApp: any) => {
  console.log('🚀 [Initialize Services] Plugin loaded')
  console.log('✅ [Initialize Services] Ready')
})

