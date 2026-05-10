import type { MatchmakingQueue, QueueEntry } from './matchmaking-queue.interface';

export class InMemoryMatchmakingQueue implements MatchmakingQueue {
  private readonly queue: QueueEntry[] = [];
  private readonly byUserId = new Map<string, QueueEntry>();

  enqueue(entry: QueueEntry): boolean {
    if (this.byUserId.has(entry.userId)) return false;
    this.queue.push(entry);
    this.byUserId.set(entry.userId, entry);
    return true;
  }

  remove(userId: string): boolean {
    const entry = this.byUserId.get(userId);
    if (!entry) return false;
    this.byUserId.delete(userId);
    const idx = this.queue.indexOf(entry);
    if (idx >= 0) this.queue.splice(idx, 1);
    return true;
  }

  has(userId: string): boolean {
    return this.byUserId.has(userId);
  }

  size(): number {
    return this.queue.length;
  }

  takeNext(): QueueEntry | null {
    const entry = this.queue.shift();
    if (entry) this.byUserId.delete(entry.userId);
    return entry ?? null;
  }
}
