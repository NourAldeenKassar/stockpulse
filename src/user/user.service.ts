import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CryptoService } from '../crypto/crypto.service.js';
import type { Prisma } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private crypto: CryptoService,
  ) {}

  /**
   * The last few characters of a key, so a user can tell which key is stored
   * without it ever being sent in full. Derived by decrypting server-side, so
   * nothing extra is persisted.
   */
  private hint(key: string | null): string | null {
    if (!key) return null;
    return key.length <= 4 ? '••••' : `••••${key.slice(-4)}`;
  }

  async getLlmSettings(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    const llmKey = this.crypto.tryDecryptField({
      ciphertext: user.llmGatewayKeyEncrypted,
      iv: user.llmGatewayKeyIv,
      tag: user.llmGatewayKeyTag,
    });
    const premiumKey = this.crypto.tryDecryptField({
      ciphertext: user.llmPremiumKeyEncrypted,
      iv: user.llmPremiumKeyIv,
      tag: user.llmPremiumKeyTag,
    });
    const finnhubKey = this.crypto.tryDecryptField({
      ciphertext: user.finnhubKeyEncrypted,
      iv: user.finnhubKeyIv,
      tag: user.finnhubKeyTag,
    });

    return {
      llmGatewayUrl: user.llmGatewayUrl || '',
      hasLlmKey: !!llmKey,
      llmKeyHint: this.hint(llmKey),
      llmPremiumGatewayUrl: user.llmPremiumGatewayUrl || '',
      hasPremiumKey: !!premiumKey,
      premiumKeyHint: this.hint(premiumKey),
      hasFinnhubKey: !!finnhubKey,
      finnhubKeyHint: this.hint(finnhubKey),
    };
  }

  async updateLlmSettings(
    userId: string,
    llmGatewayUrl?: string,
    llmGatewayKey?: string,
    finnhubKey?: string,
    llmPremiumGatewayUrl?: string,
    llmPremiumKey?: string,
  ) {
    const data: Prisma.UserUpdateInput = {};

    if (llmGatewayUrl !== undefined) {
      data.llmGatewayUrl = llmGatewayUrl || null;
    }

    if (llmPremiumGatewayUrl !== undefined) {
      data.llmPremiumGatewayUrl = llmPremiumGatewayUrl || null;
    }

    if (llmPremiumKey !== undefined) {
      const encrypted = llmPremiumKey
        ? this.crypto.encrypt(llmPremiumKey)
        : null;
      data.llmPremiumKeyEncrypted = encrypted?.ciphertext ?? null;
      data.llmPremiumKeyIv = encrypted?.iv ?? null;
      data.llmPremiumKeyTag = encrypted?.tag ?? null;
    }

    if (llmGatewayKey !== undefined) {
      const encrypted = llmGatewayKey
        ? this.crypto.encrypt(llmGatewayKey)
        : null;
      data.llmGatewayKeyEncrypted = encrypted?.ciphertext ?? null;
      data.llmGatewayKeyIv = encrypted?.iv ?? null;
      data.llmGatewayKeyTag = encrypted?.tag ?? null;
    }

    if (finnhubKey !== undefined) {
      const encrypted = finnhubKey ? this.crypto.encrypt(finnhubKey) : null;
      data.finnhubKeyEncrypted = encrypted?.ciphertext ?? null;
      data.finnhubKeyIv = encrypted?.iv ?? null;
      data.finnhubKeyTag = encrypted?.tag ?? null;
    }

    await this.prisma.user.update({
      where: { id: userId },
      data,
    });

    return this.getLlmSettings(userId);
  }

  /** Null when the user has not configured a Finnhub key. */
  async decryptFinnhubKey(userId: string): Promise<string | null> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        finnhubKeyEncrypted: true,
        finnhubKeyIv: true,
        finnhubKeyTag: true,
      },
    });

    return this.crypto.tryDecryptField({
      ciphertext: user.finnhubKeyEncrypted,
      iv: user.finnhubKeyIv,
      tag: user.finnhubKeyTag,
    });
  }

  /**
   * Credentials for a tier. 'premium' falls back to the standard gateway when
   * no separate one is configured, so per-stock analysis still works on a
   * single key — it just loses the separate cost tracking.
   */
  async decryptLlmKey(
    userId: string,
    tier: 'standard' | 'premium' = 'standard',
  ): Promise<{ url: string; key: string } | null> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    if (tier === 'premium') {
      const premiumKey = this.crypto.tryDecryptField({
        ciphertext: user.llmPremiumKeyEncrypted,
        iv: user.llmPremiumKeyIv,
        tag: user.llmPremiumKeyTag,
      });
      if (user.llmPremiumGatewayUrl && premiumKey) {
        return { url: user.llmPremiumGatewayUrl, key: premiumKey };
      }
    }

    const key = this.crypto.tryDecryptField({
      ciphertext: user.llmGatewayKeyEncrypted,
      iv: user.llmGatewayKeyIv,
      tag: user.llmGatewayKeyTag,
    });

    if (!user.llmGatewayUrl || !key) return null;

    return { url: user.llmGatewayUrl, key };
  }
}
