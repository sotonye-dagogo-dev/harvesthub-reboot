import { beforeEach, describe, expect, it, vi } from "vitest";

let idCounter = 0;
let users: Array<Record<string, unknown>> = [];

const mockUserDb = {
    create: vi.fn((data: Record<string, unknown>) => {
        const id = `user-${++idCounter}`;
        const now = new Date();
        const user = { id, ...data, createdAt: now, updatedAt: now };
        users.push(user);
        return user;
    }),
    findByEmail: vi.fn((email: string) => {
        return users.find((user) => String(user.email).toLowerCase() === email.toLowerCase());
    }),
    findById: vi.fn((id: string) => {
        return users.find((user) => user.id === id);
    }),
    update: vi.fn((id: string, data: Record<string, unknown>) => {
        const index = users.findIndex((user) => user.id === id);
        if (index === -1) return null;
        const updated = { ...users[index], ...data, updatedAt: new Date() };
        users[index] = updated;
        return updated;
    }),
    delete: vi.fn((id: string) => {
        const previousLength = users.length;
        users = users.filter((user) => user.id !== id);
        return users.length < previousLength;
    }),
};

vi.mock("../prismaAdapter", () => ({
    default: {
        userDb: mockUserDb,
        buyerDb: {},
        vendorDb: {},
        productDb: {},
        cartDb: {},
        orderDb: {},
        walletDb: {},
        transactionDb: {},
        reviewDb: {},
        bannerDb: {},
        adApplicationDb: {},
        adRateConfigDb: {},
        addressDb: {},
    },
}));

describe("Database adapter exports (lib/data/database.ts)", () => {
    let db: typeof import("../database");

    beforeEach(async () => {
        users = [];
        idCounter = 0;
        vi.clearAllMocks();
        vi.resetModules();
        db = await import("../database");
    });

    it("should create and find a user by email through adapter export", async () => {
        const email = "tester@example.com";
        const user = await db.userDb.create({
            email,
            firstName: "Test",
            lastName: "User",
            phoneNumber: "08012345678",
            role: "BUYER",
            profilePicture: null,
            emailVerified: false,
            isActive: true,
            status: "ACTIVE",
        }, "password123");

        expect(user).toHaveProperty("id");
        expect(user.email).toBe(email);

        const found = await db.userDb.findByEmail(email);
        expect(found).toBeDefined();
        expect(found?.id).toBe(user.id);
    });

    it("should update and delete a user through adapter export", async () => {
        const user = await db.userDb.create({
            email: "delete-me@example.com",
            firstName: "Delete",
            lastName: "Me",
            phoneNumber: "08012345679",
            role: "BUYER",
            profilePicture: null,
            emailVerified: false,
            isActive: true,
            status: "ACTIVE",
        }, "password123");

        const updated = await db.userDb.update(user.id, { firstName: "Deleted" });
        expect(updated).not.toBeNull();
        expect(updated?.firstName).toBe("Deleted");

        const removed = await db.userDb.delete(user.id);
        expect(removed).toBe(true);
        expect(await db.userDb.findById(user.id)).toBeUndefined();
    });
});
