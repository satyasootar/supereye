import { corsair } from './lib/corsair.ts';

async function main() {
  console.log('Registering webhook...');
  const res = await corsair.webhooks.create({
    url: 'https://margarita-headboard-stowaway.ngrok-free.dev/api/webhooks/corsair',
    events: ['*']
  });
  console.log('Registered successfully!', res);
}

main().catch(console.error);
