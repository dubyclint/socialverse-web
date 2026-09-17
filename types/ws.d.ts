// Permissive ambient types for WebSocket streaming handlers and runtime models
// These are intentionally permissive to unblock incremental migration edits.
// Permissive ambient types for WebSocket streaming handlers and runtime models
// These are intentionally permissive to unblock incremental migration edits.

declare module '*stream-models*' {
  const Stream: any
  const StreamChat: any
  const StreamViewer: any
  const StreamPewGift: any
  export { Stream, StreamChat, StreamViewer, StreamPewGift }
}

// Provide permissive global declarations if the project lacks stricter ones.
declare const Stream: any
declare const StreamChat: any
declare const StreamViewer: any
declare const StreamPewGift: any

// Minimal defineWebSocketHandler helper to match usage in server/gateway/socket/handlers/*.ts files.
declare function defineWebSocketHandler(handler: {
  open?: (peer: any, socket: any) => any
  message?: (peer: any, socket: any, message?: any) => any
  close?: (peer: any, socket: any) => any
}): any

// Minimal socket shape used by the handlers in server/gateway/socket/handlers
interface MinimalSocket {
  id?: string
  send: (data: string) => void
  [key: string]: any
}

export {}
