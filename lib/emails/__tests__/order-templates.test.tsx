import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { OrderConfirmation } from "@/lib/emails/OrderConfirmation";
import { OrderStatusUpdate } from "@/lib/emails/OrderStatusUpdate";
import { DEFAULT_EMAIL_TEMPLATES } from "@/lib/config/emailTemplates";
import { NOTIFICATION_TEMPLATE_CONFIG } from "@/lib/config/notificationTemplates";

const SERVICE_EVENT_KEYS = [
  "SERVICE_REQUIREMENTS_REQUESTED",
  "SERVICE_REQUIREMENTS_SUBMITTED",
  "SERVICE_DELIVERED",
  "SERVICE_RELEASED",
  "SERVICE_REVISION_REQUESTED",
  "SERVICE_REQUIREMENTS_TIMEOUT",
] as const;

describe("order email template completeness", () => {
  it("renders grouped metadata and structured totals in confirmation template", () => {
    render(
      <OrderConfirmation
        firstName="Ada"
        buyerEmail="ada@example.com"
        orderNumber="MHH-1001"
        orderGroupId="GRP-1001"
        items={[{ name: "Fresh Yam", quantity: 2, price: 3500 }]}
        subtotal={7000}
        deliveryFee={1500}
        total={8500}
        deliveryMethod="DELIVERY"
        deliveryAddress="12 Market Street"
        vendorName="Fresh Farm"
      />
    );

    expect(screen.getByText(/order number/i)).toBeInTheDocument();
    expect(screen.getByText(/grouped checkout/i)).toBeInTheDocument();
    expect(screen.getByText(/grp-1001/i)).toBeInTheDocument();
    expect(screen.getByText(/buyer email/i)).toBeInTheDocument();
    expect(screen.getByText(/ada@example.com/i)).toBeInTheDocument();
    expect(screen.getByText(/^Vendor$/)).toBeInTheDocument();
    expect(screen.getAllByText(/fresh farm/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/subtotal/i)).toBeInTheDocument();
    expect(screen.getByText(/delivery fee/i)).toBeInTheDocument();
    expect(screen.getByText(/^Total$/)).toBeInTheDocument();
  });

  it("renders grouped and payment metadata rows in status update template", () => {
    render(
      <OrderStatusUpdate
        firstName="Ada"
        orderNumber="MHH-1002"
        orderGroupId="GRP-1002"
        status="OUT_FOR_DELIVERY"
        vendorName="Harvest Home"
        total={9200}
        paymentStatus="PAID"
        note="Rider is en route"
      />
    );

    expect(screen.getByText(/grouped checkout/i)).toBeInTheDocument();
    expect(screen.getByText(/grp-1002/i)).toBeInTheDocument();
    expect(screen.getByText(/order total/i)).toBeInTheDocument();
    expect(screen.getByText(/payment status/i)).toBeInTheDocument();
    expect(screen.getByText(/paid/i)).toBeInTheDocument();
    expect(screen.getByText(/note from vendor/i)).toBeInTheDocument();
  });
});

describe("service notification + email template completeness", () => {
  it("defines an editable DEFAULT_EMAIL_TEMPLATES entry for every service event", () => {
    for (const key of SERVICE_EVENT_KEYS) {
      const definition = DEFAULT_EMAIL_TEMPLATES[key];
      expect(definition, `missing DEFAULT_EMAIL_TEMPLATES key ${key}`).toBeDefined();
      if (!definition) continue;
      expect(definition.key).toBe(key);
      expect(definition.label.length).toBeGreaterThan(0);
      expect(definition.defaultSubject.length).toBeGreaterThan(0);
      expect(definition.defaultBody.length).toBeGreaterThan(0);
      expect(definition.variables.length).toBeGreaterThan(0);
    }
  });

  it("defines a NOTIFICATION_TEMPLATE_CONFIG entry for every service event", () => {
    for (const key of SERVICE_EVENT_KEYS) {
      const config = NOTIFICATION_TEMPLATE_CONFIG[key];
      expect(config, `missing NOTIFICATION_TEMPLATE_CONFIG entry ${key}`).toBeDefined();
      expect(config.title.length).toBeGreaterThan(0);
      expect(config.body.length).toBeGreaterThan(0);
      expect(config.ctaLabel?.length ?? 0).toBeGreaterThan(0);
      expect(config.defaultLink?.length ?? 0).toBeGreaterThan(0);
      expect(["high", "medium", "low"]).toContain(config.priority);
    }
  });

  it("keeps the accept & release CTA on the SERVICE_DELIVERED notification", () => {
    expect(NOTIFICATION_TEMPLATE_CONFIG.SERVICE_DELIVERED.ctaLabel).toBe("Accept & Release");
  });

  it("uses service order variables in the service email subjects", () => {
    expect(DEFAULT_EMAIL_TEMPLATES["SERVICE_REQUIREMENTS_REQUESTED"]?.defaultSubject).toContain(
      "{{orderNumber}}"
    );
    expect(DEFAULT_EMAIL_TEMPLATES["SERVICE_DELIVERED"]?.defaultSubject).toContain(
      "{{orderNumber}}"
    );
    expect(DEFAULT_EMAIL_TEMPLATES["SERVICE_RELEASED"]?.defaultSubject).toContain(
      "{{orderNumber}}"
    );
  });
});
