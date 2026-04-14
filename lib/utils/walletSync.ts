export const WALLET_SYNC_EVENT = "myharvesthub:wallet-sync";

export type WalletSyncReason =
  | "wallet-deposit"
  | "wallet-withdraw"
  | "order-cancel"
  | "order-refund-request"
  | "order-refund-review"
  | "order-confirm-delivery"
  | "order-grouped-action";

export type WalletSyncDetail = {
  reason: WalletSyncReason;
  timestamp: number;
};

export function emitWalletSync(reason: WalletSyncReason): void {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent<WalletSyncDetail>(WALLET_SYNC_EVENT, {
      detail: {
        reason,
        timestamp: Date.now(),
      },
    })
  );
}

export function subscribeWalletSync(onSync: (detail: WalletSyncDetail) => void): () => void {
  if (typeof window === "undefined") return () => undefined;

  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<WalletSyncDetail>;
    if (!customEvent.detail) return;
    onSync(customEvent.detail);
  };

  window.addEventListener(WALLET_SYNC_EVENT, handler as EventListener);

  return () => {
    window.removeEventListener(WALLET_SYNC_EVENT, handler as EventListener);
  };
}