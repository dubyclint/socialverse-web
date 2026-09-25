// FILE: /server/plugins/database-context.ts
// FIXED: No type imports, simple export

export default defineNitroPlugin((_nitroApp: any) => {
  console.log('[Database Context Plugin] Initializing...')
  console.log('[Database Context Plugin] Ready')
})
