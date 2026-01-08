import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ResendModule } from './resend/resend.module';

@Module({
  imports: [ConfigModule.forRoot(), PrismaModule, ResendModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
