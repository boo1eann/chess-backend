export interface QueueEntry {
  userId: string;
  username: string;
  enqueuedAt: Date;
}

export interface MatchmakingQueue {
  enqueue(entry: QueueEntry): boolean;
  remove(userId: string): boolean;
  has(userId: string): boolean;
  size(): number;
  takeNext(): QueueEntry | null;
}
