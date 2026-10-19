-- =========================================================
-- FOOD TREND PROJECT — FULL SCHEMA (bản gộp, sạch, chạy 1 lần)
-- PostgreSQL 14+
--
-- File này THAY THẾ cho cặp 001_init_schema.sql + 002_extra_tables.sql
-- cũ. Vì DB cũ có thể đã tồn tại sẵn vài bảng trùng tên nhưng khác
-- cấu trúc (từ thiết kế Supabase trước đó của bạn), file này XOÁ
-- SẠCH schema "public" trước khi tạo lại từ đầu để đảm bảo không còn
-- xung đột cấu trúc nào.
--
-- ⚠️ CẢNH BÁO: script này XOÁ TOÀN BỘ DỮ LIỆU đang có trong schema
-- public của database bạn trỏ tới. Chỉ chạy trên database dùng cho
-- dự án này (đừng chạy nhầm vào DB khác đang có dữ liệu quan trọng).
-- =========================================================

DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- =========================================================
-- EXTENSIONS
-- =========================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid(), crypt(), gen_salt()
CREATE EXTENSION IF NOT EXISTS unaccent;   -- tìm kiếm tiếng Việt không dấu

-- =========================================================
-- 1. USERS
-- =========================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'CUSTOMER',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_users_role CHECK (role IN ('CUSTOMER', 'ADMIN'))
);

-- =========================================================
-- 2. CATEGORIES
-- =========================================================
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- 3. PRODUCTS  (giá & tồn kho nằm ở product_variants, không ở đây)
-- =========================================================
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(220) UNIQUE NOT NULL,
    description TEXT,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
);

-- =========================================================
-- 4. PRODUCT VARIANTS  (VD: 250g / 500g / 1kg, Phần S/M/L...)
-- =========================================================
CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL,
    variant_name VARCHAR(100) NOT NULL,
    price NUMERIC(12,2) NOT NULL,
    sale_price NUMERIC(12,2),
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_product_variants_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT chk_product_variants_price CHECK (price >= 0),
    CONSTRAINT chk_product_variants_sale_price CHECK (sale_price IS NULL OR (sale_price >= 0 AND sale_price <= price)),
    CONSTRAINT chk_product_variants_stock CHECK (stock_quantity >= 0),
    CONSTRAINT uq_product_variant UNIQUE (product_id, variant_name)
);

-- =========================================================
-- 5. PRODUCT IMAGES  (1 ảnh hoặc nhiều ảnh mỗi sản phẩm)
-- =========================================================
CREATE TABLE product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL,
    image_url TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_thumbnail BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_product_images_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT chk_product_images_sort_order CHECK (sort_order >= 0)
);

-- =========================================================
-- 6. CARTS  (mỗi user 1 giỏ hàng, đăng nhập mới có)
-- =========================================================
CREATE TABLE carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_carts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =========================================================
-- 7. CART ITEMS  (UNIQUE cart+variant -> chống trùng sản phẩm)
-- =========================================================
CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID NOT NULL,
    variant_id UUID NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cart_items_cart FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
    CONSTRAINT fk_cart_items_variant FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE,
    CONSTRAINT uq_cart_variant UNIQUE (cart_id, variant_id),
    CONSTRAINT chk_cart_items_quantity CHECK (quantity > 0)
);

-- =========================================================
-- 8. COUPONS  (mã giảm giá chung toàn hệ thống)
-- =========================================================
CREATE TABLE coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    discount_type VARCHAR(20) NOT NULL,
    discount_value NUMERIC(12,2) NOT NULL,
    min_order_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    max_discount_amount NUMERIC(12,2),
    usage_limit INTEGER,
    used_count INTEGER NOT NULL DEFAULT 0,
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_coupons_discount_type CHECK (discount_type IN ('PERCENT', 'FIXED')),
    CONSTRAINT chk_coupons_discount_value CHECK (discount_value > 0),
    CONSTRAINT chk_coupons_percent_value CHECK (discount_type <> 'PERCENT' OR discount_value <= 100),
    CONSTRAINT chk_coupons_min_order CHECK (min_order_amount >= 0),
    CONSTRAINT chk_coupons_max_discount CHECK (max_discount_amount IS NULL OR max_discount_amount >= 0),
    CONSTRAINT chk_coupons_usage_limit CHECK (usage_limit IS NULL OR usage_limit > 0),
    CONSTRAINT chk_coupons_used_count CHECK (used_count >= 0),
    CONSTRAINT chk_coupons_date CHECK (end_at > start_at)
);

