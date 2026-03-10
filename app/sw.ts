/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist, NetworkFirst, StaleWhileRevalidate, ExpirationPlugin } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope & typeof globalThis;

// Filter out sw.js and API routes from default runtime caching
const filteredCache = defaultCache.filter(
  (entry) =>
    !("urlPattern" in entry &&
      entry.urlPattern instanceof RegExp &&
      (entry.urlPattern.test("/sw.js") || entry.urlPattern.test("/api/")))
);

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    ...filteredCache,
    // Cache page navigations — NetworkFirst with short timeout for fast offline access
    {
      matcher: ({ request, url }: { request: Request; url: URL }) =>
        request.destination === "document" && !url.pathname.startsWith("/api/"),
      handler: new NetworkFirst({
        cacheName: "pages-cache",
        networkTimeoutSeconds: 3,
        plugins: [
          new ExpirationPlugin({
            maxEntries: 64,
            maxAgeSeconds: 24 * 60 * 60,
          }),
        ],
      }),
    },
    // Cache RSC (React Server Component) payloads for instant client-side navigations
    {
      matcher: ({ request }: { request: Request }) => request.headers.get("RSC") === "1",
      handler: new StaleWhileRevalidate({
        cacheName: "rsc-cache",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 64,
            maxAgeSeconds: 24 * 60 * 60,
          }),
        ],
      }),
    },
    // Cache auth/me responses briefly so offline auth checks don't fail immediately
    {
      matcher: ({ url }: { url: URL }) => url.pathname === "/api/auth/me",
      handler: new NetworkFirst({
        cacheName: "auth-cache",
        networkTimeoutSeconds: 2,
        plugins: [
          new ExpirationPlugin({
            maxEntries: 1,
            maxAgeSeconds: 60 * 60,
          }),
        ],
      }),
    },
  ],
  // Only fall back to offline.html when NO cached version exists at all
  fallbacks: {
    entries: [
      {
        url: "/offline.html",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

// Handle push notifications
self.addEventListener("push", (event: PushEvent) => {
  if (!event.data) return;

  const data = event.data.json();
  const options: NotificationOptions & { renotify?: boolean } = {
    body: data.body || "",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
    data: data.data || {},
    tag: data.tag || "myharvesthub-notification",
    renotify: true,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "MyHarvestHub", options)
  );
});

// Handle notification click
self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();

  const url = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === url && "focus" in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});

serwist.addEventListeners();
