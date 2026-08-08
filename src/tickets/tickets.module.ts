import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';

@Module({
  imports: [
    PrismaModule,
    AiModule,
  ],
  controllers: [TicketsController],
  providers: [TicketsService],
})
export class TicketsModule {}