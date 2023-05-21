import { Module } from '@nestjs/common';
import { BotService } from './bot.service';
import { BotController } from './bot.controller';

@Module({
  controllers: [BotController],
  providers: [BotService],
  exports: [BotService], // Export the BotService to be used in other modules
})
export class BotModule {}
