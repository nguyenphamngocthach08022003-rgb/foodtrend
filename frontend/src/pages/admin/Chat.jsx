import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { adminGetConversations, adminGetConversation } from '../../api/chat.api';
import '../../styles/chat.css';

const STATUS_LABEL = { OPEN: 'Đang mở', CLOSED: 'Đã đóng' };

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  return sameDay
    ? d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

export default function AdminChat() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);
  const activeIdRef = useRef(null); // tránh closure cũ trong socket listener

  const loadConversations = useCallback(() => {
    adminGetConversations({ limit: 50 }).then(({ data }) => setConversations(data.data)).catch(() => {});
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // Realtime: cập nhật danh sách (preview, thời gian, unread, thứ tự) khi có tin nhắn bất kỳ
  useEffect(() => {
    if (!socket) return undefined;

    const onConversationUpdated = (conv) => {
      setConversations((prev) => {
        const others = prev.filter((c) => c.id !== conv.id);
        const existing = prev.find((c) => c.id === conv.id);
        const merged = { ...existing, ...conv };
        // Nếu đang mở đúng hội thoại này thì coi như đã đọc ngay (không hiện badge)
        if (activeIdRef.current === conv.id) merged.admin_unread_count = 0;
        return [merged, ...others];
      });
    };

    const onMessage = (msg) => {
      if (activeIdRef.current === msg.conversation_id) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    socket.on('chat:conversation_updated', onConversationUpdated);
    socket.on('chat:message', onMessage);
    return () => {
      socket.off('chat:conversation_updated', onConversationUpdated);
      socket.off('chat:message', onMessage);
    };
  }, [socket]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  const openConversation = (id) => {
    setActiveId(id);
    activeIdRef.current = id;
    setMessages([]);
    adminGetConversation(id).then(({ data }) => {
      setActiveConv(data.data.conversation);
      setMessages(data.data.messages);
    });
    if (socket) socket.emit('admin:join_conversation', { conversationId: id });
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, admin_unread_count: 0 } : c)));
  };

  const sendMessage = (e) => {
    e.preventDefault();
    const content = draft.trim();
    if (!content || !socket || !activeId || sending) return;
    setSending(true);
    socket.emit('admin:send', { conversationId: activeId, content }, (res) => {
      setSending(false);
      if (res?.ok) setDraft('');
    });
  };

  return (
    <div className="ac-layout">
      <aside className="ac-list">
        {conversations.length === 0 && (
          <div style={{ padding: 20, color: 'var(--color-ink-soft)', fontSize: 13.5 }}>Chưa có hội thoại nào.</div>
        )}
        {conversations.map((c) => (
          <div
            key={c.id}
            className={`ac-list-item${activeId === c.id ? ' is-active' : ''}`}
            onClick={() => openConversation(c.id)}
          >
            <div className="ac-list-item-top">
              <span className="ac-list-name">{c.full_name}</span>
              <span className="ac-list-time">{formatTime(c.last_message_at)}</span>
            </div>
            <div className="flex items-center justify-between gap-8">
              <span className="ac-list-preview">{c.last_message_preview || 'Chưa có tin nhắn'}</span>
              {c.admin_unread_count > 0 && <span className="ac-unread-badge">{c.admin_unread_count}</span>}
            </div>
          </div>
        ))}
      </aside>

      <section className="ac-chat">
        {!activeId ? (
          <div className="ac-empty-state">Chọn một hội thoại bên trái để bắt đầu trả lời khách.</div>
        ) : (
          <>
            <div className="ac-chat-header">
              <strong>{activeConv?.full_name}</strong>
              <div className="ac-sub">
                {activeConv?.phone} {activeConv?.email ? `· ${activeConv.email}` : ''} · {STATUS_LABEL[activeConv?.status] || ''}
              </div>
            </div>

            <div className="ac-chat-messages" ref={listRef}>
              {messages.map((m) => (
                <div key={m.id} className={`cw-bubble-row ${m.sender_role === 'ADMIN' ? 'is-mine' : ''}`}>
                  <div className="cw-bubble">
                    {m.content}
                    <span className="cw-time">{formatTime(m.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>

            <form className="ac-chat-input" onSubmit={sendMessage}>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Nhập trả lời cho khách..."
                maxLength={2000}
              />
              <button type="submit" className="btn btn-primary" disabled={!draft.trim() || sending}>Gửi</button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
