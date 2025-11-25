    interface LogEvent {
  type: string;
  timestamp: string;
  data: any;
  id: string;
}

export class EventLogger {
  private events: LogEvent[];
  private batchSize: number;
  private flushInterval: number;

  constructor() {
    this.events = [];
    this.batchSize = 100;
    this.flushInterval = 30000;
    this.startBatchProcessor();
  }

  async initialize(): Promise<void> {
    console.log('📊 Event Logger initialized');
  }

  async logFeedGeneration(logData: any): Promise<string> {
    try {
      const event: LogEvent = {
        type: 'feed_generation',
        timestamp: new Date().toISOString(),
        data: logData,
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      this.events.push(event);

      if (this.events.length >= this.batchSize) {
        await this.flushEvents();
      }

      return event.id;
    } catch (error) {
      console.error('Error logging feed generation:', error);
      return '';
    }
  }

  async logUserInteraction(userId: string, interactionData: any): Promise<string> {
    try {
      const event: LogEvent = {
        type: 'user_interaction',
        timestamp: new Date().toISOString(),
        data: { userId, ...interactionData },
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      this.events.push(event);

      if (this.events.length >= this.batchSize) {
        await this.flushEvents();
      }

      return event.id;
    } catch (error) {
      console.error('Error logging user interaction:', error);
      return '';
    }
  }

  private startBatchProcessor(): void {
    setInterval(async () => {
      if (this.events.length > 0) {
        await this.flushEvents();
      }
    }, this.flushInterval);
  }

  private async flushEvents(): Promise<void> {
    if (this.events.length === 0) return;

    try {
      // Send to database or analytics service
      console.log(`Flushing ${this.events.length} events`);
      this.events = [];
    } catch (error) {
      console.error('Error flushing events:', error);
    }
  }
}

