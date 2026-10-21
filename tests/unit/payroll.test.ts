// Mock @/lib/prisma: PayrollService imports it at top-level, and instantiating
// PrismaClient in a unit test env (no DATABASE_URL / generated client) would fail.
vi.mock('@/lib/prisma', () => ({ default: {} }));

import { describe, it, expect, vi } from 'vitest';
import { PayrollService } from '@/services/payroll.service';

describe('PayrollService.calculateTripSalary', () => {
  it('30.000 + (2 diem * 5.000) + (100kg * 250) = 65.000', () => {
    expect(PayrollService.calculateTripSalary(30000, 5000, 250, 2, 100)).toBe(65000);
  });

  it('0 diem + 0kg = 30.000 (chi phi chuyen)', () => {
    expect(PayrollService.calculateTripSalary(30000, 5000, 250, 0, 0)).toBe(30000);
  });

  it('so lieu le: lam tron Math.round', () => {
    // 250.4 * 1kg -> 0.4 le, tong 30000 + 5000*1 + 250.4 = 35250.4 -> round 35250
    expect(PayrollService.calculateTripSalary(30000, 5000, 250.4, 1, 1)).toBe(35250);
    // 250.5 -> 35250.5 -> round 35251 (Math.round rounds half up)
    expect(PayrollService.calculateTripSalary(30000, 5000, 250.5, 1, 1)).toBe(35251);
  });

  // GHI CHU: diem FAILED khong duoc dua vao stops/kg.
  // Logic nay nam o caller completeStop/settleAndCloseTrip, chi tinh SUCCESS/PARTIAL.
  // Ham calculateTripSalary chi nhan tong so da loc san, khong tu loai FAILED.
});
