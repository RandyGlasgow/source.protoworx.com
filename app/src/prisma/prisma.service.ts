import { Injectable, Logger } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from 'generated/prisma/client';
import { attempt } from 'src/lib/tryCatch';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    });
    super({ adapter });
  }

  async onModuleInit() {
    const [error] = await attempt(async () => {
      return await this.$connect();
    });
    if (error) {
      Logger.error(error, 'PrismaService');
      throw error;
    } else {
      Logger.log('PrismaService connected to database\n\n');
    }
  }

  async onModuleDestroy() {
    const [error] = await attempt(async () => {
      return await this.$disconnect();
    });
    if (error) {
      Logger.error(error, 'PrismaService');
      throw error;
    } else {
      Logger.log('PrismaService disconnected from database\n\n');
    }
  }
}
