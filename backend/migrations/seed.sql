-- =========================================================
-- FOOD TREND PROJECT - SEED DATA (provided by user, unchanged)
-- Demo accounts:
--   Admin:    phone 0900000001 / Admin@123
--   Customer: phone 0900000002 / User@123
-- =========================================================

BEGIN;

TRUNCATE TABLE
    order_status_history,
    notifications,
    reviews,
    payments,
    order_items,
    orders,
    cart_items,
    carts,
    favorites,
    trending_products,
    product_view_events,
    user_coupons,
    user_addresses,
    password_reset_tokens,
    product_images,
    product_variants,
    products,
    coupons,
    categories,
    users
CASCADE;

INSERT INTO users (full_name, email, phone, password_hash, role, is_active) VALUES
('Quản trị viên FoodTrend', 'admin@foodtrend.vn', '0900000001', crypt('Admin@123', gen_salt('bf')), 'ADMIN', TRUE),
('Nguyễn Minh Anh', 'minhanh@example.com', '0900000002', crypt('User@123', gen_salt('bf')), 'CUSTOMER', TRUE),
('Trần Quốc Bảo', 'quocbao@example.com', '0900000003', crypt('User@123', gen_salt('bf')), 'CUSTOMER', TRUE),
('Lê Ngọc Mai', 'ngocmai@example.com', '0900000004', crypt('User@123', gen_salt('bf')), 'CUSTOMER', TRUE);

INSERT INTO categories (name, slug, description, image_url) VALUES
('Ăn vặt hot trend', 'an-vat-hot-trend', 'Các món ăn vặt đang được giới trẻ quan tâm trên mạng xã hội.', 'https://placehold.co/800x600?text=An+vat+hot+trend'),
('Chân gà & món sốt', 'chan-ga-mon-sot', 'Chân gà, đồ ăn cay và các món ăn kèm sốt đậm vị.', 'https://placehold.co/800x600?text=Chan+ga'),
('Đồ chiên & cá viên', 'do-chien-ca-vien', 'Cá viên, xúc xích, khoai và các món chiên ăn vặt.', 'https://placehold.co/800x600?text=Do+chien'),
('Trái cây & món chua cay', 'trai-cay-chua-cay', 'Các món trái cây lắc, chấm và sốt chua cay.', 'https://placehold.co/800x600?text=Trai+cay'),
('Trà & đồ uống', 'tra-do-uong', 'Các loại trà và đồ uống phổ biến trên mạng xã hội.', 'https://placehold.co/800x600?text=Do+uong'),
('Matcha & đồ ngọt', 'matcha-do-ngot', 'Matcha, kem, bơ và các món tráng miệng.', 'https://placehold.co/800x600?text=Matcha'),
('Combo hot trend', 'combo-hot-trend', 'Combo ăn vặt phù hợp cho cá nhân, nhóm bạn và gia đình.', 'https://placehold.co/800x600?text=Combo');

