// Nạp file backend/.env THEO ĐƯỜNG DẪN CỐ ĐỊNH (không phụ thuộc thư mục đang đứng
// khi chạy `npm run dev`), rồi cho biết có tìm thấy file hay không.
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

const envPath = path.join(__dirname, '..', '..', '.env');
const found = fs.existsSync(envPath);

if (found) dotenv.config({ path: envPath });

module.exports = { envPath, found };
