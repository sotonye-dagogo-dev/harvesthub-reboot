/**
 * Push Subscription Store (In-Memory)
 *
 * Shared in-memory storage for push subscriptions.
 * TODO: Replace with PushSubscription model in database (Prisma) for persistence.
 */

export interface StoredSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

const subscriptions = new Map<string, StoredSubscription>();

export function getSubscription(userId: string): StoredSubscription | undefined {
  return subscriptions.get(userId);
}

export function setSubscription(userId: string, subscription: StoredSubscription): void {
  subscriptions.set(userId, subscription);
}

export function deleteSubscription(userId: string): boolean {
  return subscriptions.delete(userId);
}
