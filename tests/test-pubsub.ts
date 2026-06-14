import { createCorsair } from 'corsair';
import { gmail } from '@corsair-dev/gmail';
import { processWebhook } from 'corsair';
import { decodePubSubMessage } from '@corsair-dev/gmail';

const corsair = createCorsair({
  plugins: [gmail()],
  database: {} as any,
  kek: 'test-key-000000000000000000000000',
  multiTenancy: true,
});

async function run() {
  const data = Buffer.from(JSON.stringify({
    emailAddress: 'test@example.com',
    historyId: 12345
  })).toString('base64');

  const pubSubPayload = {
    message: {
      data,
      messageId: '123'
    },
    subscription: 'projects/myproject/subscriptions/mysub'
  };

  console.log("Decoded:", decodePubSubMessage(pubSubPayload as any));

  const result = await processWebhook(corsair, {}, pubSubPayload);
  console.log("Process Webhook Result:", result);
}

run().catch(console.error);
