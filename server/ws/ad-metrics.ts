export default defineWebSocketHandler({
  open(_, socket) {
    socket.send(JSON.stringify({ message: 'Ad metrics stream connected' }))
  },
  message(_, socket, message) {
    const { adId } = JSON.parse(message)
    const interval = setInterval(async () => {
      const metrics = await db.collection('adMetrics').find({ adId }).toArray()
      const conversions = await db.collection('adConversions').find({ adId }).toArray()
      socket.send(JSON.stringify({
        impressions: metrics.filter(m => m.action === 'impression').length,
        clicks: metrics.filter(m => m.action === 'click').length,
        conversions: conversions.length
      }))
    }, 5000)

    socket.on('close', () => clearInterval(interval))
  }
})
