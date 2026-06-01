// Interface for future AWS EventBridge replacement
export interface EventPublisher {
  publish(event: string, data: unknown): Promise<void>;
}

// Current implementation: Console logger
export class ConsoleLoggerEventPublisher implements EventPublisher {
  async publish(event: string, data: unknown): Promise<void> {
    console.log(`[Event] ${event}:`, JSON.stringify(data));
  }
}

// Singleton instance
export const eventPublisher: EventPublisher = new ConsoleLoggerEventPublisher();
