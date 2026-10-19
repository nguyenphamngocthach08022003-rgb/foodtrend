const { Server } = require('socket.io');
const { verifyAccessToken } = require('../utils/jwt');
const env = require('../config/env');
const chatService = require('../modules/chat/chat.service');
const { setIO } = require('./io');

const ADMIN_ROOM = 'admins';
const conversationRoom = (id) => `conversation:${id}`;

function initChatSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: env.clientUrl, credentials: true },
  });

  // Xác thực mỗi kết nối socket bằng JWT access token (giống middleware requireAuth ở REST)
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('UNAUTHORIZED'));
    try {
      const payload = verifyAccessToken(token);
      socket.user = payload; // { id, role, phone }
      return next();
    } catch (err) {
      return next(new Error('UNAUTHORIZED'));
    }
  });

  io.on('connection', async (socket) => {
    const { id: userId, role } = socket.user;

    // Khởi tạo kết nối chat. Nếu DB lỗi (vd chưa chạy migration chat_feature.sql) thì CHỈ ngắt
    // kết nối chat của socket này — tuyệt đối không để lỗi bất đồng bộ làm sập cả server.
    try {
      if (role === 'ADMIN') {
        socket.join(ADMIN_ROOM);
      } else {
        // Khách hàng: tự động vào đúng room hội thoại của mình
        const conversation = await chatService.getOrCreateConversation(userId);
        socket.conversationId = conversation.id;
        socket.join(conversationRoom(conversation.id));
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`[chat] Không khởi tạo được chat cho user ${userId}: ${err.message}`);
      if (err.code === '42P01') {
        // eslint-disable-next-line no-console
        console.error('[chat] -> Thiếu bảng chat. Hãy chạy migrations/chat_feature.sql trên database rồi khởi động lại.');
      }
      socket.emit('chat:error', { message: 'Chat tạm thời không khả dụng.' });
      socket.disconnect(true);
      return;
    }

    // Khách hàng gửi tin nhắn
    socket.on('chat:send', async ({ content } = {}, ack) => {
      try {
        if (role !== 'CUSTOMER') throw new Error('Chỉ khách hàng dùng sự kiện này.');
        const { message, conversation } = await chatService.addMessage({
          conversationId: socket.conversationId,
          senderId: userId,
          senderRole: 'CUSTOMER',
          content,
        });
        io.to(conversationRoom(conversation.id)).emit('chat:message', message);
        io.to(ADMIN_ROOM).emit('chat:conversation_updated', conversation);
        if (typeof ack === 'function') ack({ ok: true, message });
      } catch (err) {
        if (typeof ack === 'function') ack({ ok: false, error: err.message });
      }
    });

    // Admin mở 1 hội thoại cụ thể để xem/trả lời
    socket.on('admin:join_conversation', async ({ conversationId } = {}, ack) => {
      try {
        if (role !== 'ADMIN') throw new Error('Chỉ admin dùng sự kiện này.');
        socket.join(conversationRoom(conversationId));
        await chatService.markRead(conversationId, 'ADMIN');
        io.to(ADMIN_ROOM).emit('chat:unread_cleared', { conversationId });
        if (typeof ack === 'function') ack({ ok: true });
      } catch (err) {
        if (typeof ack === 'function') ack({ ok: false, error: err.message });
      }
    });

    // Admin trả lời 1 hội thoại
    socket.on('admin:send', async ({ conversationId, content } = {}, ack) => {
      try {
        if (role !== 'ADMIN') throw new Error('Chỉ admin dùng sự kiện này.');
        const { message, conversation } = await chatService.addMessage({
          conversationId,
          senderId: userId,
          senderRole: 'ADMIN',
          content,
        });
        io.to(conversationRoom(conversationId)).emit('chat:message', message);
        io.to(ADMIN_ROOM).emit('chat:conversation_updated', conversation);
        if (typeof ack === 'function') ack({ ok: true, message });
      } catch (err) {
        if (typeof ack === 'function') ack({ ok: false, error: err.message });
      }
    });

    // Báo đang gõ (tuỳ chọn, chỉ phát lại trong room, không lưu DB)
    socket.on('chat:typing', ({ conversationId } = {}) => {
      const room = role === 'ADMIN' ? conversationRoom(conversationId) : conversationRoom(socket.conversationId);
      socket.to(room).emit('chat:typing', { role });
    });
  });

  setIO(io);
  return io;
}

module.exports = { initChatSocket };
