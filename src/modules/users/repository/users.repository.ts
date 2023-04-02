import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { User } from '@prisma/client';
import { AuthDto } from '../../auth/dto/auth.dto';
import { randomUUID } from 'crypto';
import { add } from 'date-fns';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createUser(
    dto: AuthDto,
    passwordHash: string,
    confirmationCode: string,
  ): Promise<User> {
    return this.prisma.user.create({
      data: {
        id: randomUUID(),
        email: dto.email,
        createdAt: new Date(),
        login: dto.login,
        passwordHash: passwordHash,
        emailConfirmation: {
          create: {
            id: randomUUID(),
            isConfirmed: false,
            confirmationCode: confirmationCode,
            expirationDate: add(new Date(), { hours: 1 }),
          },
        },
        passwordRecovery: {
          create: {
            id: randomUUID(),
            email: dto.email,
            recoveryCode: randomUUID(),
          },
        },
      },
    });
  }

  async findUserByEmail(email: string): Promise<User> {
    return this.prisma.user.findUnique({
      where: {
        email: email,
      },
    });
  }

  async findUserByLogin(login: string): Promise<User> {
    return this.prisma.user.findUnique({
      where: {
        login: login,
      },
    });
  }
}
