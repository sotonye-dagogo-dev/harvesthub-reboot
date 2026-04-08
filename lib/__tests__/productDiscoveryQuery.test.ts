import { describe, expect, it } from "vitest";
import {
    DEFAULT_PRODUCT_SORT,
    buildProductDiscoveryQueryString,
    parseProductDiscoveryQueryState,
} from "@/lib/config/productDiscovery";

describe("product discovery query contract", () => {
    it("parses category slugs and sort values into canonical state", () => {
        const state = parseProductDiscoveryQueryState({
            category: "electronics,fashion",
            sort: "trending",
            search: "rice",
        });

        expect(state.categories).toEqual(["ELECTRONICS", "FASHION"]);
        expect(state.sort).toBe("trending");
        expect(state.search).toBe("rice");
    });

    it("accepts canonical category values and falls back to default sort", () => {
        const state = parseProductDiscoveryQueryState({
            category: "GROCERY_FOOD",
            sort: "unsupported",
        });

        expect(state.categories).toEqual(["GROCERY_FOOD"]);
        expect(state.sort).toBe(DEFAULT_PRODUCT_SORT);
    });

    it("serializes canonical state to URL params using slugs", () => {
        const query = buildProductDiscoveryQueryString({
            categories: ["ELECTRONICS", "FASHION"],
            sort: "price-high",
            search: "speaker",
            minPrice: 1000,
        });

        expect(query).toContain("category=electronics%2Cfashion");
        expect(query).toContain("sort=price-high");
        expect(query).toContain("search=speaker");
        expect(query).toContain("minPrice=1000");
    });
});
