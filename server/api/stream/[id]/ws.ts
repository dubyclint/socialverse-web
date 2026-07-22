// server/api/stream/[id]/ws.ts
import { defineWebSocketHandler } from 'h3'

const streamConnections = new Map<string, Set<WebSocket>>()

export default defineWebSocketHandler({
  open(peer) {
    const streamId = (peer as any).url?.split('/').pop()
    if (!streamId) return

    if (!streamConnections.has(streamId)) {
      streamConnections.set(streamId, new Set())
    }
    streamConnections.get(streamId)?.add((peer as any).websocket)
  },

  async message(peer, message) {
    try {
      const text = typeof (message as any).text === 'function' ? (message as any).text() : String(message)
      const data = JSON.parse(text)
      const streamId = (peer as any).url?.split('/').pop()

      if (!streamId) return

      // Broadcast to all connected clients
      const connections = streamConnections.get(streamId)
      if (connections) {
        connections.forEach((ws: any) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(data))
          }
        })
      }
    } catch (err) {
      console.error('WebSocket message error:', err)
    }
  },

  close(peer) {
    const streamId = (peer as any).url?.split('/').pop()
    if (!streamId) return

    const connections = streamConnections.get(streamId)
    if (connections) {
      connections.delete((peer as any).websocket)
      if (connections.size === 0) {
        streamConnections.delete(streamId)
      }
    }
  }
})
