const { query, withTransaction } = require('../../config/db');
const AppError = require('../../utils/AppError');

const PREVIEW_LENGTH = 120;

function truncate(text) {
  if (!text) return '';
  return text.length > PREVIEW_LENGTH ? `${text.slice(0, PREVIEW_LENGTH)}…` : text;
}

async function getOrCreateConversation(userId) {
  const existing = await query('SELECT * FROM conversations WHERE user_id = $1', [userId]);
  if (existing.rows[0]) return existing.rows[0];

  const created = await query(
    `INSERT INTO conversations (user_id, status) VALUES ($1, 'OPEN') RETURNING *`,
    [userId]
  );
  return created.rows[0];
}

async function getMessages(conversationId, { before, limit } = {}) {
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 30));
  const params = [conversationId];
  let cursorClause = '';
  if (before) {
    params.push(before);
    cursorClause = `AND created_at < $${params.length}`;
  }
  params.push(limitNum);

  const res = await query(
    `SELECT * FROM chat_messages
     WHERE conversation_id = $1 ${cursorClause}
     ORDER BY created_at DESC
     LIMIT $${params.length}`,
    params
  );
  return res.rows.reverse(); // trả về theo thứ tự cũ -> mới để render thẳng lên UI
}

// senderRole: 'CUSTOMER' | 'ADMIN'
async function addMessage({ conversationId, senderId, senderRole, content }) {
  const trimmed = (content || '').trim();
  if (!trimmed) throw new AppError('Nội dung tin nhắn không được để trống.', 400);
  if (trimmed.length > 2000) throw new AppError('Tin nhắn quá dài (tối đa 2000 ký tự).', 400);

  return withTransaction(async (client) => {
    const msgRes = await client.query(
      `INSERT INTO chat_messages (conversation_id, sender_id, sender_role, content)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [conversationId, senderId, senderRole, trimmed]
    );
    const message = msgRes.rows[0];

    // Tin nhắn của bên nào gửi thì tăng unread của bên CÒN LẠI
    const unreadColumn = senderRole === 'CUSTOMER' ? 'admin_unread_count' : 'customer_unread_count';
    const convRes = await client.query(
      `UPDATE conversations SET
         last_message_at = CURRENT_TIMESTAMP,
         last_message_preview = $1,
         ${unreadColumn} = ${unreadColumn} + 1,
         status = 'OPEN'
       WHERE id = $2 RETURNING *`,
      [truncate(trimmed), conversationId]
    );

    return { message, conversation: convRes.rows[0] };
  });
}

async function markRead(conversationId, viewerRole) {
  const column = viewerRole === 'ADMIN' ? 'admin_unread_count' : 'customer_unread_count';
  const res = await query(
    `UPDATE conversations SET ${column} = 0 WHERE id = $1 RETURNING *`,
    [conversationId]
  );
  if (!res.rows[0]) throw new AppError('Không tìm thấy hội thoại.', 404);
  return res.rows[0];
}

async function getConversationById(conversationId) {
  const res = await query('SELECT * FROM conversations WHERE id = $1', [conversationId]);
  if (!res.rows[0]) throw new AppError('Không tìm thấy hội thoại.', 404);
  return res.rows[0];
}

// ---- Khách hàng: hội thoại của chính mình kèm lịch sử, tự đánh dấu đã đọc ----
async function getMyConversation(userId) {
  const conversation = await getOrCreateConversation(userId);
  const messages = await getMessages(conversation.id, { limit: 50 });
  await markRead(conversation.id, 'CUSTOMER');
  return { conversation: { ...conversation, customer_unread_count: 0 }, messages };
}

// ---- Admin: danh sách toàn bộ hội thoại, mới nhất lên đầu ----
async function adminListConversations({ page, limit, status }) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 30));
  const offset = (pageNum - 1) * limitNum;

  const conditions = ['1=1'];
  const params = [];
  if (status) {
    params.push(status);
    conditions.push(`c.status = $${params.length}`);
  }
  params.push(limitNum);
  const limitIdx = params.length;
  params.push(offset);
  const offsetIdx = params.length;

  const res = await query(
    `SELECT c.*, u.full_name, u.phone, u.email, COUNT(*) OVER() AS total_count
     FROM conversations c
     JOIN users u ON u.id = c.user_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC
     LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
    params
  );
  const totalCount = res.rows[0] ? Number(res.rows[0].total_count) : 0;
  const items = res.rows.map(({ total_count, ...rest }) => rest);
  return {
    items,
    pagination: { page: pageNum, limit: limitNum, total: totalCount, totalPages: Math.max(1, Math.ceil(totalCount / limitNum)) },
  };
}

async function adminGetConversation(conversationId) {
  const res = await query(
    `SELECT c.*, u.full_name, u.phone, u.email FROM conversations c JOIN users u ON u.id = c.user_id WHERE c.id = $1`,
    [conversationId]
  );
  if (!res.rows[0]) throw new AppError('Không tìm thấy hội thoại.', 404);
  const messages = await getMessages(conversationId, { limit: 50 });
  await markRead(conversationId, 'ADMIN');
  return { conversation: { ...res.rows[0], admin_unread_count: 0 }, messages };
}

async function adminTotalUnread() {
  const res = await query('SELECT COALESCE(SUM(admin_unread_count), 0) AS total FROM conversations');
  return Number(res.rows[0].total);
}

module.exports = {
  getOrCreateConversation,
  getMessages,
  addMessage,
  markRead,
  getConversationById,
  getMyConversation,
  adminListConversations,
  adminGetConversation,
  adminTotalUnread,
};
