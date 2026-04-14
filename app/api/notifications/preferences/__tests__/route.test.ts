import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET, PUT } from "@/app/api/notifications/preferences/route";

const {
    mockGetCurrentUser,
    mockRateLimitByUser,
    mockGetRateLimitResponse,
    mockPrisma,
} = vi.hoisted(() => ({
    mockGetCurrentUser: vi.fn(),
    mockRateLimitByUser: vi.fn(),
    mockGetRateLimitResponse: vi.fn(),
    mockPrisma: {
        notificationPreference: {
            findUnique: vi.fn(),
            create: vi.fn(),
            upsert: vi.fn(),
        },
    },
}));

vi.mock("@/lib/utils/auth", () => ({
    getCurrentUser: () => mockGetCurrentUser(),
}));

vi.mock("@/lib/middleware/rate-limit", () => ({
    rateLimitByUser: (...args: unknown[]) => mockRateLimitByUser(...args),
    getRateLimitResponse: (...args: unknown[]) => mockGetRateLimitResponse(...args),
}));

vi.mock("@/lib/db/prisma", () => ({
    prisma: mockPrisma,
}));

describe("notification preferences persistence contract", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGetCurrentUser.mockResolvedValue({ userId: "user-1", role: "BUYER" });
        mockRateLimitByUser.mockResolvedValue({ success: true });
    });

    it("creates defaults when preferences are missing", async () => {
        mockPrisma.notificationPreference.findUnique.mockResolvedValue(null);
        mockPrisma.notificationPreference.create.mockResolvedValue({
            userId: "user-1",
            orderUpdates: true,
            promotions: true,
            vendorMessages: true,
            emailNotifications: true,
            smsNotifications: false,
            pushNotifications: true,
        });

        const res = await GET(new NextRequest("http://localhost/api/notifications/preferences"));
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.success).toBe(true);
        expect(json.editable.orderUpdates).toBe(true);
        expect(json.preferences.emailNotifications).toBe(true);
    });

    it("enforces critical email channel regardless of editable input", async () => {
        mockPrisma.notificationPreference.upsert.mockResolvedValue({
            userId: "user-1",
            orderUpdates: false,
            promotions: false,
            vendorMessages: true,
            emailNotifications: true,
            smsNotifications: false,
            pushNotifications: false,
        });

        const res = await PUT(
            new NextRequest("http://localhost/api/notifications/preferences", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    editable: {
                        orderUpdates: false,
                        promotions: false,
                        vendorMessages: true,
                        emailNotifications: false,
                        pushNotifications: false,
                    },
                }),
            })
        );

        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.success).toBe(true);
        expect(json.preferences.emailNotifications).toBe(true);
        expect(json.editable.pushNotifications).toBe(false);
    });
});
