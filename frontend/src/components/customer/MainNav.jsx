import { useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { getCategories } from '../../api/categories.api';
import { ChevronDown } from '../common/Icons';

// Thanh menu gọn: các danh mục được gom vào menu xổ xuống "Cửa hàng"
export default function MainNav() {
  const [categories, setCategories] = useState([]);
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const sort = params.get('sort') || '';

  useEffect(() => {
    getCategories().then(({ data }) => setCategories(data.data)).catch(() => {});
  }, []);

  const inShop = pathname.startsWith('/san-pham');
  const active = {
    home: pathname === '/',
    hot: pathname === '/san-pham' && sort === 'trending',
    best: pathname === '/san-pham' && sort === 'best_selling',
    shop: inShop && sort !== 'trending' && sort !== 'best_selling',
    coupons: pathname.startsWith('/tai-khoan/ma-giam-gia'),
  };
  const cls = (isActive) => `hd-nav-link${isActive ? ' is-active' : ''}`;

  return (
    <nav className="hd-nav" aria-label="Menu chính">
      <ul className="container hd-nav-list">
        <li><Link to="/" className={cls(active.home)}>Trang chủ</Link></li>

        <li className="hd-nav-dropdown">
          <Link to="/san-pham" className={cls(active.shop)}>
            Cửa hàng <ChevronDown size={14} className="hd-chevron" />
          </Link>
          <div className="hd-dropdown">
            <Link to="/san-pham" className="hd-dropdown-all">Tất cả sản phẩm</Link>
            {categories.map((c) => (
              <Link key={c.id} to={`/san-pham?category=${c.slug}`}>{c.name}</Link>
            ))}
          </div>
        </li>

        <li><Link to="/san-pham?sort=trending" className={cls(active.hot)}>🔥 Đang hot</Link></li>
        <li><Link to="/san-pham?sort=best_selling" className={cls(active.best)}>Bán chạy</Link></li>
        <li><Link to="/tai-khoan/ma-giam-gia" className={cls(active.coupons)}>Mã giảm giá</Link></li>
      </ul>
    </nav>
  );
}