-- =========================================================
-- 9. ORDERS
-- =========================================================
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_code VARCHAR(30) UNIQUE NOT NULL,
    user_id UUID NOT NULL,
    coupon_id UUID,
    receiver_name VARCHAR(100) NOT NULL,
    receiver_phone VARCHAR(20) NOT NULL,
    delivery_address TEXT NOT NULL,
    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
    delivery_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    payment_method VARCHAR(30) NOT NULL DEFAULT 'COD',
    payment_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    customer_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_orders_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE SET NULL,
    CONSTRAINT chk_orders_subtotal CHECK (subtotal >= 0),
    CONSTRAINT chk_orders_delivery_fee CHECK (delivery_fee >= 0),
    CONSTRAINT chk_orders_discount CHECK (discount_amount >= 0),
    CONSTRAINT chk_orders_total CHECK (total_amount >= 0),
    CONSTRAINT chk_orders_payment_method CHECK (payment_method IN ('COD', 'BANK_TRANSFER', 'PAYPAL')),
    CONSTRAINT chk_orders_payment_status CHECK (payment_status IN ('PENDING', 'PAID', 'FAILED')),
    CONSTRAINT chk_orders_status CHECK (status IN ('PENDING','CONFIRMED','PREPARING','READY','COMPLETED','CANCELLED'))
);

-- =========================================================
-- 10. ORDER ITEMS  (product_name/variant_name là snapshot lúc mua)
-- =========================================================
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL,
    product_id UUID NOT NULL,
    variant_id UUID,
    product_name VARCHAR(200) NOT NULL,
    variant_name VARCHAR(100),
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(12,2) NOT NULL,
    subtotal NUMERIC(12,2) NOT NULL,
    CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    CONSTRAINT fk_order_items_variant FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL,
    CONSTRAINT chk_order_items_quantity CHECK (quantity > 0),
    CONSTRAINT chk_order_items_unit_price CHECK (unit_price >= 0),
    CONSTRAINT chk_order_items_subtotal CHECK (subtotal >= 0)
);

-- =========================================================
-- 11. ORDER STATUS HISTORY  (timeline theo dõi đơn hàng)
-- =========================================================
CREATE TABLE order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL,
    status VARCHAR(30) NOT NULL,
    changed_by UUID,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_order_status_history_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_order_status_history_user FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_order_status_history_status CHECK (status IN ('PENDING','CONFIRMED','PREPARING','READY','COMPLETED','CANCELLED'))
);

-- =========================================================
-- 12. PAYMENTS  (COD / chuyển khoản giả lập / PayPal giả lập)
-- =========================================================
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL UNIQUE,
    payment_method VARCHAR(30) NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    transaction_id VARCHAR(255),
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT chk_payments_amount CHECK (amount >= 0),
    CONSTRAINT chk_payments_method CHECK (payment_method IN ('COD', 'BANK_TRANSFER', 'PAYPAL')),
    CONSTRAINT chk_payments_status CHECK (status IN ('PENDING', 'PAID', 'FAILED'))
);

-- =========================================================
-- 13. REVIEWS  (bắt buộc đã mua: FK tới đúng order đã đặt)
-- =========================================================
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    product_id UUID NOT NULL,
    order_id UUID NOT NULL,
    rating INTEGER NOT NULL,
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_reviews_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT fk_reviews_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5),
    CONSTRAINT uq_review_user_product_order UNIQUE (user_id, product_id, order_id)
);

-- =========================================================
-- 14. FAVORITES
-- =========================================================
CREATE TABLE favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    product_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_favorites_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_favorites_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT uq_favorite_user_product UNIQUE (user_id, product_id)
);

-- =========================================================
-- 15. NOTIFICATIONS
-- =========================================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(30) NOT NULL DEFAULT 'SYSTEM',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =========================================================
-- 16. TRENDING PRODUCTS
-- Điểm trend_score tự tăng khi có view (chống spam 30p/thiết bị)
-- và khi có đơn hàng mới; admin có thể ghi đè thủ công.
-- =========================================================
CREATE TABLE trending_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL UNIQUE,
    trend_score NUMERIC(10,2) NOT NULL DEFAULT 0,
    rank INTEGER,
    trend_label VARCHAR(30),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_trending_products_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT chk_trending_score CHECK (trend_score >= 0),
    CONSTRAINT chk_trending_rank CHECK (rank IS NULL OR rank > 0),
    CONSTRAINT chk_trending_label CHECK (trend_label IS NULL OR trend_label IN ('MOI_HOT','DANG_HOT','BAN_CHAY','HA_NHIET','AN_MON'))
);

