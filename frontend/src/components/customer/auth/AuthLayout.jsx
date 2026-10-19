import { Link } from 'react-router-dom';
import '../../../styles/auth.css';

// Các món "bay" lơ lửng ở khung bên trái: vị trí / kích thước / tốc độ khác nhau cho tự nhiên
const FLOATERS = [
  { e: '🍢', x: '8%', size: 40, dur: 14, delay: 0 },
  { e: '🍗', x: '24%', size: 54, dur: 17, delay: 3 },
  { e: '🥤', x: '42%', size: 44, dur: 15, delay: 6 },
  { e: '🧆', x: '58%', size: 36, dur: 13, delay: 1.5 },
  { e: '🥭', x: '72%', size: 50, dur: 18, delay: 8 },
  { e: '🍵', x: '86%', size: 42, dur: 16, delay: 4.5 },
  { e: '🌶️', x: '34%', size: 30, dur: 12, delay: 9.5 },
  { e: '🍤', x: '66%', size: 34, dur: 14.5, delay: 11 },
];

const HERO = {
  login: { title: 'Chào mừng bạn quay lại!', sub: 'Đăng nhập để đặt món ăn vặt đang hot, theo dõi đơn hàng và nhận ưu đãi dành riêng cho bạn.' },
  register: { title: 'Gia nhập hội ăn vặt hot trend', sub: 'Tạo tài khoản chỉ mất 1 phút — xác nhận qua email để bảo vệ tài khoản của bạn.' },
  forgot: { title: 'Đừng lo, lấy lại ngay thôi!', sub: 'Chúng mình sẽ gửi mã xác nhận về email đã đăng ký để bạn đặt lại mật khẩu an toàn.' },
};

const PERKS = [
  { icon: '🔥', title: 'Món đang hot mỗi ngày', desc: 'Xếp hạng theo lượt xem & lượt mua thật' },
  { icon: '🎁', title: 'Ưu đãi thành viên mới', desc: 'Mã giảm giá tặng ngay khi đăng ký' },
  { icon: '🛵', title: 'Theo dõi đơn từng bước', desc: 'Từ xác nhận, chuẩn bị đến giao hàng' },
  { icon: '💬', title: 'Chat trực tiếp với shop', desc: 'Hỏi món, hỏi đơn — trả lời ngay' },
];

/**
 * Khung dùng chung cho Đăng nhập / Đăng ký / Quên mật khẩu:
 * trái = nền đỏ + món ăn bay + lợi ích; phải = form. `mode` ∈ login | register | forgot.
 */
export default function AuthLayout({ mode, children }) {
  const hero = HERO[mode] || HERO.login;
  const showTabs = mode === 'login' || mode === 'register';

  return (
    <div className="au-wrap">
      <div className="au-page">
        <aside className="au-hero">
          <div className="au-floaters" aria-hidden="true">
            {FLOATERS.map((f, i) => (
              <span
                key={i}
                className="au-floater"
                style={{ '--x': f.x, '--size': `${f.size}px`, '--dur': `${f.dur}s`, '--delay': `${f.delay}s` }}
              >
                {f.e}
              </span>
            ))}
          </div>

          <div className="au-hero-content">
            <Link to="/" className="au-brand">
              <span className="au-brand-mark">🌶️</span>
              <span>Food<b>Trend</b></span>
            </Link>
            <h1 className="au-hero-title">{hero.title}</h1>
            <p className="au-hero-sub">{hero.sub}</p>

            <ul className="au-perks">
              {PERKS.map((p, i) => (
                <li key={p.title} className="au-perk" style={{ '--i': i }}>
                  <span className="au-perk-icon">{p.icon}</span>
                  <span>
                    <strong>{p.title}</strong>
                    <small>{p.desc}</small>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <section className="au-form-side">
          {showTabs && (
            <div className="au-tabs" role="tablist">
              <Link to="/dang-nhap" role="tab" aria-selected={mode === 'login'} className={`au-tab${mode === 'login' ? ' is-active' : ''}`}>Đăng nhập</Link>
              <Link to="/dang-ky" role="tab" aria-selected={mode === 'register'} className={`au-tab${mode === 'register' ? ' is-active' : ''}`}>Đăng ký</Link>
            </div>
          )}
          {children}
        </section>
      </div>
    </div>
  );
}
