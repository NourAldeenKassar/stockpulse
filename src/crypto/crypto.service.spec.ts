import { CryptoService } from './crypto.service.js';

const KEY = 'a'.repeat(64);

describe('CryptoService', () => {
  let original: string | undefined;

  beforeAll(() => {
    original = process.env.ENCRYPTION_KEY;
    process.env.ENCRYPTION_KEY = KEY;
  });

  afterAll(() => {
    process.env.ENCRYPTION_KEY = original;
  });

  it('round-trips a value', () => {
    const crypto = new CryptoService();
    const { ciphertext, iv, tag } = crypto.encrypt('super-secret-api-key');

    expect(ciphertext).not.toContain('super-secret-api-key');
    expect(crypto.decrypt(ciphertext, iv, tag)).toBe('super-secret-api-key');
  });

  it('produces a different ciphertext each time', () => {
    const crypto = new CryptoService();
    const a = crypto.encrypt('same-input');
    const b = crypto.encrypt('same-input');

    expect(a.ciphertext).not.toBe(b.ciphertext);
    expect(a.iv).not.toBe(b.iv);
  });

  it('rejects a tampered ciphertext', () => {
    const crypto = new CryptoService();
    const { ciphertext, iv, tag } = crypto.encrypt('super-secret-api-key');
    const tampered = Buffer.from('different-value').toString('base64');

    expect(() => crypto.decrypt(tampered, iv, tag)).toThrow();
    expect(() => crypto.decrypt(ciphertext, iv, 'f'.repeat(32))).toThrow();
  });

  it('refuses to start without a valid key', () => {
    process.env.ENCRYPTION_KEY = 'too-short';
    expect(() => new CryptoService()).toThrow(/64-character hex/);
    process.env.ENCRYPTION_KEY = KEY;
  });
});
