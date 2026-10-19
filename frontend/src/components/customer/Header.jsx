import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { formatMoney } from '../common/Money';
import { SearchIcon, CartIcon, UserIcon } from '../common/Icons';
import TopBar from './TopBar';
import MainNav from './MainNav';
import '../../styles/header.css';

export default function Header() {
  const [q, setQ] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();

  // Đóng menu tài khoản khi bấm ra ngoài
  useEffect(() => {
    const onClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const submitSearch = (e) => {
    e.preventDefault();
    navigate(q.trim() ? `/san-pham?q=${encodeURIComponent(q.trim())}` : '/san-pham');
  };

  const closeAnd = (fn) => () => { setMenuOpen(false); if (fn) fn(); };
  const lastName = user ? user.full_name.split(' ').slice(-1)[0] : '';

  return (
    <>
      <TopBar />

      <header className="hd-sticky">
        <div className="container hd-main">
          <Link to="/" className="hd-logo" aria-label="FoodTrend - Trang chủ">
            <span className="hd-logo-mark">🌶️</span>
            <span className="hd-logo-text">Food<span>Trend</span></span>
          </Link>

          <form className="hd-search" onSubmit={submitSearch} role="search">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm kiếm món ăn vặt hot trend..."
              aria-label="Tìm kiếm sản phẩm"
            />
            <button type="submit" aria-label="Tìm kiếm"><SearchIcon size={20} /></button>
          </form>

          <div className="hd-right">
            {user ? (
              <div className="hd-account hd-auth" ref={menuRef}>
                <button className="hd-auth-btn" onClick={() => setMenuOpen((o) => !o)} aria-haspopup="menu" aria-expanded={menuOpen}>
                  <UserIcon size={20} />
                  <span className="hd-auth-text">{lastName}</span>
                </button>
                {menuOpen && (
                  <div className="card hd-account-menu" role="menu">
                    <Link to="/tai-khoan" onClick={closeAnd()}>Thông tin tài khoản</Link>
                    <Link to="/tai-khoan/don-hang" onClick={closeAnd()}>Đơn hàng của tôi</Link>
                    <Link to="/tai-khoan/yeu-thich" onClick={closeAnd()}>Sản phẩm yêu thích</Link>
                    <Link to="/tai-khoan/ma-giam-gia" onClick={closeAnd()}>Mã giảm giá</Link>
                    {user.role === 'ADMIN' && <Link to="/admin" onClick={closeAnd()}>Trang quản trị</Link>}
                    <hr />
                    <button className="is-danger" onClick={closeAnd(() => { logout(); navigate('/'); })}>Đăng xuất</button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hd-auth">
                <Link to="/dang-nhap" className="hd-auth-icon" aria-label="Đăng nhập"><UserIcon size={22} /></Link>
                <span className="hd-auth-text">
                  <Link to="/dang-nhap">Đăng nhập</Link>
                  <span className="hd-auth-sep">/</span>
                  <Link to="/dang-ky">Đăng ký</Link>
                </span>
              </div>
            )}

            <span className="hd-divider" aria-hidden="true" />

            <Link to="/gio-hang" className="hd-cart" aria-label={`Giỏ hàng, ${cart.item_count} sản phẩm`}>
              <span className="hd-cart-label">Giỏ hàng /</span>
              <span>{formatMoney(cart.subtotal)}</span>
              <CartIcon size={20} />
              {cart.item_count > 0 && <span className="hd-cart-badge">{cart.item_count}</span>}
            </Link>
          </div>
        </div>

        <MainNav />
      </header>
    </>
  );
}
