import type { Server } from 'socket.io'

let server: Server | null = null

/** Holds the Socket.IO server so HTTP handlers can push realtime events. */
export const setSocketServer = (io: Server | null) => {
  server = io
}

export const getSocketServer = (): Server | null => server

/** Rooms that reach every member of a chat, whether or not the chat is open. */
export const chatAudience = (chatId: string, memberIds: string[]): string[] => [
  `chat:${chatId}`,
  ...memberIds.map(id => `user:${id}`)
]