INSERT INTO products (category_id, name, slug, description) SELECT id, 'Lạp xưởng nướng đá', 'lap-xuong-nuong-da', 'Lạp xưởng nướng thơm, vị đậm đà, dùng kèm tương ớt và sốt đặc trưng.' FROM categories WHERE slug = 'an-vat-hot-trend';
INSERT INTO products (category_id, name, slug, description) SELECT id, 'Chân gà sốt tắc', 'chan-ga-sot-tac', 'Chân gà giòn dai kết hợp sốt tắc chua cay, thơm và đậm vị.' FROM categories WHERE slug = 'chan-ga-mon-sot';
INSERT INTO products (category_id, name, slug, description) SELECT id, 'Chân gà sốt Thái', 'chan-ga-sot-thai', 'Chân gà trộn sốt Thái chua cay, vị đậm và thơm mùi sả.' FROM categories WHERE slug = 'chan-ga-mon-sot';
INSERT INTO products (category_id, name, slug, description) SELECT id, 'Chân gà sốt mắm tỏi', 'chan-ga-sot-mam-toi', 'Chân gà sốt nước mắm tỏi ớt, vị mặn ngọt cân bằng.' FROM categories WHERE slug = 'chan-ga-mon-sot';
INSERT INTO products (category_id, name, slug, description) SELECT id, 'Cá viên chiên bơ tỏi', 'ca-vien-chien-bo-toi', 'Cá viên chiên giòn áo sốt bơ tỏi thơm, phù hợp ăn vặt hoặc ăn nhóm.' FROM categories WHERE slug = 'do-chien-ca-vien';
INSERT INTO products (category_id, name, slug, description) SELECT id, 'Cá viên chiên 5 món', 'ca-vien-chien-5-mon', 'Phần cá viên mix nhiều loại viên chiên, phù hợp ăn cùng bạn bè.' FROM categories WHERE slug = 'do-chien-ca-vien';
INSERT INTO products (category_id, name, slug, description) SELECT id, 'Xúc xích phô mai chiên', 'xuc-xich-pho-mai-chien', 'Xúc xích chiên giòn với nhân phô mai béo.' FROM categories WHERE slug = 'do-chien-ca-vien';
INSERT INTO products (category_id, name, slug, description) SELECT id, 'Khoai tây lắc phô mai', 'khoai-tay-lac-pho-mai', 'Khoai tây chiên giòn phủ bột phô mai thơm béo.' FROM categories WHERE slug = 'do-chien-ca-vien';
INSERT INTO products (category_id, name, slug, description) SELECT id, 'Xoài non lắc muối ớt', 'xoai-non-lac-muoi-ot', 'Xoài non giòn chua nhẹ kết hợp muối ớt cay mặn.' FROM categories WHERE slug = 'trai-cay-chua-cay';
INSERT INTO products (category_id, name, slug, description) SELECT id, 'Xoài non sốt mắm', 'xoai-non-sot-mam', 'Xoài non giòn trộn sốt mắm đường và ớt.' FROM categories WHERE slug = 'trai-cay-chua-cay';
INSERT INTO products (category_id, name, slug, description) SELECT id, 'Cóc non lắc muối tôm', 'coc-non-lac-muoi-tom', 'Cóc non giòn chua cay, phủ muối tôm đậm vị.' FROM categories WHERE slug = 'trai-cay-chua-cay';
INSERT INTO products (category_id, name, slug, description) SELECT id, 'Trà tắc xí muội', 'tra-tac-xi-muoi', 'Trà thanh mát kết hợp tắc và xí muội, vị chua ngọt dễ uống.' FROM categories WHERE slug = 'tra-do-uong';
INSERT INTO products (category_id, name, slug, description) SELECT id, 'Trà đào cam sả', 'tra-dao-cam-sa', 'Trà đào kết hợp cam và sả, thơm nhẹ và thanh mát.' FROM categories WHERE slug = 'tra-do-uong';
INSERT INTO products (category_id, name, slug, description) SELECT id, 'Trà chanh giã tay', 'tra-chanh-gia-tay', 'Trà chanh có vị chua thanh và hương thơm vỏ chanh.' FROM categories WHERE slug = 'tra-do-uong';
INSERT INTO products (category_id, name, slug, description) SELECT id, 'Matcha dâu', 'matcha-dau', 'Matcha kết hợp dâu tạo vị đắng nhẹ, chua ngọt và béo.' FROM categories WHERE slug = 'matcha-do-ngot';
INSERT INTO products (category_id, name, slug, description) SELECT id, 'Matcha kem cheese', 'matcha-kem-cheese', 'Matcha thơm nhẹ kết hợp lớp kem cheese béo mịn.' FROM categories WHERE slug = 'matcha-do-ngot';
INSERT INTO products (category_id, name, slug, description) SELECT id, 'Bơ già dừa non', 'bo-gia-dua-non', 'Món tráng miệng béo thơm từ bơ kết hợp dừa non.' FROM categories WHERE slug = 'matcha-do-ngot';
INSERT INTO products (category_id, name, slug, description) SELECT id, 'Kem bơ dừa', 'kem-bo-dua', 'Kem bơ béo mịn kết hợp dừa non và topping giòn.' FROM categories WHERE slug = 'matcha-do-ngot';
INSERT INTO products (category_id, name, slug, description) SELECT id, 'Bánh tráng cuốn sốt bơ', 'banh-trang-cuon-sot-bo', 'Bánh tráng cuốn cùng topping ăn vặt và sốt bơ béo.' FROM categories WHERE slug = 'an-vat-hot-trend';
INSERT INTO products (category_id, name, slug, description) SELECT id, 'Bánh tráng trộn sốt tắc', 'banh-trang-tron-sot-tac', 'Bánh tráng trộn topping với sốt tắc chua cay.' FROM categories WHERE slug = 'an-vat-hot-trend';
INSERT INTO products (category_id, name, slug, description) SELECT id, 'Combo ăn vặt 2 người', 'combo-an-vat-2-nguoi', 'Combo gồm nhiều món ăn vặt phù hợp cho hai người.' FROM categories WHERE slug = 'combo-hot-trend';
INSERT INTO products (category_id, name, slug, description) SELECT id, 'Combo TikTok Food', 'combo-tiktok-food', 'Combo tổng hợp các món đang được quan tâm trên mạng xã hội.' FROM categories WHERE slug = 'combo-hot-trend';
INSERT INTO products (category_id, name, slug, description) SELECT id, 'Combo chân gà 3 vị', 'combo-chan-ga-3-vi', 'Combo gồm chân gà sốt tắc, sốt Thái và sốt mắm tỏi.' FROM categories WHERE slug = 'combo-hot-trend';
INSERT INTO products (category_id, name, slug, description) SELECT id, 'Combo viên chiên thập cẩm', 'combo-vien-chien-thap-cam', 'Combo nhiều loại viên chiên, xúc xích và khoai tây.' FROM categories WHERE slug = 'combo-hot-trend';

