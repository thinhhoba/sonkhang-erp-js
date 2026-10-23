import { describe, expect, it } from "vitest";

const nextConfig = require("../../next.config.js");

describe("sales dedicated-route contract", () => {
  it("keeps physical /sales/orders routes out of the legacy rewrite layer", async () => {
    const rewrites = await nextConfig.rewrites();
    expect(rewrites.some((entry: { source: string }) => entry.source === "/sales/orders" || entry.source.startsWith("/sales/orders/"))).toBe(false);
  });
});
