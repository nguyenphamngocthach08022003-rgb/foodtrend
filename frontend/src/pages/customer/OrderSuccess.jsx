import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getOrderById } from '../../api/orders.api';
import { formatMoney } from '../../components/common/Money';

export default function OrderSuccess() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    getOrderById(id).then(({ data }) => setOrder(data.data)).catch(() => {});
  }, [id]);

  if (!order) return <div className="container" style={{ padding: 60 }}>Đang tải...</div>;

  return (
    <div className="container" style={{ padding: '48px 20px 60px', maxWidth: 640, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 30 }}>
        <div style={{ fontSize: 56 }}>🎉</div>
        <h2>Đặt hàng thành công!</h2>
        <p>Mã đơn hàng: <strong>{order.order_code}</strong></p>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <div className="flex justify-between" style={{ marginBottom: 8 }}><span>Người nhận</span><strong>{order.receiver_name} — {order.receiver_phone}</strong></div>
        <div className="flex justify-between" style={{ marginBottom: 8 }}><span>Địa chỉ</span><strong style={{ textAlign: 'right', maxWidth: 300 }}>{order.delivery_address}</strong></div>
        <div className="flex justify-between" style={{ marginBottom: 8 }}><span>Thanh toán</span><strong>{order.payment_method} ({order.payment_status})</strong></div>
        <hr style={{ border: 'none', borderTop: '1px solid var(--color-line-soft)', margin: '10px 0' }} />
        {order.items.map((i) => (
          <div key={i.id} className="flex justify-between" style={{ fontSize: 14, marginBottom: 6 }}>
            <span>{i.product_name} ({i.variant_name}) x{i.quantity}</span><span>{formatMoney(i.subtotal)}</span>
          </div>
        ))}
        <hr style={{ border: 'none', borderTop: '1px solid var(--color-line-soft)', margin: '10px 0' }} />
        <div className="flex justify-between" style={{ fontSize: '1.2rem', fontFamily: 'var(--font-display)' }}>
          <span>Tổng cộng</span><strong style={{ color: 'var(--color-primary)' }}>{formatMoney(order.total_amount)}</strong>
        </div>
      </div>

      <div className="flex gap-12" style={{ justifyContent: 'center' }}>
        <Link to="/tai-khoan/don-hang" className="btn btn-outline">Xem đơn hàng của tôi</Link>
        <Link to="/san-pham" className="btn btn-primary">Tiếp tục mua sắm</Link>
      </div>
    </div>
  );
}
