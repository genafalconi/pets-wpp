import { Injectable } from '@nestjs/common';
import { Client, RemoteAuth } from 'whatsapp-web.js';
import * as qrcode from 'qrcode-terminal';
import { MessageDataDto } from 'src/dto/message.dto';
import { DeliveryDto } from 'src/dto/delivery.dto';
import { OrdersMsgDto } from 'src/dto/ordersMsg.dto';
import { firebaseClientAuth } from 'src/firebase/firebase.app';
import { signInWithEmailAndPassword } from 'firebase/auth';
import requestOrder from 'src/helpers/requestOrder';
import mongoose from 'mongoose';
import { MongoStore } from 'wwebjs-mongo';

@Injectable()
export class BotService {
  private client: Client;

  constructor() {
    this.initializateBot();
  }

  async initializateBot(): Promise<void> {
    try {
      await mongoose.connect(process.env.MONGO_DB);

      const store = new MongoStore({ mongoose });
      this.client = new Client({
        authStrategy: new RemoteAuth({
          store,
          backupSyncIntervalMs: 300000,
        }),
      });

      this.client.on('remote_session_saved', () => {
        console.log('guardado');
      });

      this.client.on('qr', (qr) => {
        qrcode.generate(qr, { small: true });
      });

      this.client.on('authenticated', () => {
        console.log('Authenticated');
      });

      this.client.on('ready', () => {
        console.log('Client is ready!');
      });

      this.client.on('message', (msg) => {
        this.handleMessages(msg);
      });

      this.client.initialize();
    } catch (error) {
      console.error('Error connecting to the database:', error);
    }
  }

  async sendMessageOrder(orderData: MessageDataDto) {
    const number = this.formatPhoneNumber(orderData.phone);
    const text =
      `*Tu pedido de PetsZone fue realizado con exito!*\n` +
      `*Nro:* ${orderData._id} \n` +
      `*Productos:* \n${orderData.products.map((elem: any) => {
        return `${elem.quantity}x ${elem.product} \n`;
      })}` +
      `*Total:* $${orderData.total_cart}\n` +
      // `*Forma de pago:* ${orderData.payment_type}\n` +
      `*Va a ser entregado el dia:* ${orderData.date} de 14a 20hs\n` +
      // `*En la direccion:* ${orderData.address}\n` +
      `*Para Confirmar: 1 / Cancelar: 2*`;

    const message = await this.client.sendMessage(number, text);

    return await message.getInfo();
  }

  async handleMessages(msg: any) {
    const token = await this.getToken();
    const delivered = '✅';
    if (msg.fromMe) return;
    if (msg.body === delivered) {
      const quotedMsg = await msg.getQuotedMessage();
      if (quotedMsg) {
        const regex = /Nro:\s(\w+)/;
        const match = regex.exec(quotedMsg.body);
        const nro = match ? match[1] : null;
        if (nro) {
          await requestOrder('delivered', nro, null, token);
        }
      }
    }
    if (msg.body === '1') {
      const reply = await msg.reply(`Tu pedido fue confirmado con exito!`);
      console.log(reply);
    }
    if (msg.body === '2') {
      const quotedMsg = await msg.getQuotedMessage();
      if (quotedMsg) {
        const regex = /\*Nro:\*\s+(\w+)/;
        const match = regex.exec(quotedMsg.body);
        const nro = match ? match[1] : null;
        await msg.reply('Tu pedido fue cancelado con exito!');
        await requestOrder('cancel', nro, null, token);
      } else {
        await msg.reply(
          'Debes seleccionar el pedido y enviar un 2 para cancelar el pedido',
        );
      }
    }
  }

  async sendDeliverInProgress(deliverys: Array<DeliveryDto>) {
    const statusMessages = [];
    for (const deliver of deliverys) {
      const number = this.formatPhoneNumber(deliver.phone);
      const text =
        `Hola ${deliver.name}\n` +
        `Tu pedido\n` +
        `Nro: ${deliver.orderId}` +
        ` llegara pronto`;
      const message = await this.client.sendMessage(number, text);
      statusMessages.push(await message.getInfo());
    }
    return statusMessages;
  }

  async sendOffersToDeliver(ordersToDeliver: OrdersMsgDto) {
    const number = this.formatPhoneNumber(process.env.DELIVERY_PHONE);
    const products = `*Productos:* ${ordersToDeliver.products.map((elem) => {
      return `${elem}`;
    })}`;
    await this.client.sendMessage(number, products);

    for (const order of ordersToDeliver.orders) {
      const orderText =
        `Nro: ${order.order_id}\n` +
        `Cliente: ${order.name}\n` +
        `Productos: ${order.products}\n` +
        `Total: ${order.total}\n` +
        `Direccion: ${order.direction}`;
      await this.client.sendMessage(number, orderText);
    }

    console.log(ordersToDeliver);
  }

  getClient(): Client {
    return this.client;
  }

  formatPhoneNumber(phoneNumber: string) {
    const newNumber = '54911' + phoneNumber?.slice(-8);
    // Getting chatId from the number
    // we have to delete "+" from the beginning and add "@c.us" at the end of the number.
    const chatId = newNumber + '@c.us';
    return chatId;
  }

  async getToken() {
    const email = process.env.EMAIL;
    const password = process.env.PASSWORD;
    try {
      const userCredential = await signInWithEmailAndPassword(
        firebaseClientAuth,
        email,
        password,
      );
      // Get the ID token for the signed-in user
      const idToken = await userCredential.user.getIdToken();

      return idToken;
    } catch (error) {
      console.error(error);
      return error;
    }
  }
}
