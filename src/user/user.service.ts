import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CryptoService } from '../crypto/crypto.service.js';

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
    const data: any = {};

    if (llmGatewayUrl !== undefined) {
      data.llmGatewayUrl = llmGatewayUrl || null;
    }

    if (llmGatewayKey !== undefined) {
      if (llmGatewayKey) {
        const encrypted = this.crypto.encrypt(llmGatewayKey);
        data.llmGatewayKeyEncrypted = encrypted.ciphertext;
        data.llmGatewayKeyIv = encrypted.iv;
        data.llmGatewayKeyTag = encrypted.tag;
      } else {
        data.llmGatewayKeyEncrypted = null;
        data.llmGatewayKeyIv = null;
        data.llmGatewayKeyTag = null;
      }
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

    if (
      !user.llmGatewayUrl ||
      !user.llmGatewayKeyEncrypted ||
      !user.llmGatewayKeyIv ||
      !user.llmGatewayKeyTag
    ) {
      return null;
    }

    const key = this.crypto.decrypt(
      user.llmGatewayKeyEncrypted,
      user.llmGatewayKeyIv,
      user.llmGatewayKeyTag,
    );

    return { url: user.llmGatewayUrl, key };
  }
}
