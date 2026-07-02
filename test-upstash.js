const { createClient } = require('redis');

async function test() {
  const client = createClient({
    socket: {
      host: 'epic-monkfish-36119.upstash.io',
      port: 36119,
      tls: true
    },
    password: 'AY0XAAIgcDFjNGFhMTA4MWFmOGU0MzA2YjJlMWQ5MWJlOTEzOTg0Nw'
  });
  
  client.on('error', err => console.error('Redis Client Error', err));
  
  await client.connect();
  console.log('Connected to Upstash successfully!');
  await client.disconnect();
}

test();