INSERT INTO product_variants (product_id, variant_name, price, sale_price, stock_quantity) SELECT id, '1 phần', 29000, 25000, 80 FROM products WHERE slug = 'lap-xuong-nuong-da';
INSERT INTO product_variants (product_id, variant_name, price, sale_price, stock_quantity) SELECT id, '2 phần', 55000, 49000, 60 FROM products WHERE slug = 'lap-xuong-nuong-da';
INSERT INTO product_variants (product_id, variant_name, price, sale_price, stock_quantity) SELECT id, 'Combo 3 phần', 79000, 69000, 40 FROM products WHERE slug = 'lap-xuong-nuong-da';
INSERT INTO product_variants (product_id, variant_name, price, sale_price, stock_quantity) SELECT id, '250g', 39000, 35000, 100 FROM products WHERE slug = 'chan-ga-sot-tac';
INSERT INTO product_variants (product_id, variant_name, price, sale_price, stock_quantity) SELECT id, '500g', 65000, 59000, 70 FROM products WHERE slug = 'chan-ga-sot-tac';
INSERT INTO product_variants (product_id, variant_name, price, sale_price, stock_quantity) SELECT id, '1kg', 119000, 105000, 35 FROM products WHERE slug = 'chan-ga-sot-tac';
INSERT INTO product_variants (product_id, variant_name, price, sale_price, stock_quantity) SELECT id, '250g', 42000, 39000, 90 FROM products WHERE slug = 'chan-ga-sot-thai';
INSERT INTO product_variants (product_id, variant_name, price, sale_price, stock_quantity) SELECT id, '500g', 69000, 62000, 65 FROM products WHERE slug = 'chan-ga-sot-thai';
INSERT INTO product_variants (product_id, variant_name, price, sale_price, stock_quantity) SELECT id, '250g', 39000, 35000, 90 FROM products WHERE slug = 'chan-ga-sot-mam-toi';
INSERT INTO product_variants (product_id, variant_name, price, sale_price, stock_quantity) SELECT id, '500g', 65000, 59000, 60 FROM products WHERE slug = 'chan-ga-sot-mam-toi';
INSERT INTO product_variants (product_id, variant_name, price, sale_price, stock_quantity) SELECT id, 'Phần S', 29000, 25000, 120 FROM products WHERE slug = 'ca-vien-chien-bo-toi';
INSERT INTO product_variants (product_id, variant_name, price, sale_price, stock_quantity) SELECT id, 'Phần M', 45000, 39000, 90 FROM products WHERE slug = 'ca-vien-chien-bo-toi';
INSERT INTO product_variants (product_id, variant_name, price, sale_price, stock_quantity) SELECT id, 'Phần L', 69000, 59000, 50 FROM products WHERE slug = 'ca-vien-chien-bo-toi';
INSERT INTO product_variants (product_id, variant_name, price, sale_price, stock_quantity) SELECT id, 'Phần S', 30000, 27000, 100 FROM products WHERE slug = 'ca-vien-chien-5-mon';
INSERT INTO product_variants (product_id, variant_name, price, sale_price, stock_quantity) SELECT id, 'Phần M', 50000, 45000, 80 FROM products WHERE slug = 'ca-vien-chien-5-mon';
INSERT INTO product_variants (product_id, variant_name, price, sale_price, stock_quantity) SELECT id, 'Phần L', 75000, 69000, 45 FROM products WHERE slug = 'ca-vien-chien-5-mon';
INSERT INTO product_variants (product_id, variant_name, price, sale_price, stock_quantity) SELECT id, '2 cây', 35000, 30000, 100 FROM products WHERE slug = 'xuc-xich-pho-mai-chien';
INSERT INTO product_variants (product_id, variant_name, price, sale_price, stock_quantity) SELECT id, '4 cây', 65000, 55000, 70 FROM products WHERE slug = 'xuc-xich-pho-mai-chien';
INSERT INTO product_variants (product_id, variant_name, price, sale_price, stock_quantity) SELECT id, 'Phần nhỏ', 30000, 27000, 100 FROM products WHERE slug = 'khoai-tay-lac-pho-mai';
INSERT INTO product_variants (product_id, variant_name, price, sale_price, stock_quantity) SELECT id, 'Phần lớn', 45000, 39000, 70 FROM products WHERE slug = 'khoai-tay-lac-pho-mai';
INSERT INTO product_variants (product_id, variant_name, price, sale_price, stock_quantity) SELECT id, '250g', 35000, 30000, 100 FROM products WHERE slug = 'xoai-non-lac-muoi-ot';
INSERT INTO product_variants (product_id, variant_name, price, sale_price, stock_quantity) SELECT id, '500g', 60000, 52000, 60 FROM products WHERE slug = 'xoai-non-lac-muoi-ot';
INSERT INTO product_variants (product_id, variant_name, price, sale_price, stock_quantity) SELECT id, '250g', 39000, 35000, 90 FROM products WHERE slug = 'xoai-non-sot-mam';
INSERT INTO product_variants (product_id, variant_name, price, sale_price, stock_quantity) SELECT id, '500g', 69000, 59000, 55 FROM products WHERE slug = 'xoai-non-sot-mam';
INSERT INTO product_variants (product_id, variant_name, price, sale_price, stock_quantity) SELECT id, '250g', 35000, 30000, 80 FROM products WHERE slug = 'coc-non-lac-muoi-tom';
INSERT INTO product_variants (product_id, variant_name, price, sale_price, stock_quantity) SELECT id, '500g', 60000, 52000, 50 FROM products WHERE slug = 'coc-non-lac-muoi-tom';
INSERT INTO product_variants (product_id, variant_name, price, sale_price, stock_quantity) SELECT id, '500ml', 25000, 22000, 120 FROM products WHERE slug = 'tra-tac-xi-muoi';
INSERT INTO product_variants (product_id, variant_name, price, sale_price, stock_quantity) SELECT id, '700ml', 32000, 29000, 80 FROM products WHERE slug = 'tra-tac-xi-muoi';
INSERT INTO product_variants (product_id, variant_name, price, sale_price, stock_quantity) SELECT id, '500ml', 35000, 32000, 100 FROM products WHERE slug = 'tra-dao-cam-sa';
INSERT INTO product_variants (product_id, variant_name, price, sale_price, stock_quantity) SELECT id, '700ml', 42000, 39000, 70 FROM products WHERE slug = 'tra-dao-cam-sa';
INSERT INTO product_variants (product_id, variant_name, price, sale_price, stock_quantity) SELECT id, '500ml', 30000, 27000, 90 FROM products WHERE slug = 'tra-chanh-gia-tay';
INSERT INTO product_variants (product_id, variant_name, price, sale_price, stock_quantity) SELECT id, '700ml', 39000, 35000, 60 FROM products WHERE slug = 'tra-chanh-gia-tay';
INSERT INTO product_variants (product_id, variant_name, price, sale_price, stock_quantity) SELECT id, '1 ly', 45000, 39000, 100 FROM products WHERE slug = 'matcha-dau';
INSERT INTO product_variants (product_id, variant_name, price, sale_price, stock_quantity) SELECT id, '2 ly', 85000, 75000, 60 FROM products WHERE slug = 'matcha-dau';
INSERT INTO product_variants (product_id, variant_name, price, sale_price, stock_quantity) SELECT id, '1 ly', 49000, 45000, 90 FROM products WHERE slug = 'matcha-kem-cheese';
INSERT INTO product_variants (product_id, variant_name, price, sale_price, stock_quantity) SELECT id, '2 ly', 90000, 82000, 50 FROM products WHERE slug = 'matcha-kem-cheese';
INSERT INTO product_variants (product_id, variant_name, price, sale_price, stock_quantity) SELECT id, '1 ly', 45000, 39000, 80 FROM products WHERE slug = 'bo-gia-dua-non';
INSERT INTO product_variants (product_id, variant_name, price, sale_price, stock_quantity) SELECT id, '2 ly', 85000, 75000, 50 FROM products WHERE slug = 'bo-gia-dua-non';
INSERT INTO product_variants (product_id, variant_name, price, sale_price, stock_quantity) SELECT id, '1 ly', 42000, 38000, 80 FROM products WHERE slug = 'kem-bo-dua';
INSERT INTO product_variants (product_id, variant_name, price, sale_price, stock_quantity) SELECT id, '2 ly', 79000, 69000, 50 FROM products WHERE slug = 'kem-bo-dua';
INSERT INTO product_variants (product_id, variant_name, price, sale_price, stock_quantity) SELECT id, '1 phần', 35000, 30000, 100 FROM products WHERE slug = 'banh-trang-cuon-sot-bo';
INSERT INTO product_variants (product_id, variant_name, price, sale_price, stock_quantity) SELECT id, '2 phần', 65000, 55000, 60 FROM products WHERE slug = 'banh-trang-cuon-sot-bo';
INSERT INTO product_variants (product_id, variant_name, price, sale_price, stock_quantity) SELECT id, '1 phần', 35000, 30000, 100 FROM products WHERE slug = 'banh-trang-tron-sot-tac';
INSERT INTO product_variants (product_id, variant_name, price, sale_price, stock_quantity) SELECT id, '2 phần', 65000, 55000, 60 FROM products WHERE slug = 'banh-trang-tron-sot-tac';
INSERT INTO product_variants (product_id, variant_name, price, sale_price, stock_quantity) SELECT id, 'Combo tiêu chuẩn', 109000, 99000, 50 FROM products WHERE slug = 'combo-an-vat-2-nguoi';
INSERT INTO product_variants (product_id, variant_name, price, sale_price, stock_quantity) SELECT id, 'Combo lớn', 159000, 139000, 30 FROM products WHERE slug = 'combo-an-vat-2-nguoi';
INSERT INTO product_variants (product_id, variant_name, price, sale_price, stock_quantity) SELECT id, 'Combo 3 món', 129000, 109000, 50 FROM products WHERE slug = 'combo-tiktok-food';
INSERT INTO product_variants (product_id, variant_name, price, sale_price, stock_quantity) SELECT id, 'Combo 5 món', 189000, 159000, 30 FROM products WHERE slug = 'combo-tiktok-food';
INSERT INTO product_variants (product_id, variant_name, price, sale_price, stock_quantity) SELECT id, 'Combo 3 vị - 750g', 119000, 99000, 40 FROM products WHERE slug = 'combo-chan-ga-3-vi';
INSERT INTO product_variants (product_id, variant_name, price, sale_price, stock_quantity) SELECT id, 'Combo 3 vị - 1.5kg', 219000, 189000, 25 FROM products WHERE slug = 'combo-chan-ga-3-vi';
INSERT INTO product_variants (product_id, variant_name, price, sale_price, stock_quantity) SELECT id, 'Combo nhỏ', 79000, 69000, 50 FROM products WHERE slug = 'combo-vien-chien-thap-cam';
INSERT INTO product_variants (product_id, variant_name, price, sale_price, stock_quantity) SELECT id, 'Combo lớn', 129000, 109000, 30 FROM products WHERE slug = 'combo-vien-chien-thap-cam';

