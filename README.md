# FoodTrend — Ăn vặt hot trend online

Dự án web bán đồ ăn vặt "hot trend" gồm 2 phần tách biệt:
- **backend/** — Node.js + Express + PostgreSQL, API tách rõ `/api/*` (khách hàng) và `/api/admin/*` (quản trị, luôn yêu cầu đăng nhập + role ADMIN).
- **frontend/** — React (Vite), giao diện khách hàng theo phong cách Yumbifood nhưng tông đỏ, và một khu vực quản trị riêng (`/admin`) với theme tối.

Toàn bộ đã được cài đặt, chạy thử và kiểm thử thật (không phải code chưa test) trên PostgreSQL 16 + Node 22 trong lúc xây dựng — xem mục "Đã kiểm thử" bên dưới.

---

## 1. Yêu cầu môi trường

- Node.js ≥ 18
- PostgreSQL ≥ 14 (đã test trên PostgreSQL 16)
- npm

## 2. Cài đặt Database

⚠️ **File `schema.sql` sẽ XOÁ SẠCH schema "public"** của database bạn trỏ tới trước khi tạo lại từ đầu (để đảm bảo không bị xung đột với bất kỳ bảng/view cũ nào). Dùng một database riêng cho dự án này, đừng trỏ vào database đang có dữ liệu khác cần giữ.

```bash
# Tạo database (nếu chưa có)
createdb foodtrend

cd backend
cp .env.example .env      # sửa lại DB_HOST/DB_USER/DB_PASSWORD/DB_NAME cho khớp máy bạn
npm install
npm run migrate            # chạy migrations/schema.sql — tạo toàn bộ bảng/view từ đầu
npm run seed                # chạy migrations/seed.sql — nạp dữ liệu mẫu
```

> `schema.sql` là **một file duy nhất**, gộp đầy đủ toàn bộ bảng bạn thiết kế ban đầu + các bảng/view bổ sung mà tính năng yêu cầu (xem mục 5), đã test lại từ đầu trên database sạch. `seed.sql` là dữ liệu mẫu (giữ nguyên nội dung bạn cung cấp ban đầu).

## 3. Chạy Backend

```bash
cd backend
npm run dev      # http://localhost:4000 (nodemon)
# hoặc: npm start
```

Kiểm tra: `curl http://localhost:4000/health`

## 4. Chạy Frontend

```bash
cd frontend
npm install
npm run dev       # http://localhost:5173
```

Vite đã cấu hình proxy `/api` và `/uploads` → `http://localhost:4000`, nên **không cần CORS thủ công** khi chạy dev.

## 5. Tài khoản demo (từ seed data)

| Vai trò  | Số điện thoại | Mật khẩu   |
|----------|---------------|------------|
| Admin    | 0900000001    | Admin@123  |
| Customer | 0900000002    | User@123   |

Trang khách hàng: `http://localhost:5173`
Trang quản trị: `http://localhost:5173/admin/dang-nhap`

---

## 6. Những gì có trong schema ngoài các bảng bạn thiết kế ban đầu

Ảnh Supabase bạn gửi có nhiều bảng hơn đoạn SQL bạn paste ban đầu (`user_addresses`, `password_reset_tokens`, `user_coupons`, `product_view_events`, và 2 bảng dạng **view** `best_selling_products`, `product_trend_metrics`). Vì các tính năng bạn yêu cầu (sổ địa chỉ, quên mật khẩu, mã giảm giá cá nhân, chống spam lượt xem, bán chạy theo lượt mua) cần đến chúng, mình đã gộp vào `schema.sql` (mục 17-24 trong file):

- **`user_addresses`** — sổ địa chỉ của khách, dùng ở bước checkout.
- **`password_reset_tokens`** — lưu token (đã hash) cho luồng quên/đặt lại mật khẩu.
- **`user_coupons`** — mã giảm giá khách đã lưu/đã dùng (khác với bảng `coupons` là mã giảm giá chung toàn hệ thống).
- **`product_view_events`** — log lượt xem theo `device_key`, dùng để chống spam (30 phút/thiết bị mới tính thêm 1 view) và cộng điểm trending.
- **View `best_selling_products`** — tổng số lượng đã bán theo sản phẩm (từ `order_items`), dùng cho "bán chạy nhất".
- **View `product_trend_metrics`** — gộp số lượt xem 24h/7 ngày với điểm trend hiện tại, phục vụ báo cáo.

Mình cũng thêm `'PAYPAL'` vào `CHECK` constraint của `payment_method`/`payments.status` để chừa sẵn chỗ khi tích hợp PayPal thật (hiện đang **mock**, xem mục 8).

---

## 7. Kiến trúc & tách biệt Customer / Admin

```
backend/src/
  modules/<tên-module>/        service.js, controller.js, routes.*.js
  routes/customer.routes.js    -> mount tại /api/*
  routes/admin.routes.js       -> mount tại /api/admin/* (requireAuth + requireAdmin cho TOÀN BỘ)
  middlewares/                 auth (JWT), admin (role check), upload (multer), error handler
```

Mỗi module (`products`, `orders`, `coupons`, `trending`...) có **service riêng cho logic**, **controller mỏng**, và **route file riêng cho customer vs admin** — không dùng chung 1 route file cho cả 2 phía như yêu cầu ban đầu.

Frontend cũng tách hoàn toàn 2 khu vực: `pages/customer/*` (theme đỏ, layout Header/CategoryNav/Footer) và `pages/admin/*` (theme tối riêng, sidebar quản trị, được bảo vệ bởi `AdminRoute`).

---

## 7b. Tính năng Chat real-time (Socket.IO) — nếu DB đã có data từ trước

Nếu bạn đã migrate/seed DB trước đó (chưa có bảng `conversations`/`chat_messages`), chạy thêm migration bổ sung này (an toàn, không xoá data hiện có):

```bash
psql -U postgres -h localhost -d <tên_database_của_bạn> -f migrations/chat_feature.sql
```

(Cài đặt mới hoàn toàn từ đầu bằng `npm run migrate` thì **không cần** làm bước này — `schema.sql` đã có sẵn 2 bảng này rồi.)

Socket.IO chạy **cùng cổng** với REST API (`http://localhost:4000`), xác thực bằng chính access token JWT đang dùng cho REST — không cần cấu hình thêm gì ở `.env`. Sau khi chạy `npm run dev` (backend) và `npm run dev` (frontend) như bình thường:
- Khách hàng đăng nhập sẽ thấy nút chat 💬 nổi ở góc phải-dưới mọi trang.
- Admin vào mục **💬 Chat** trong sidebar (có badge đỏ số hội thoại chưa đọc) để xem danh sách khách đang chờ và trả lời.
- Mỗi khách hàng có đúng **1 hội thoại duy nhất** với shop (giống kiểu chat hỗ trợ của Shopee/TikTok Shop), lưu lại lịch sử đầy đủ trong PostgreSQL.

## 7c. Gắn ảnh sản phẩm thật (ảnh copy tay vào `uploads/products`)

Copy file ảnh vào `backend/uploads/products` **chưa đủ** để web hiển thị — database phải biết ảnh nào thuộc sản phẩm nào. Có 2 cách:

1. **Upload qua trang admin** (`/admin/san-pham/:id` → mục Hình ảnh): tự lưu file + ghi DB.
2. **Gắn hàng loạt từ file đã copy sẵn** bằng script (chạy trong thư mục `backend`):
   ```bash
   node scripts/linkImages.js           # CHẠY THỬ: chỉ in kết quả ghép, chưa ghi DB
   node scripts/linkImages.js --apply   # ghi thật vào DB nếu kết quả ghép đúng
   ```
   Script ghép theo độ giống tên (bỏ dấu, chịu được gõ lệch nhẹ như "xã"/"sả"). Trường hợp mơ hồ hoặc không khớp sẽ được báo ra để xử lý tay, không tự đoán bừa — muốn ép ghép thì tạo `backend/scripts/image-map.json`, ví dụ `{ "Chân gà": "chan-ga-sot-thai" }` (tên file không đuôi → slug sản phẩm). Ảnh giả `placehold.co` của sản phẩm được ghép sẽ bị thay bằng ảnh thật; ảnh admin đã upload trước đó được giữ nguyên.

## 8. Danh sách tính năng đã cài đặt

### Khách hàng
- Đăng ký / đăng nhập bằng số điện thoại (JWT tự viết, bcrypt).
- Quên mật khẩu → đặt lại mật khẩu (token gửi qua "kênh giả lập" — vì chưa có SMS/email provider thật, token demo được trả trực tiếp trong response `debug_token` và log ra console; xoá field này khi gắn provider thật).
- Đổi mật khẩu khi đã đăng nhập.
- Danh sách sản phẩm: tìm kiếm **không dấu** (dùng extension `unaccent`), lọc theo danh mục/khoảng giá, sắp xếp (nổi bật/hot/bán chạy/mới/giá), phân trang.
- Chi tiết sản phẩm: nhiều ảnh, chọn biến thể (đổi giá theo lựa chọn), tồn kho theo biến thể.
- **Chống spam lượt xem**: mỗi thiết bị (`x-device-key` lưu ở localStorage) chỉ tính 1 view/sản phẩm mỗi 30 phút (cấu hình qua `VIEW_SPAM_WINDOW_MINUTES`), việc xem đẩy điểm trending lên.
- **Bán chạy theo lượt mua thật**: mỗi đơn hàng đặt thành công sẽ cộng điểm trending + cập nhật view thống kê `best_selling_products`.
- Bình luận/đánh giá: **bắt buộc đã mua sản phẩm đó trong 1 đơn hàng cụ thể** mới được đánh giá (kiểm tra ở backend, không thể bypass qua frontend).
- Giỏ hàng: chống trùng sản phẩm (cùng biến thể → gộp số lượng thay vì tạo dòng mới), tính tổng tiền.
- Checkout: chọn/thêm địa chỉ (tích hợp API tỉnh/thành `provinces.open-api.vn`), áp mã giảm giá (kiểm tra đơn tối thiểu + giảm tối đa), chọn phương thức thanh toán.
- Thanh toán: **COD**, **chuyển khoản (giả lập báo thành công ngay)**, **PayPal (giả lập qua trang mock riêng)** — sẵn sàng thay bằng PayPal SDK thật.
- Theo dõi trạng thái đơn hàng (timeline lịch sử trạng thái), huỷ đơn khi còn ở trạng thái chờ.
- Trang cá nhân: thông tin, đổi mật khẩu, lịch sử đơn hàng, sổ địa chỉ, danh sách mã giảm giá (đã lưu/có thể lưu), sản phẩm yêu thích.
- **Chat real-time với shop** (Socket.IO): widget nổi góc phải-dưới, gửi/nhận tin nhắn tức thời, lưu lịch sử, badge số tin chưa đọc.

### Admin
- Dashboard: doanh thu, số đơn theo trạng thái, top sản phẩm bán chạy, đơn hàng gần đây.
- Quản lý danh mục (CRUD).
- Quản lý sản phẩm: CRUD sản phẩm, **biến thể** (giá/giá KM/tồn kho), **ảnh** (upload nhiều ảnh qua multer, đặt ảnh đại diện, xoá — đã test thật với file ảnh).
- Quản lý đơn hàng: danh sách + lọc trạng thái, xem chi tiết, cập nhật trạng thái theo luồng PENDING → CONFIRMED → PREPARING → READY → COMPLETED (hoặc huỷ, tự hoàn kho khi huỷ).
- Quản lý khách hàng: danh sách, khoá/mở khoá tài khoản.
- Quản lý mã giảm giá: CRUD, cấu hình % / số tiền cố định, giảm tối đa, đơn tối thiểu, giới hạn lượt dùng.
- Quản lý Trending: xem điểm tự động, ghi đè thủ công (điểm, nhãn, rank).
- **Chat real-time**: hộp thư 2 cột (danh sách hội thoại + khung chat), trả lời khách tức thời qua Socket.IO, badge tổng số hội thoại chưa đọc trên sidebar.

---

## 9. Đã kiểm thử (không phải code viết xong rồi bỏ đó)

Trong lúc xây dựng, mình đã cài PostgreSQL + chạy thật backend, viết 3 script test tại `backend/tests/` và chạy qua toàn bộ:

- `test_customer_flow.py` — đăng ký, đăng nhập, giỏ hàng (kể cả test **chống trùng sản phẩm**), áp mã giảm giá (đúng/sai điều kiện), sổ địa chỉ, checkout thật (trừ kho, tính tiền, áp coupon), giỏ hàng tự xoá sau khi đặt, yêu thích, **test bình luận bị chặn nếu chưa mua** rồi **thành công sau khi mua**, quên/đặt lại mật khẩu.
- `test_admin_flow.py` — đăng nhập admin, **test khách hàng thường bị chặn 403 khi gọi API admin**, dashboard, CRUD danh mục/sản phẩm/biến thể/coupon, set trending thủ công, cập nhật trạng thái đơn, danh sách khách hàng.
- `test_upload.py` — upload ảnh thật (multer) → kiểm tra file được serve tĩnh → xoá → kiểm tra file đã mất.

Chạy lại để tự kiểm chứng (cần backend đang chạy + đã seed data mẫu):
```bash
cd backend
pip install requests   # nếu chưa có (cho 3 test Python)
python3 tests/test_customer_flow.py
python3 tests/test_admin_flow.py
python3 tests/test_upload.py
node tests/test_chat.js   # test Socket.IO chat (axios + socket.io-client đã có trong devDependencies)
```

Frontend: `npm run build` đã chạy thành công (không lỗi cú pháp/import).

**Chat real-time** cũng đã test end-to-end bằng script giả lập 2 kết nối Socket.IO đồng thời (khách + admin): gửi tin realtime cả 2 chiều, xác nhận lưu đúng vào PostgreSQL, admin thấy hội thoại trong danh sách, và **chặn đúng** khi customer cố gọi sự kiện dành riêng cho admin (kiểm tra phân quyền ở tầng socket, không chỉ REST).

---

## 10. Giới hạn / việc cần làm tiếp khi lên production

- **Thanh toán**: COD hoạt động đầy đủ; BANK_TRANSFER và PAYPAL đang ở dạng **giả lập** (báo thành công ngay hoặc qua trang mock) theo đúng yêu cầu ban đầu của bạn ("chỉ giả lập trước"). Khi cần tích hợp PayPal thật, thay logic trong `backend/src/modules/orders/orders.service.js` (hàm `confirmMockPayment`) bằng PayPal Checkout SDK / webhook thật.
- **SMS/Email**: quên mật khẩu hiện log token ra console + trả trong response (`debug_token`) để demo. Cần gắn Twilio/SMS hoặc SMTP thật trước khi public.
- **Phí giao hàng**: đang là số cố định (`DEFAULT_DELIVERY_FEE` trong `.env`), chưa tính theo khoảng cách.
- **Refresh token**: chưa có cơ chế thu hồi (blacklist) khi logout — logout hiện tại chỉ xoá token phía client.
- Ảnh sản phẩm lưu local (`backend/uploads/products`) theo đúng lựa chọn của bạn — khi deploy nhiều instance cần chuyển sang storage tập trung (S3/Cloudinary) hoặc mount volume dùng chung.
- **Chat**: mỗi khách chỉ có 1 hội thoại duy nhất với shop (không hỗ trợ nhiều "ticket" riêng biệt), chưa hỗ trợ gửi ảnh/file, chưa có thông báo đẩy (push notification) khi khách offline — tin nhắn vẫn lưu lại đầy đủ, khách chỉ thấy khi mở lại app. Nếu chạy nhiều instance backend (scale ngang) cần gắn thêm Redis adapter cho Socket.IO để các instance đồng bộ được với nhau (hiện tại 1 instance là đủ dùng tốt).
