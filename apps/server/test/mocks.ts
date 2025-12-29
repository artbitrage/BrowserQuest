import { EventEmitter } from 'events';
import { vi } from 'vitest';

export class MockConnection {
  id = 'mock-conn-id';
  private messageListeners: ((message: any) => void)[] = [];
  private closeListeners: (() => void)[] = [];

  send = vi.fn();
  close = vi.fn();

  listen(callback: (message: any) => void) {
    this.messageListeners.push(callback);
  }

  onClose(callback: () => void) {
    this.closeListeners.push(callback);
  }

  // Helper to simulate incoming message
  receive(message: any) {
    this.messageListeners.forEach((cb) => cb(message));
  }

  // Helper to simulate close
  simulateClose() {
    this.closeListeners.forEach((cb) => cb());
  }
}

export class MockWorldServer {
  id = 'mock-world';
  playerCount = 0;

  handleMobHate = vi.fn();
  handleHurtEntity = vi.fn();
  getEntityById = vi.fn();
  incrementPlayerCount = vi.fn();
  decrementPlayerCount = vi.fn();
  pushToPlayer = vi.fn();
  pushToGroup = vi.fn();
  pushToAdjacentGroups = vi.fn();
  pushToPreviousGroups = vi.fn();
  pushBroadcast = vi.fn();
  pushRelevantEntityListTo = vi.fn();
  handleEntityGroupMembership = vi.fn().mockReturnValue(false);

  // Add other methods as needed
}