INSERT INTO product_images (product_id, image_url, sort_order, is_thumbnail)
SELECT id, 'https://placehold.co/800x800?text=' || replace(name, ' ', '+'), 0, TRUE FROM products;

INSERT INTO trending_products (product_id, trend_score, rank, trend_label, is_active) SELECT id, 98.5, 1, 'DANG_HOT', TRUE FROM products WHERE slug = 'chan-ga-sot-tac';
INSERT INTO trending_products (product_id, trend_score, rank, trend_label, is_active) SELECT id, 96.8, 2, 'DANG_HOT', TRUE FROM products WHERE slug = 'ca-vien-chien-bo-toi';
INSERT INTO trending_products (product_id, trend_score, rank, trend_label, is_active) SELECT id, 94.2, 3, 'BAN_CHAY', TRUE FROM products WHERE slug = 'xoai-non-lac-muoi-ot';
INSERT INTO trending_products (product_id, trend_score, rank, trend_label, is_active) SELECT id, 92.7, 4, 'MOI_HOT', TRUE FROM products WHERE slug = 'matcha-dau';
INSERT INTO trending_products (product_id, trend_score, rank, trend_label, is_active) SELECT id, 90.5, 5, 'BAN_CHAY', TRUE FROM products WHERE slug = 'combo-tiktok-food';
INSERT INTO trending_products (product_id, trend_score, rank, trend_label, is_active) SELECT id, 87.4, 6, 'DANG_HOT', TRUE FROM products WHERE slug = 'bo-gia-dua-non';
INSERT INTO trending_products (product_id, trend_score, rank, trend_label, is_active) SELECT id, 74.0, 7, 'HA_NHIET', TRUE FROM products WHERE slug = 'lap-xuong-nuong-da';

