import { describe, expect, it } from "vitest";
import { parsePositiveInt, validateEmployeeInput } from "@/lib/settings-validation";

describe("settings employee validation", () => {
  it("normalizes a valid whitelist employee", () => {
    expect(validateEmployeeInput({
      code: " SK-001 ", fullName: " Nguyễn Văn A ", email: " ADMIN@SONKHANG.VN ", phone: "0900000000", role: "ADMIN", isActive: true,
    }, { create: true })).toMatchObject({ code: "SK-001", fullName: "Nguyễn Văn A", email: "admin@sonkhang.vn", role: "ADMIN", isActive: true });
  });

  it("fails closed for an unsupported role and unsafe avatar URL", () => {
    expect(() => validateEmployeeInput({ role: "SUPERUSER" })).toThrow("Vai trò không hợp lệ");
    expect(() => validateEmployeeInput({ role: "   " })).toThrow("Vai trò là bắt buộc");
    expect(() => validateEmployeeInput({ code: "" })).toThrow("Mã nhân viên là bắt buộc");
    expect(() => validateEmployeeInput({ email: " " })).toThrow("Email là bắt buộc");
    expect(() => validateEmployeeInput({ avatarUrl: "http://example.com/avatar.png" })).toThrow("HTTPS");
  });

  it("requires the fields that make an OAuth whitelist entry usable", () => {
    expect(() => validateEmployeeInput({ fullName: "A" }, { create: true })).toThrow("Mã nhân viên là bắt buộc");
  });

  it("bounds pagination to a safe positive integer", () => {
    expect(parsePositiveInt("-2", 20, 100)).toBe(20);
    expect(parsePositiveInt("300", 20, 100)).toBe(100);
    expect(parsePositiveInt("25", 20, 100)).toBe(25);
  });
});
