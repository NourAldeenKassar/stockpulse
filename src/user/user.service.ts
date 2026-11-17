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

  async getLlmSettings(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        llmGatewayUrl: true,
        llmGatewayKeyEncrypted: true,
      },
    });

    return {
      llmGatewayUrl: user.llmGatewayUrl || '',
      hasLlmKey: !!user.llmGatewayKeyEncrypted,
    };
  }

  async updateLlmSettings(
    userId: string,
    llmGatewayUrl?: string,
    llmGatewayKey?: string,
  ) {
    const data: Prisma.UserUpdateInput = {};

    if (llmGatewayUrl !== undefined) {
      data.llmGatewayUrl = llmGatewayUrl || null;
    }

    if (llmGatewayKey !== undefined) {
      const encrypted = llmGatewayKey
        ? this.crypto.encrypt(llmGatewayKey)
        : null;
      data.llmGatewayKeyEncrypted = encrypted?.ciphertext ?? null;
      data.llmGatewayKeyIv = encrypted?.iv ?? null;
      data.llmGatewayKeyTag = encrypted?.tag ?? null;
    }

    await this.prisma.user.update({
      where: { id: userId },
      data,
    });

    return this.getLlmSettings(userId);
  }

  async decryptLlmKey(
    userId: string,
  ): Promise<{ url: string; key: string } | null> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    const key = this.crypto.tryDecryptField({
      ciphertext: user.llmGatewayKeyEncrypted,
      iv: user.llmGatewayKeyIv,
      tag: user.llmGatewayKeyTag,
    });

    if (!user.llmGatewayUrl || !key) return null;

    return { url: user.llmGatewayUrl, key };
  }
}