INSERT INTO coupons (code, description, discount_type, discount_value, min_order_amount, max_discount_amount, usage_limit, used_count, start_at, end_at, is_active) VALUES
('WELCOME20', 'Giảm 20% cho khách hàng mới', 'PERCENT', 20, 50000, 30000, 500, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '90 days', TRUE),
('FOOD30K', 'Giảm 30.000đ cho đơn từ 199.000đ', 'FIXED', 30000, 199000, NULL, 300, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '90 days', TRUE),
('HOTFOOD15', 'Giảm 15% cho nhóm món hot trend', 'PERCENT', 15, 100000, 40000, 200, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '60 days', TRUE);

INSERT INTO carts (user_id) SELECT id FROM users WHERE phone = '0900000002';

INSERT INTO cart_items (cart_id, variant_id, quantity)
SELECT c.id, pv.id, 2 FROM carts c JOIN users u ON u.id = c.user_id
JOIN product_variants pv ON pv.product_id = (SELECT id FROM products WHERE slug = 'chan-ga-sot-tac')
WHERE u.phone = '0900000002' AND pv.variant_name = '500g';

INSERT INTO cart_items (cart_id, variant_id, quantity)
SELECT c.id, pv.id, 1 FROM carts c JOIN users u ON u.id = c.user_id
JOIN product_variants pv ON pv.product_id = (SELECT id FROM products WHERE slug = 'tra-tac-xi-muoi')
WHERE u.phone = '0900000002' AND pv.variant_name = '500ml';

