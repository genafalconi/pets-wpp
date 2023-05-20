import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config({ path: './env/dev.env' });

export default async function requestOrder(
  endpoint: string,
  params: string,
  data: any,
  token: string,
) {
  try {
    const messageStatus = await axios.put(
      `${process.env.ORDERS_URL}/${endpoint}/${params ? params : ''}`,
      data,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    console.log(messageStatus);
  } catch (error) {
    console.log(error);
  }
}