-- =========================================================
-- 17. USER ADDRESSES  (sổ địa chỉ khách hàng)
-- =========================================================
CREATE TABLE user_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    label VARCHAR(50) NOT NULL DEFAULT 'Nhà riêng',
    receiver_name VARCHAR(100) NOT NULL,
    receiver_phone VARCHAR(20) NOT NULL,
    province_code VARCHAR(20) NOT NULL,
    province_name VARCHAR(120) NOT NULL,
    district_code VARCHAR(20) NOT NULL,
    district_name VARCHAR(120) NOT NULL,
    ward_code VARCHAR(20) NOT NULL,
    ward_name VARCHAR(120) NOT NULL,
    street_address TEXT NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_addresses_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =========================================================
-- 18. PASSWORD RESET TOKENS  (quên mật khẩu)
-- =========================================================
CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_password_reset_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =========================================================
-- 19. USER COUPONS  (mã giảm giá khách đã lưu/đã dùng)
-- =========================================================
CREATE TABLE user_coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    coupon_id UUID NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    used_order_id UUID,
    collected_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMPTZ,
    CONSTRAINT fk_user_coupons_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_coupons_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_coupons_order FOREIGN KEY (used_order_id) REFERENCES orders(id) ON DELETE SET NULL,
    CONSTRAINT uq_user_coupon UNIQUE (user_id, coupon_id)
);

-- =========================================================
-- 20. PRODUCT VIEW EVENTS  (chống spam lượt xem, nuôi điểm trend)
-- App logic: trước khi insert, backend kiểm tra event gần nhất
-- trong N phút qua (mặc định 30p) cho cùng (product_id, device_key).
-- Nếu có rồi thì KHÔNG insert thêm, KHÔNG cộng điểm trend.
-- =========================================================
CREATE TABLE product_view_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL,
    user_id UUID,
    device_key VARCHAR(255) NOT NULL,
    viewed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_product_view_events_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT fk_product_view_events_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- =========================================================
-- 20b. CONVERSATIONS + CHAT MESSAGES (chat khách hàng <-> admin)
-- Mỗi khách hàng có đúng 1 hội thoại với shop (giống live-chat hỗ trợ
-- kiểu Shopee/TikTok Shop), real-time qua Socket.IO, lưu lại lịch sử.
-- =========================================================
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    last_message_at TIMESTAMPTZ,
    last_message_preview VARCHAR(200),
    customer_unread_count INTEGER NOT NULL DEFAULT 0,
    admin_unread_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_conversations_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_conversations_status CHECK (status IN ('OPEN', 'CLOSED'))
);

CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL,
    sender_id UUID NOT NULL,
    sender_role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_chat_messages_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    CONSTRAINT fk_chat_messages_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_chat_messages_role CHECK (sender_role IN ('CUSTOMER', 'ADMIN')),
    CONSTRAINT chk_chat_messages_content CHECK (length(trim(content)) > 0)
);

-- =========================================================
-- 20c. EMAIL OTPS (mã xác nhận 6 số qua email: đăng ký + quên mật khẩu)
-- =========================================================
CREATE TABLE email_otps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purpose VARCHAR(30) NOT NULL,
    email VARCHAR(255) NOT NULL,
    code_hash TEXT NOT NULL,
    payload JSONB,
    attempts INTEGER NOT NULL DEFAULT 0,
    send_count INTEGER NOT NULL DEFAULT 1,
    last_sent_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_email_otps_purpose CHECK (purpose IN ('REGISTER', 'RESET_PASSWORD'))
);
CREATE UNIQUE INDEX uq_email_otps_active ON email_otps (purpose, email) WHERE consumed_at IS NULL;
CREATE INDEX idx_email_otps_expires ON email_otps (expires_at);

-- =========================================================
-- 21. INDEXES
-- =========================================================
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_available ON products(is_available);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_product_variants_product ON product_variants(product_id);
CREATE INDEX idx_product_variants_available ON product_variants(is_available);
CREATE INDEX idx_product_variants_stock ON product_variants(stock_quantity);
CREATE INDEX idx_product_images_product ON product_images(product_id);
CREATE INDEX idx_product_images_sort ON product_images(product_id, sort_order);
CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);
CREATE INDEX idx_cart_items_variant ON cart_items(variant_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_coupon ON orders(coupon_id);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
CREATE INDEX idx_order_items_variant ON order_items(variant_id);
CREATE INDEX idx_order_status_history_order ON order_status_history(order_id);
CREATE INDEX idx_order_status_history_created ON order_status_history(created_at DESC);
CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);
CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_favorites_product ON favorites(product_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read);
CREATE INDEX idx_trending_products_score ON trending_products(trend_score DESC);
CREATE INDEX idx_trending_products_active ON trending_products(is_active);
CREATE INDEX idx_user_addresses_user ON user_addresses(user_id);
CREATE INDEX idx_password_reset_tokens_user ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_expires ON password_reset_tokens(expires_at);
CREATE INDEX idx_user_coupons_user ON user_coupons(user_id);
CREATE INDEX idx_product_view_events_lookup ON product_view_events(product_id, device_key, viewed_at DESC);
CREATE INDEX idx_product_view_events_product ON product_view_events(product_id);
CREATE INDEX idx_chat_messages_conversation ON chat_messages(conversation_id, created_at);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC);

