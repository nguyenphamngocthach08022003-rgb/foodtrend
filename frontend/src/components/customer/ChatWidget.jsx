import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { getMyConversation } from '../../api/chat.api';
import '../../styles/chat.css';

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

// Chống trùng: tin nhắn có thể vừa nằm trong lịch sử vừa đến qua socket
function appendUnique(list, msg) {
  return list.some((m) => m.id === msg.id) ? list : [...list, msg];
}

/**
 * Nút chat nổi — LUÔN hiện trên mọi trang khách hàng, panel đổi theo trạng thái:
 *  - chưa đăng nhập : mời đăng nhập / đăng ký
 *  - tài khoản admin : hướng dẫn sang trang Quản trị > Chat (admin không chat kiểu khách)
 *  - khách hàng     : khung chat thật (real-time qua Socket.IO)
 */
export default function ChatWidget() {
  const { user } = useAuth();
  const { socket, connected } = useSocket();
  const isAdmin = Boolean(user) && user.role === 'ADMIN';
  const isCustomer = Boolean(user) && !isAdmin;

  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | loading | ready | error
  const [messages, setMessages] = useState([]);
  const [unread, setUnread] = useState(0);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);
  const openRef = useRef(false);
  openRef.current = open;

  // Đổi tài khoản (đăng nhập / đăng xuất) -> xoá sạch trạng thái chat của người trước
  useEffect(() => {
    setMessages([]);
    setStatus('idle');
    setUnread(0);
    setDraft('');
  }, [user?.id]);

  // Tải lịch sử hội thoại của khách
  useEffect(() => {
    if (!isCustomer || status !== 'idle') return;
    setStatus('loading');
    getMyConversation()
      .then(({ data }) => {
        setMessages((prev) => data.data.messages.reduce(appendUnique, prev));
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, [isCustomer, status]);

  // Nhận tin nhắn real-time (kể cả khi panel đang đóng -> tăng badge)
  useEffect(() => {
    if (!socket || !isCustomer) return undefined;
    const onMessage = (msg) => {
      setMessages((prev) => appendUnique(prev, msg));
      if (msg.sender_role === 'ADMIN' && !openRef.current) setUnread((n) => n + 1);
    };
    const onChatError = () => setStatus('error');
    socket.on('chat:message', onMessage);
    socket.on('chat:error', onChatError);
    return () => {
      socket.off('chat:message', onMessage);
      socket.off('chat:error', onChatError);
    };
  }, [socket, isCustomer]);

  // Tự cuộn xuống tin mới nhất
  useEffect(() => {
    if (open && listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, open, status]);

  const togglePanel = () => {
    setOpen((o) => !o);
    setUnread(0);
  };

  const sendMessage = (e) => {
    e.preventDefault();
    const content = draft.trim();
    if (!content || !socket || sending) return;
    setSending(true);
    socket.emit('chat:send', { content }, (res) => {
      setSending(false);
      if (res && res.ok) setDraft('');
    });
  };

  const subtitle = isCustomer
    ? (connected ? '🟢 Đang trực tuyến' : '⚪ Đang kết nối lại...')
    : 'Hỗ trợ đặt món & đơn hàng';

  return (
    <div className="cw-root">
      {open && (
        <div className="cw-panel card" role="dialog" aria-label="Chat với FoodTrend">
          <div className="cw-header">
            <div>
              <strong>Chat với FoodTrend</strong>
              <div className="cw-status">{subtitle}</div>
            </div>
            <button className="cw-close" onClick={togglePanel} aria-label="Đóng chat">✕</button>
          </div>

          {/* --- CHƯA ĐĂNG NHẬP --- */}
          {!user && (
            <div className="cw-notice">
              <div className="cw-notice-emoji">💬</div>
              <h4>Đăng nhập để chat với shop</h4>
              <p>Hỏi món, tình trạng đơn hàng hay mã giảm giá — shop trả lời ngay tại đây.</p>
              <div className="cw-notice-actions">
                <Link to="/dang-nhap" className="btn btn-primary btn-sm" onClick={() => setOpen(false)}>Đăng nhập</Link>
                <Link to="/dang-ky" className="btn btn-outline btn-sm" onClick={() => setOpen(false)}>Đăng ký</Link>
              </div>
            </div>
          )}

          {/* --- TÀI KHOẢN ADMIN --- */}
          {isAdmin && (
            <div className="cw-notice">
              <div className="cw-notice-emoji">🛠️</div>
              <h4>Bạn đang đăng nhập bằng tài khoản quản trị</h4>
              <p>
                Tài khoản admin không chat kiểu khách. Để trả lời khách hàng, hãy vào mục Chat trong trang Quản trị.
                Muốn thử với vai trò khách, dùng một trình duyệt khác hoặc cửa sổ ẩn danh để đăng nhập tài khoản khách.
              </p>
              <div className="cw-notice-actions">
                <Link to="/admin/chat" className="btn btn-primary btn-sm" onClick={() => setOpen(false)}>Mở hộp thư Chat</Link>
              </div>
            </div>
          )}

          {/* --- KHÁCH HÀNG --- */}
          {isCustomer && status === 'error' && (
            <div className="cw-notice">
              <div className="cw-notice-emoji">😵</div>
              <h4>Chat tạm thời chưa dùng được</h4>
              <p>Không tải được cuộc trò chuyện. Bạn thử lại sau ít phút nhé.</p>
              <div className="cw-notice-actions">
                <button className="btn btn-primary btn-sm" onClick={() => setStatus('idle')}>Thử lại</button>
              </div>
            </div>
          )}

          {isCustomer && status !== 'error' && (
            <>
              <div className="cw-messages" ref={listRef}>
                {status !== 'ready' && <div className="cw-empty">Đang tải lịch sử trò chuyện...</div>}
                {status === 'ready' && messages.length === 0 && (
                  <div className="cw-empty">👋 Chào bạn! Nhắn gì đó cho shop nhé.</div>
                )}
                {messages.map((m) => (
                  <div key={m.id} className={`cw-bubble-row ${m.sender_role === 'CUSTOMER' ? 'is-mine' : ''}`}>
                    <div className="cw-bubble">
                      {m.content}
                      <span className="cw-time">{formatTime(m.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <form className="cw-input-row" onSubmit={sendMessage}>
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Nhập tin nhắn..."
                  maxLength={2000}
                  aria-label="Nội dung tin nhắn"
                />
                <button type="submit" className="btn btn-primary btn-sm" disabled={!draft.trim() || sending || !socket}>Gửi</button>
              </form>
            </>
          )}
        </div>
      )}

      <button className="cw-fab" onClick={togglePanel} aria-label="Mở chat với shop">
        {open ? '✕' : '💬'}
        {!open && unread > 0 && <span className="cw-fab-badge">{unread}</span>}
      </button>
    </div>
  );
}
