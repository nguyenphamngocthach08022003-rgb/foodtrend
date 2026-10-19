-- =========================================================
-- EMAIL VERIFICATION — mã xác nhận 6 số qua email (migration BỔ SUNG)
-- CHẠY AN TOÀN trên DB đang có data: không DROP, không sửa bảng nào có sẵn.
--
-- Dùng cho 2 việc:
--   REGISTER        : xác nhận email khi đăng ký (tài khoản CHỈ được tạo sau khi nhập đúng mã)
--   RESET_PASSWORD  : lấy lại mật khẩu qua email
-- Mã được lưu dạng BĂM (không lưu mã thô), có hạn dùng, giới hạn số lần nhập sai.
-- =========================================================
CREATE TABLE IF NOT EXISTS email_otps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purpose VARCHAR(30) NOT NULL,
    email VARCHAR(255) NOT NULL,            -- luôn lưu chữ thường
    code_hash TEXT NOT NULL,
    payload JSONB,                          -- REGISTER: thông tin đăng ký chờ xác nhận (mật khẩu đã băm)
    attempts INTEGER NOT NULL DEFAULT 0,    -- số lần nhập sai
    send_count INTEGER NOT NULL DEFAULT 1,  -- số lần đã gửi mã (chống spam)
    last_sent_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ,                -- đã dùng xong hoặc bị vô hiệu hoá
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_email_otps_purpose CHECK (purpose IN ('REGISTER', 'RESET_PASSWORD'))
);

-- Mỗi (mục đích, email) chỉ có đúng 1 mã đang hoạt động
CREATE UNIQUE INDEX IF NOT EXISTS uq_email_otps_active
    ON email_otps (purpose, email) WHERE consumed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_email_otps_expires ON email_otps (expires_at);

COMMENT ON TABLE email_otps IS 'Mã xác nhận 6 số gửi qua email: đăng ký tài khoản & quên mật khẩu.';
