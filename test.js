// test-db.js
const { Client } = require('pg');

async function test() {
  const client = new Client({
    connectionString:
      'postgresql://postgres:KCGJune%402026@34.78.92.174:5432/erp',
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    await client.connect();
    console.log('CONNECTED');
    const res = await client.query('SELECT NOW()');
    console.log(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

test();