import { Module } from '@nestjs/common';
import { BotModule } from './bot/bot.module';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `env/${process.env.NODE_ENV || 'dev'}.env`,
    }),
    MongooseModule.forRootAsync({
      useFactory: async () => ({
        uri: process.env.MONGO_DB,
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 30,
        retryAttempts: 2,
        retryDelay: 1000,
      }),
    }),
    BotModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
