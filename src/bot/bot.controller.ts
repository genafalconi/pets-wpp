import { Body, Controller, Inject, Post, UseGuards } from '@nestjs/common';
import { MessageDataDto } from 'src/dto/message.dto';
import { BotService } from './bot.service';
import { FirebaseAuthGuard } from 'src/firebase/firebase.auth.guard';
import { OrdersMsgDto } from 'src/dto/ordersMsg.dto';

@UseGuards(FirebaseAuthGuard)
@Controller('bot')
export class BotController {
  constructor(
    @Inject(BotService)
    private readonly botService: BotService,
  ) {}

  @Post('/send_order')
  async sendMessageOrder(@Body() orderData: MessageDataDto) {
    return await this.botService.sendMessageOrder(orderData);
  }

  @Post('/coordination')
  async sendOrderToDeliver(@Body() ordersToDeliver: OrdersMsgDto) {
    return await this.botService.sendOffersToDeliver(ordersToDeliver);
  }
}
