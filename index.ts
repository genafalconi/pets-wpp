import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as express from 'express';
import * as functions from 'firebase-functions';
import { AppModule } from './src/app.module';
import { BotService } from 'src/bot/bot.service';

const expressServer = express();
async function bootstrap() {
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressServer),
  );
  app.enableCors();
  await app.init();
}
export const whatsapp = functions.https.onRequest(async (request, response) => {
  await bootstrap();
  expressServer(request, response);
});

// Export the botService for usage in other functions
export { BotService };