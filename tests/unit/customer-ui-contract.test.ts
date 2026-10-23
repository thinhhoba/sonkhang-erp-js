import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("customer role-aware UI contract", () => {
  it("keeps the title independent from the admin-only create control", () => {
    const source = readFileSync(resolve(process.cwd(), "src/app/(admin)/sales/customers/page.tsx"), "utf8");
    expect(source).toMatch(/<Col>\s*<Title level=\{3\}/); expect(source).toMatch(/\{canManage \? <Col>\s*<Button/);
  });
});
