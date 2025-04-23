import { Module } from '@nestjs/common';
import { DeliverablesController } from './deliverables.controller';
import { DeliverablesService } from './deliverables.service';
import { PrismaService } from '@/prisma.service';

@Module({
  controllers: [DeliverablesController],
  providers: [DeliverablesService, PrismaService],
  exports: [DeliverablesService],
})
export class DeliverablesModule {}
