// @ts-nocheck
declare const db: any

export default defineWebSocketHandler({
  open(_peer: any, socket: any) {
    socket.send(JSON.stringify({ message: 'Ad metrics stream connected' }))
  },
  message(_peer: any, socket: any, message: any) {
    const { adId } = JSON.parse(message)
    const interval = setInterval(async () => {
      const metrics = await db.collection('adMetrics').find({ adId }).toArray()
      const conversions = await db.collection('adConversions').find({ adId }).toArray()
      socket.send(JSON.stringify({
        impressions: metrics.filter((m: any) => m.action === 'impression').length,
        clicks: metrics.filter((m: any) => m.action === 'click').length,
        conversions: conversions.length
      }))
    }, 5000)

    socket.on('close', () => clearInterval(interval))
  }
})
