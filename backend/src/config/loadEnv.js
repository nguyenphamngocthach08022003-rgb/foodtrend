// Nạp file backend/.env THEO ĐƯỜNG DẪN CỐ ĐỊNH (không phụ thuộc thư mục đang đứng
// khi chạy `npm run dev`).
//
// Chịu được các lỗi hay gặp trên Windows:
//  - File lưu dạng UTF-16 (PowerShell `echo > .env`, Notepad kiểu "Unicode")
//  - File có BOM của UTF-8
//  - Biến môi trường cùng tên đã có sẵn trong hệ thống (sẽ bị .env ghi đè)
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

const envPath = path.join(__dirname, '..', '..', '.env');
const found = fs.existsSync(envPath);

let encoding = null;
let loadedKeys = [];

function decode(buffer) {
  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
    encoding = 'UTF-16 LE';
    return buffer.slice(2).toString('utf16le');
  }
  if (buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff) {
    encoding = 'UTF-16 BE';
    const swapped = Buffer.from(buffer.slice(2));
    swapped.swap16();
    return swapped.toString('utf16le');
  }
  if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
    encoding = 'UTF-8 (có BOM)';
    return buffer.slice(3).toString('utf8');
  }
  encoding = 'UTF-8';
  return buffer.toString('utf8');
}

if (found) {
  const parsed = dotenv.parse(decode(fs.readFileSync(envPath)));
  loadedKeys = Object.keys(parsed);
  loadedKeys.forEach((key) => {
    process.env[key] = parsed[key]; // .env luôn thắng biến môi trường có sẵn
  });
}

module.exports = { envPath, found, encoding, loadedKeys };
