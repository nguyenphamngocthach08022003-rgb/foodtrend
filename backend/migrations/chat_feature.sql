-- =========================================================
-- CHAT FEATURE — migration bổ sung (CHẠY AN TOÀN trên DB đang có data)
-- Không DROP gì cả, chỉ thêm 2 bảng mới cho chat khách hàng <-> admin.
-- =========================================================

-- Mỗi khách hàng có đúng 1 cuộc hội thoại với shop (giống kiểu live-chat
-- hỗ trợ của Shopee/TikTok Shop — không phải nhiều ticket riêng lẻ).
CREATE TABLE IF NOT EXISTS conversations (
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

CREATE TABLE IF NOT EXISTS chat_messages (
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

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);

-- Trigger updated_at (tái dùng function set_updated_at() đã có sẵn trong schema.sql)
DROP TRIGGER IF EXISTS trg_conversations_updated_at ON conversations;
CREATE TRIGGER trg_conversations_updated_at
BEFORE UPDATE ON conversations
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE conversations IS 'Mỗi khách hàng có đúng 1 hội thoại chat với shop (admin).';
COMMENT ON TABLE chat_messages IS 'Tin nhắn trong 1 hội thoại, gửi bởi CUSTOMER hoặc ADMIN.';