-- =========================================================
-- 22. UPDATED_AT TRIGGER
-- =========================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_product_variants_updated_at BEFORE UPDATE ON product_variants FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_carts_updated_at BEFORE UPDATE ON carts FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_cart_items_updated_at BEFORE UPDATE ON cart_items FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_user_addresses_updated_at BEFORE UPDATE ON user_addresses FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =========================================================
-- 23. VIEW: BEST SELLING PRODUCTS (bán chạy theo lượt mua thật)
-- =========================================================
CREATE OR REPLACE VIEW best_selling_products AS
SELECT
    p.id AS product_id,
    p.name,
    p.slug,
    p.category_id,
    COALESCE(SUM(oi.quantity) FILTER (WHERE o.status <> 'CANCELLED'), 0) AS total_sold,
    COUNT(DISTINCT oi.order_id) FILTER (WHERE o.status <> 'CANCELLED') AS order_count
FROM products p
LEFT JOIN order_items oi ON oi.product_id = p.id
LEFT JOIN orders o ON o.id = oi.order_id
GROUP BY p.id, p.name, p.slug, p.category_id
ORDER BY total_sold DESC;

-- =========================================================
-- 24. VIEW: PRODUCT TREND METRICS (báo cáo view/trend gộp — tham khảo)
-- =========================================================
CREATE OR REPLACE VIEW product_trend_metrics AS
SELECT
    p.id AS product_id,
    p.name,
    p.slug,
    COUNT(pve.id) FILTER (WHERE pve.viewed_at > CURRENT_TIMESTAMP - INTERVAL '24 hours') AS views_24h,
    COUNT(pve.id) FILTER (WHERE pve.viewed_at > CURRENT_TIMESTAMP - INTERVAL '7 days') AS views_7d,
    COALESCE(tp.trend_score, 0) AS trend_score,
    tp.trend_label,
    tp.rank,
    tp.is_active AS trend_is_active
FROM products p
LEFT JOIN product_view_events pve ON pve.product_id = p.id
LEFT JOIN trending_products tp ON tp.product_id = p.id
GROUP BY p.id, p.name, p.slug, tp.trend_score, tp.trend_label, tp.rank, tp.is_active;

-- =========================================================
-- 25. COMMENTS
-- =========================================================
COMMENT ON TABLE products IS 'Thông tin chung của 1 món ăn/thức uống.';
COMMENT ON TABLE product_variants IS 'Biến thể có thể bán: size, khối lượng, phần, combo...';
COMMENT ON TABLE trending_products IS 'Sản phẩm đang được đánh dấu là trending.';
COMMENT ON COLUMN order_items.product_name IS 'Snapshot tên sản phẩm tại thời điểm đặt hàng.';
COMMENT ON COLUMN order_items.variant_name IS 'Snapshot tên biến thể tại thời điểm đặt hàng.';
COMMENT ON COLUMN order_items.unit_price IS 'Giá bán thực tế tại thời điểm đặt hàng.';
COMMENT ON TABLE conversations IS 'Mỗi khách hàng có đúng 1 hội thoại chat với shop (admin).';
COMMENT ON TABLE chat_messages IS 'Tin nhắn trong 1 hội thoại, gửi bởi CUSTOMER hoặc ADMIN.';
COMMENT ON TABLE email_otps IS 'Mã xác nhận 6 số gửi qua email: đăng ký tài khoản & quên mật khẩu.';

-- =========================================================
-- DONE
-- =========================================================


```sql
-- Đồng bộ bảng user_addresses với địa giới hành chính mới.
-- Giữ lại 2 cột quận/huyện để tương thích dữ liệu cũ.
-- Không xóa dữ liệu hiện có.

ALTER TABLE user_addresses
    ALTER COLUMN district_code DROP NOT NULL,
    ALTER COLUMN district_name DROP NOT NULL;
```