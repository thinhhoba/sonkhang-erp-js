import { describe, expect, it } from "vitest";
import { safeInternalCallback } from "@/components/auth/safe-callback";

describe("safeInternalCallback", () => {
  it("preserves safe internal paths, query strings and hashes", () => {
    expect(safeInternalCallback("/delivery/trips?status=ready#today")).toBe(
      "/delivery/trips?status=ready#today"
    );
  });

  it.each([
    "https://evil.example/phish",
    "//evil.example/phish",
    "/\\evil.example",
    "/path\nwith-control",
  ])("rejects unsafe callback %s", (value) => {
    expect(safeInternalCallback(value)).toBe("/dashboard");
  });

  it("rejects auth loops", () => {
    expect(safeInternalCallback("/auth/signin?again=1")).toBe("/dashboard");
    expect(safeInternalCallback("/auth/signout")).toBe("/dashboard");
  });

  it("uses a caller-provided fallback for invalid input", () => {
    expect(safeInternalCallback(undefined, "/dashboard")).toBe("/dashboard");
  });
});
