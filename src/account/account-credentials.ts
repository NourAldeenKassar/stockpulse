import type { CryptoService } from '../crypto/crypto.service.js';

/** The encrypted credential columns as they are stored on a trading account. */
export interface EncryptedAccountCredentials {
  apiKeyEncrypted: string;
  encryptionIv: string;
  encryptionTag: string;
  apiSecretEncrypted: string;
  secretEncryptionIv: string;
  secretEncryptionTag: string;
}

export interface Trading212Credentials {
  apiKey: string;
  apiSecret: string;
}

/**
 * The key and secret are stored across six columns with inconsistent naming.
 * Keeping that mapping in one place stops it being rewritten per caller.
 */
export function decryptAccountCredentials(
  crypto: CryptoService,
  account: EncryptedAccountCredentials,
): Trading212Credentials {
  return {
    apiKey: crypto.decryptField({
      ciphertext: account.apiKeyEncrypted,
      iv: account.encryptionIv,
      tag: account.encryptionTag,
    }),
    apiSecret: crypto.decryptField({
      ciphertext: account.apiSecretEncrypted,
      iv: account.secretEncryptionIv,
      tag: account.secretEncryptionTag,
    }),
  };
}
