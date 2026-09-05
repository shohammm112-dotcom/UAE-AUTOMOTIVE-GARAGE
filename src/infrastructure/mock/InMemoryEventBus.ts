import { DomainEvent, IEventBus } from '../../domain/events/DomainEvent.ts';

export class InMemoryEventBus implements IEventBus {
  private readonly handlers = new Map<string, Array<(event: DomainEvent) => Promise<void> | void>>();
  private readonly publishedEvents: DomainEvent[] = [];

  public async publish(event: DomainEvent): Promise<void> {
    this.publishedEvents.push(event);
    const registered = this.handlers.get(event.eventName) || [];
    for (const handler of registered) {
      await handler(event);
    }
  }

  public subscribe(eventName: string, handler: (event: DomainEvent) => Promise<void> | void): void {
    const list = this.handlers.get(eventName) || [];
    list.push(handler);
    this.handlers.set(eventName, list);
  }

  public getPublishedEvents(): readonly DomainEvent[] {
    return Object.freeze([...this.publishedEvents]);
  }

  public clear(): void {
    this.handlers.clear();
    this.publishedEvents.length = 0;
  }
}