INSERT INTO orders (order_code, user_id, coupon_id, receiver_name, receiver_phone, delivery_address, subtotal, delivery_fee, discount_amount, total_amount, payment_method, payment_status, status, customer_note)
SELECT 'FT20260001', u.id, c.id, 'Nguyễn Minh Anh', '0900000002', '12 Nguyễn Văn Linh, Hải Châu, Đà Nẵng', 149000, 15000, 20000, 144000, 'COD', 'PENDING', 'PENDING', 'Giao giờ hành chính'
FROM users u JOIN coupons c ON c.code = 'WELCOME20' WHERE u.phone = '0900000002';

INSERT INTO order_items (order_id, product_id, variant_id, product_name, variant_name, quantity, unit_price, subtotal)
SELECT o.id, p.id, pv.id, p.name, pv.variant_name, 1, COALESCE(pv.sale_price, pv.price), COALESCE(pv.sale_price, pv.price)
FROM orders o JOIN products p ON p.slug = 'chan-ga-sot-tac' JOIN product_variants pv ON pv.product_id = p.id AND pv.variant_name = '500g'
WHERE o.order_code = 'FT20260001';

INSERT INTO order_items (order_id, product_id, variant_id, product_name, variant_name, quantity, unit_price, subtotal)
SELECT o.id, p.id, pv.id, p.name, pv.variant_name, 1, COALESCE(pv.sale_price, pv.price), COALESCE(pv.sale_price, pv.price)
FROM orders o JOIN products p ON p.slug = 'tra-tac-xi-muoi' JOIN product_variants pv ON pv.product_id = p.id AND pv.variant_name = '500ml'
WHERE o.order_code = 'FT20260001';

