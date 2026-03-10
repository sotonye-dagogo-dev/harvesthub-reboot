/**
 * Push Notification Service
 *
 * Server-side service for sending web push notifications via the web-push library.
 * Requires VAPID keys to be configured in environment variables.
 */

import webpush from "web-push";

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

let configured = false;

function ensureConfigured(): boolean {
  if (configured) return true;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  if (!publicKey || !privateKey || !subject) {
    console.warn(
      "Push notifications disabled: VAPID keys not configured. " +
        "Set NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, and VAPID_SUBJECT."
    );
    return false;
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

/**
 * Send a push notification to a subscribed client.
 * Returns `true` on success, `false` on failure (never throws).
 */
export async function sendPushNotification(
  subscription: PushSubscriptionData,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<boolean> {
  if (!ensureConfigured()) return false;

  try {
    const payload = JSON.stringify({ title, body, data });

    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      },
      payload
    );

    return true;
  } catch (error) {
    console.error("Failed to send push notification:", error);
    return false;
  }
}
