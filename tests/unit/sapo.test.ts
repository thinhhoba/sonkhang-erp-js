// Mock @/lib/prisma: SapoService imports it at top-level, and instantiating
// PrismaClient in a unit test env (no DATABASE_URL / generated client) would fail.
vi.mock('@/lib/prisma', () => ({ default: {} }));

import crypto from 'crypto';
import { describe, it, expect, vi } from 'vitest';
import { SapoService } from '@/services/sapo.service';

const SECRET = 'test-webhook-secret';

function sign(rawBody: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest('base64');
}

describe('SapoService.verifyWebhookSignature', () => {
  it('chu ky chuan -> true', () => {
    const rawBody = '{"id":123,"order_number":"SON10567"}';
    const header = sign(rawBody, SECRET);
    expect(SapoService.verifyWebhookSignature(rawBody, header, SECRET)).toBe(true);
  });

  it('header sai noi dung -> false', () => {
    const rawBody = '{"id":123}';
    const wrong = sign('{"id":999}', SECRET);
    expect(SapoService.verifyWebhookSignature(rawBody, wrong, SECRET)).toBe(false);
  });

  it('header lech do dai -> false va KHONG throw (regression timingSafeEqual)', () => {
    const rawBody = '{"id":123}';
    expect(() =>
      SapoService.verifyWebhookSignature(rawBody, 'aaaa', SECRET)
    ).not.toThrow();
    expect(SapoService.verifyWebhookSignature(rawBody, 'aaaa', SECRET)).toBe(false);
  });

  it('header null / secret rong -> false', () => {
    expect(SapoService.verifyWebhookSignature('body', null, SECRET)).toBe(false);
    expect(SapoService.verifyWebhookSignature('body', sign('body', SECRET), '')).toBe(false);
  });
});
