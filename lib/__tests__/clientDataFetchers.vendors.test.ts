import { beforeEach, describe, expect, it, vi, afterEach } from "vitest";
import { getVendorsClient } from "@/lib/data/clientDataFetchers";

const fetchMock = vi.fn();

describe("getVendorsClient", () => {
    beforeEach(() => {
        fetchMock.mockReset();
        vi.stubGlobal("fetch", fetchMock);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("defaults to public approved+pending vendor feed without forcing APPROVED-only status", async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({ success: true, vendors: [{ id: "vendor-1" }] }),
        });

        const vendors = await getVendorsClient();

        expect(fetchMock).toHaveBeenCalledWith("/api/vendors?limit=20");
        expect(vendors).toEqual([{ id: "vendor-1" }]);
    });

    it("allows explicit status override when needed", async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({ success: true, vendors: [] }),
        });

        await getVendorsClient(50, "APPROVED");

        expect(fetchMock).toHaveBeenCalledWith("/api/vendors?limit=50&status=APPROVED");
    });
});
