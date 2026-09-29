import { EventEmitter } from 'node:events';
import type { EventRecord } from './types';

declare global {
  var __hookbayBus: EventEmitter | undefined;
}

export const bus: EventEmitter =
  globalThis.__hookbayBus ?? (globalThis.__hookbayBus = new EventEmitter());
bus.setMaxListeners(0);

export function channelName(endpointId: string): string {
  return `endpoint:${endpointId}`;
}

export function publish(endpointId: string, event: EventRecord): void {
  bus.emit(channelName(endpointId), event);
}

export function subscriberCount(endpointId: string): number {
  return bus.listenerCount(channelName(endpointId));
}
