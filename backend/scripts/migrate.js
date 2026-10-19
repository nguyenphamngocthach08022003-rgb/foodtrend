/* Chạy migrations/schema.sql — tạo lại TOÀN BỘ schema "public" từ đầu.
   An toàn để chạy lại nhiều lần: nó tự DROP SCHEMA public CASCADE trước
   khi tạo mới, nên không bao giờ bị xung đột với bảng/view cũ. */
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

  const sql = fs.readFileSync(path.join(__dirname, '..', 'migrations', 'schema.sql'), 'utf8');
  console.log('Đang tạo lại schema (schema.sql) ...');
  await client.query(sql);
  console.log('  -> OK');

  await client.end();
  console.log('Migration hoàn tất.');
}

run().catch((err) => {
  console.error('Migration thất bại:', err);
  process.exit(1);
});
