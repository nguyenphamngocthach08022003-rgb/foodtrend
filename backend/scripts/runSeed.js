require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function run() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'foodtrend',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });
  await client.connect();

  const sql = fs.readFileSync(path.join(__dirname, '..', 'migrations', 'seed.sql'), 'utf8');
  console.log('Seeding database...');
  await client.query(sql);
  console.log('Seed hoàn tất.');

  await client.end();
}

run().catch((err) => {
  console.error('Seed thất bại:', err);
  process.exit(1);
});
