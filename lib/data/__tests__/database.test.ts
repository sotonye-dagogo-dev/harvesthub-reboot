import { describe, it, expect, vi, beforeEach } from "vitest";

// Ensure we use the mock adapters by forcing USE_PRISMA to false before importing
vi.stubEnv("USE_PRISMA", "false");

describe("Mock database layer (lib/data/database.ts)", () => {
    let db: typeof import("../database");

    beforeEach(async () => {
        // Use dynamic import to pick up the env var in module scope
        db = await import("../database");
    });

    it("should create and find a user by email", () => {
        const email = "tester@example.com";
        const user = db.userDb.create(
            {
                email,
                firstName: "Test",
                lastName: "User",
                phoneNumber: "08012345678",
                role: "BUYER",
                profilePicture: null,
                emailVerified: false,
                isActive: true,
                status: "ACTIVE",
            },
            "password123"
        );

        expect(user).toHaveProperty("id");
        expect(user.email).toBe(email);

        const found = db.userDb.findByEmail(email);
        expect(found).toBeDefined();
        expect(found?.id).toBe(user.id);
    });

    it("should update and delete a user", () => {
        const user = db.userDb.create(
            {
                email: "delete-me@example.com",
                firstName: "Delete",
                lastName: "Me",
                phoneNumber: "08012345679",
                role: "BUYER",
                profilePicture: null,
                emailVerified: false,
                isActive: true,
                status: "ACTIVE",
            },
            "password123"
        );

        const updated = db.userDb.update(user.id, { firstName: "Deleted" });
        expect(updated).not.toBeNull();
        expect(updated?.firstName).toBe("Deleted");

        const removed = db.userDb.delete(user.id);
        expect(removed).toBe(true);
        expect(db.userDb.findById(user.id)).toBeUndefined();
    });
});