INSERT INTO order_status_history (order_id, status, changed_by, note)
SELECT o.id, 'PENDING', u.id, 'Khách hàng vừa tạo đơn hàng.' FROM orders o JOIN users u ON u.phone = '0900000002' WHERE o.order_code = 'FT20260001';

INSERT INTO payments (order_id, payment_method, amount, status)
SELECT id, payment_method, total_amount, 'PENDING' FROM orders WHERE order_code = 'FT20260001';

INSERT INTO orders (order_code, user_id, receiver_name, receiver_phone, delivery_address, subtotal, delivery_fee, discount_amount, total_amount, payment_method, payment_status, status, customer_note)
SELECT 'FT20260002', u.id, 'Trần Quốc Bảo', '0900000003', '45 Lê Duẩn, Hải Châu, Đà Nẵng', 159000, 15000, 0, 174000, 'COD', 'PENDING', 'PREPARING', 'Ít cay'
FROM users u WHERE u.phone = '0900000003';

INSERT INTO order_items (order_id, product_id, variant_id, product_name, variant_name, quantity, unit_price, subtotal)
SELECT o.id, p.id, pv.id, p.name, pv.variant_name, 1, COALESCE(pv.sale_price, pv.price), COALESCE(pv.sale_price, pv.price)
FROM orders o JOIN products p ON p.slug = 'combo-tiktok-food' JOIN product_variants pv ON pv.product_id = p.id AND pv.variant_name = 'Combo 5 món'
WHERE o.order_code = 'FT20260002';

INSERT INTO order_items (order_id, product_id, variant_id, product_name, variant_name, quantity, unit_price, subtotal)
SELECT o.id, p.id, pv.id, p.name, pv.variant_name, 1, COALESCE(pv.sale_price, pv.price), COALESCE(pv.sale_price, pv.price)
FROM orders o JOIN products p ON p.slug = 'tra-dao-cam-sa' JOIN product_variants pv ON pv.product_id = p.id AND pv.variant_name = '500ml'
WHERE o.order_code = 'FT20260002';

INSERT INTO order_status_history (order_id, status, changed_by, note) SELECT o.id, 'PENDING', u.id, 'Đơn hàng được tạo.' FROM orders o JOIN users u ON u.phone = '0900000003' WHERE o.order_code = 'FT20260002';
INSERT INTO order_status_history (order_id, status, changed_by, note) SELECT o.id, 'CONFIRMED', admin.id, 'Admin đã xác nhận đơn hàng.' FROM orders o JOIN users admin ON admin.phone = '0900000001' WHERE o.order_code = 'FT20260002';
INSERT INTO order_status_history (order_id, status, changed_by, note) SELECT o.id, 'PREPARING', admin.id, 'Đơn hàng đang được chuẩn bị.' FROM orders o JOIN users admin ON admin.phone = '0900000001' WHERE o.order_code = 'FT20260002';

INSERT INTO payments (order_id, payment_method, amount, status) SELECT id, payment_method, total_amount, 'PENDING' FROM orders WHERE order_code = 'FT20260002';

INSERT INTO orders (order_code, user_id, receiver_name, receiver_phone, delivery_address, subtotal, delivery_fee, discount_amount, total_amount, payment_method, payment_status, status, customer_note)
SELECT 'FT20260003', u.id, 'Lê Ngọc Mai', '0900000004', '88 Trần Phú, Hải Châu, Đà Nẵng', 119000, 15000, 0, 134000, 'COD', 'PAID', 'COMPLETED', NULL
FROM users u WHERE u.phone = '0900000004';

INSERT INTO order_items (order_id, product_id, variant_id, product_name, variant_name, quantity, unit_price, subtotal)
SELECT o.id, p.id, pv.id, p.name, pv.variant_name, 1, COALESCE(pv.sale_price, pv.price), COALESCE(pv.sale_price, pv.price)
FROM orders o JOIN products p ON p.slug = 'combo-chan-ga-3-vi' JOIN product_variants pv ON pv.product_id = p.id AND pv.variant_name = 'Combo 3 vị - 750g'
WHERE o.order_code = 'FT20260003';

