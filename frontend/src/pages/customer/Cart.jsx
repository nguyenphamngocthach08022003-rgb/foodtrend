import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { formatMoney } from '../../components/common/Money';

export default function Cart() {
  const { cart, updateItem, removeItem, refreshCart } = useCart();
  const navigate = useNavigate();

  if (cart.items.length === 0) {
    return (
      <div className="container empty-state">
        <div style={{ fontSize: 48, marginBottom: 12 }}>🛒</div>
        <h3>Giỏ hàng của bạn đang trống</h3>
        <p>Khám phá các món ăn vặt đang hot trend nhé!</p>
        <Link to="/san-pham" className="btn btn-primary">Mua sắm ngay</Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '32px 20px 60px', display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32 }}>
      <div>
        <h2 style={{ marginBottom: 20 }}>Giỏ hàng ({cart.item_count} sản phẩm)</h2>
        <div className="flex-col gap-12">
          {cart.items.map((item) => (
            <div key={item.cart_item_id} className="card flex items-center gap-16" style={{ padding: 14 }}>
              <img src={item.thumbnail} alt={item.product_name} style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 10 }} />
              <div style={{ flex: 1 }}>
                <Link to={`/san-pham/${item.product_slug}`} style={{ fontWeight: 600 }}>{item.product_name}</Link>
                <div style={{ fontSize: 13, color: 'var(--color-ink-soft)' }}>{item.variant_name}</div>
                <strong style={{ color: 'var(--color-primary)' }}>{formatMoney(item.unit_price)}</strong>
              </div>
              <div className="flex items-center gap-8">
                <button className="btn btn-outline btn-sm" onClick={() => updateItem(item.cart_item_id, Math.max(1, item.quantity - 1))}>−</button>
                <span style={{ minWidth: 20, textAlign: 'center' }}>{item.quantity}</span>
                <button className="btn btn-outline btn-sm" onClick={() => updateItem(item.cart_item_id, item.quantity + 1)}>+</button>
              </div>
              <strong style={{ minWidth: 90, textAlign: 'right' }}>{formatMoney(item.line_total)}</strong>
              <button className="btn-ghost" onClick={() => removeItem(item.cart_item_id)} aria-label="Xoá">✕</button>
            </div>
          ))}
        </div>
      </div>

      <aside className="card" style={{ padding: 20, alignSelf: 'start' }}>
        <h3 style={{ marginBottom: 16 }}>Tổng tiền</h3>
        <div className="flex justify-between" style={{ marginBottom: 8 }}>
          <span>Tạm tính</span><strong>{formatMoney(cart.subtotal)}</strong>
        </div>
        <p style={{ fontSize: 13, marginBottom: 16 }}>Phí giao hàng và mã giảm giá sẽ được tính ở bước thanh toán.</p>
        <button className="btn btn-primary btn-block" onClick={() => navigate('/thanh-toan')}>
          Tiến hành đặt hàng
        </button>
      </aside>
    </div>
  );
}
