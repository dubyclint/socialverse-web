// Event Logger - Logs ML events for analytics and causal inference
export class EventLogger {
  constructor() {
    this.events = []
    this.batchSize = 100
    this.flushInterval = 30000 // 30 seconds
    this.startBatchProcessor()
  }

  async initialize() {
    console.log('📊 Event Logger initialized')
  }

  async logFeedGeneration(logData) {
    try {
      const event = {
        type: 'feed_generation',
        timestamp: new Date().toISOString(),
        data: logData,
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }

      this.events.push(event)

      // Flush if batch size reached
      if (this.events.length >= this.batchSize) {
        await this.flushEvents()
      }

      return event.id
    } catch (error) {
      console.error('Error logging feed generation:', error)
    }
  }

  async logUserInteraction(userId, interactionData) {
    try {
      const event = {
        type: 'user_interaction',
        userId,
        timestamp: new Date().toISOString(),
        data: interactionData,
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }

      this.events.push(event)

      if (this.events.length >= this.batchSize) {
        await this.flushEvents()
      }

      return event.id
    } catch (error) {
      console.error('Error logging user interaction:', error)
    }
  }

  async logModelPerformance(modelName, performanceMetrics) {
    try {
      const event = {
        type: 'model_performance',
        modelName,
        timestamp: new Date().toISOString(),
        data: performanceMetrics,
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }

      this.events.push(event)
      return event.id
    } catch (error) {
      console.error('Error logging model performance:', error)
    }
  }

  async flushEvents() {
    if (this.events.length === 0) return

    try {
      const eventsToFlush = [...this.events]
      this.events = []

      // TODO: Send to analytics backend/database
      console.log(`📤 Flushing ${eventsToFlush.length} events to analytics`)

      // Example: Send to your analytics service
      // await fetch('/api/analytics/events', {
      //   method: 'POST',
      //   body: JSON.stringify({ events: eventsToFlush })
      // })
    } catch (error) {
      console.error('Error flushing events:', error)
      // Re-add events if flush failed
      this.events.push(...eventsToFlush)
    }
  }

  startBatchProcessor() {
    setInterval(async () => {
      await this.flushEvents()
    }, this.flushInterval)
  }

  async shutdown() {
    await this.flushEvents()
    console.log('📊 Event Logger shutdown')
  }
        }
    
