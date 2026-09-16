import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  private readonly jwtSecret: string;
  private readonly jwtRefreshSecret: string;

  constructor(private prisma: PrismaService) {
    const secret = process.env.JWT_SECRET;
    const refreshSecret = process.env.JWT_REFRESH_SECRET;
    if (!secret || !refreshSecret) {
      throw new Error(
        'JWT_SECRET and JWT_REFRESH_SECRET must be set in environment',
      );
    }
    this.jwtSecret = secret;
    this.jwtRefreshSecret = refreshSecret;
  }

  async register(email: string, password: string) {
    if (!email || !email.includes('@')) {
      throw new BadRequestException('Valid email is required');
    }
    if (!password || password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await this.prisma.user.create({
      data: { email, passwordHash },
    });

    return this.generateTokens(user.id, user.email);
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user.id, user.email);
  }

  async refresh(refreshToken: string) {
    try {
      const payload = jwt.verify(refreshToken, this.jwtRefreshSecret) as {
        sub: string;
        email: string;
        type: string;
      };

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return this.generateTokens(user.id, user.email);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  verifyAccessToken(token: string): { id: string; email: string } {
    try {
      const payload = jwt.verify(token, this.jwtSecret) as {
        sub: string;
        email: string;
        type: string;
      };

      if (payload.type !== 'access') {
        throw new UnauthorizedException('Invalid token type');
      }

      return { id: payload.sub, email: payload.email };
    } catch {
      throw new UnauthorizedException('Invalid access token');
    }
  }

  private generateTokens(userId: string, email: string) {
    const accessToken = jwt.sign(
      { sub: userId, email, type: 'access' },
      this.jwtSecret,
      { expiresIn: '15m' },
    );

    const refreshToken = jwt.sign(
      { sub: userId, email, type: 'refresh' },
      this.jwtRefreshSecret,
      { expiresIn: '7d' },
    );

    return { accessToken, refreshToken };
  }
}