INSERT INTO order_status_history (order_id, status, changed_by, note) SELECT o.id, 'PENDING', u.id, 'Khách hàng tạo đơn.' FROM orders o JOIN users u ON u.phone = '0900000004' WHERE o.order_code = 'FT20260003';
INSERT INTO order_status_history (order_id, status, changed_by, note) SELECT o.id, 'CONFIRMED', admin.id, 'Admin xác nhận đơn.' FROM orders o JOIN users admin ON admin.phone = '0900000001' WHERE o.order_code = 'FT20260003';
INSERT INTO order_status_history (order_id, status, changed_by, note) SELECT o.id, 'PREPARING', admin.id, 'Đang chuẩn bị món.' FROM orders o JOIN users admin ON admin.phone = '0900000001' WHERE o.order_code = 'FT20260003';
INSERT INTO order_status_history (order_id, status, changed_by, note) SELECT o.id, 'READY', admin.id, 'Món đã hoàn tất.' FROM orders o JOIN users admin ON admin.phone = '0900000001' WHERE o.order_code = 'FT20260003';
INSERT INTO order_status_history (order_id, status, changed_by, note) SELECT o.id, 'COMPLETED', admin.id, 'Đơn hàng đã hoàn thành.' FROM orders o JOIN users admin ON admin.phone = '0900000001' WHERE o.order_code = 'FT20260003';

INSERT INTO payments (order_id, payment_method, amount, status, paid_at) SELECT id, payment_method, total_amount, 'PAID', CURRENT_TIMESTAMP FROM orders WHERE order_code = 'FT20260003';

INSERT INTO reviews (user_id, product_id, order_id, rating, comment)
SELECT u.id, p.id, o.id, 5, 'Chân gà giòn, sốt tắc chua cay vừa miệng. Đóng gói khá ổn.'
FROM users u JOIN products p ON p.slug = 'combo-chan-ga-3-vi' JOIN orders o ON o.order_code = 'FT20260003' WHERE u.phone = '0900000004';

INSERT INTO favorites (user_id, product_id)
SELECT u.id, p.id FROM users u CROSS JOIN products p
WHERE u.phone = '0900000002' AND p.slug IN ('chan-ga-sot-tac','ca-vien-chien-bo-toi','matcha-dau','bo-gia-dua-non');

INSERT INTO notifications (user_id, title, message, type, is_read)
SELECT u.id, 'Đơn hàng đang được chuẩn bị', 'Đơn FT20260002 của bạn đang được chuẩn bị.', 'ORDER_STATUS', FALSE FROM users u WHERE u.phone = '0900000003';

INSERT INTO notifications (user_id, title, message, type, is_read)
SELECT u.id, 'Đơn hàng đã hoàn thành', 'Cảm ơn bạn đã mua hàng tại FoodTrend.', 'ORDER_STATUS', TRUE FROM users u WHERE u.phone = '0900000004';

UPDATE coupons SET used_count = 1 WHERE code = 'WELCOME20';

-- Sample personal coupon collection
INSERT INTO user_coupons (user_id, coupon_id, is_used, used_order_id, used_at)
SELECT u.id, c.id, TRUE, o.id, CURRENT_TIMESTAMP
FROM users u JOIN coupons c ON c.code = 'WELCOME20' JOIN orders o ON o.order_code = 'FT20260001'
WHERE u.phone = '0900000002';

INSERT INTO user_coupons (user_id, coupon_id)
SELECT u.id, c.id FROM users u JOIN coupons c ON c.code IN ('FOOD30K','HOTFOOD15') WHERE u.phone = '0900000002';

-- Sample default address
INSERT INTO user_addresses (user_id, label, receiver_name, receiver_phone, province_code, province_name, district_code, district_name, ward_code, ward_name, street_address, is_default)
SELECT id, 'Nhà riêng', 'Nguyễn Minh Anh', '0900000002', '48', 'Thành phố Đà Nẵng', '492', 'Quận Hải Châu', '19012', 'Phường Hòa Thuận Tây', '12 Nguyễn Văn Linh', TRUE
FROM users WHERE phone = '0900000002';

COMMIT;
