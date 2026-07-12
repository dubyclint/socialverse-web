// Permissive ambient declaration for the 'nitropack' types the project imports in some server files.
// This intentionally uses 'any' to avoid blocking incremental migration edits.
declare module 'nitropack' {
  export type NitroApp = any
  export type H3Event = any
  const _default: any
  export default _default
}

export {}
