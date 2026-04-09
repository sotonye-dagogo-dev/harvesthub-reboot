import { describe, expect, it } from "vitest";
import { resolveNotificationTemplate } from "@/lib/services/notificationTemplateResolver";

describe("resolveNotificationTemplate", () => {
  it("resolves configured template content from metadata", () => {
    const resolved = resolveNotificationTemplate({
      type: "ORDER_CONFIRMED",
      metadata: { orderNumber: "ORD-1024" },
    });

    expect(resolved.title).toBe("Order Confirmed");
    expect(resolved.message).toContain("ORD-1024");
    expect(resolved.link).toBe("/orders");
    expect(resolved.emailSubject).toBe("Order Confirmed");
  });

  it("honors explicit fallback text and link overrides", () => {
    const resolved = resolveNotificationTemplate({
      type: "PROMOTION",
      fallbackTitle: "Custom title",
      fallbackMessage: "Custom message",
      fallbackLink: "/notifications",
      fallbackEmailSubject: "Custom subject",
    });

    expect(resolved.title).toBe("Custom title");
    expect(resolved.message).toBe("Custom message");
    expect(resolved.link).toBe("/notifications");
    expect(resolved.emailSubject).toBe("Custom subject");
  });
});
