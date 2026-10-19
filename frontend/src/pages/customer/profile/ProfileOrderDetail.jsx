import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getOrderById } from '../../../api/orders.api';
import { formatMoney } from '../../../components/common/Money';

const STATUS_LABEL = {
  PENDING: 'Chờ xử lý', CONFIRMED: 'Đã xác nhận', PREPARING: 'Đang chuẩn bị',
  READY: 'Sẵn sàng giao', COMPLETED: 'Hoàn thành', CANCELLED: 'Đã huỷ',
};

export default function ProfileOrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => { getOrderById(id).then(({ data }) => setOrder(data.data)); }, [id]);

  if (!order) return <p>Đang tải...</p>;

  return (
    <div>
      <Link to="/tai-khoan/don-hang" style={{ fontSize: 14 }}>← Quay lại danh sách đơn hàng</Link>
      <div className="card" style={{ padding: 20, marginTop: 14 }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
          <h3>Đơn hàng {order.order_code}</h3>
          <span className={`status-pill status-${order.status}`}>{STATUS_LABEL[order.status]}</span>
        </div>

        {/* TRACKING TIMELINE */}
        <div className="flex" style={{ marginBottom: 20, overflowX: 'auto' }}>
          {order.history.map((h, i) => (
            <div key={h.id} className="flex items-center">
              <div style={{ textAlign: 'center', minWidth: 100 }}>
                <div style={{
                  width: 12, height: 12, borderRadius: '50%', margin: '0 auto 6px',
                  background: h.status === 'CANCELLED' ? 'var(--color-primary)' : 'var(--color-green)',
                }} />
                <div style={{ fontSize: 12, fontWeight: 600 }}>{STATUS_LABEL[h.status]}</div>
                <div style={{ fontSize: 11, color: 'var(--color-ink-soft)' }}>{new Date(h.created_at).toLocaleString('vi-VN')}</div>
              </div>
              {i < order.history.length - 1 && <div style={{ width: 40, height: 2, background: 'var(--color-line)' }} />}
            </div>
          ))}
        </div>

        <div className="flex justify-between" style={{ marginBottom: 6 }}><span>Người nhận</span><strong>{order.receiver_name} — {order.receiver_phone}</strong></div>
        <div className="flex justify-between" style={{ marginBottom: 6 }}><span>Địa chỉ</span><strong style={{ textAlign: 'right', maxWidth: 280 }}>{order.delivery_address}</strong></div>
        <div className="flex justify-between" style={{ marginBottom: 6 }}><span>Thanh toán</span><strong>{order.payment_method} — {order.payment_status}</strong></div>
        {order.customer_note && <div className="flex justify-between" style={{ marginBottom: 6 }}><span>Ghi chú</span><span>{order.customer_note}</span></div>}

        <hr style={{ border: 'none', borderTop: '1px solid var(--color-line-soft)', margin: '12px 0' }} />
        {order.items.map((i) => (
          <div key={i.id} className="flex justify-between" style={{ fontSize: 14, marginBottom: 6 }}>
            <span>{i.product_name} ({i.variant_name}) x{i.quantity}</span><span>{formatMoney(i.subtotal)}</span>
          </div>
        ))}
        <hr style={{ border: 'none', borderTop: '1px solid var(--color-line-soft)', margin: '12px 0' }} />
        <div className="flex justify-between" style={{ marginBottom: 4 }}><span>Tạm tính</span><span>{formatMoney(order.subtotal)}</span></div>
        <div className="flex justify-between" style={{ marginBottom: 4 }}><span>Phí giao hàng</span><span>{formatMoney(order.delivery_fee)}</span></div>
        {Number(order.discount_amount) > 0 && <div className="flex justify-between" style={{ marginBottom: 4, color: 'var(--color-green)' }}><span>Giảm giá</span><span>-{formatMoney(order.discount_amount)}</span></div>}
        <div className="flex justify-between" style={{ fontSize: '1.15rem', fontFamily: 'var(--font-display)', marginTop: 8 }}>
          <span>Tổng cộng</span><strong style={{ color: 'var(--color-primary)' }}>{formatMoney(order.total_amount)}</strong>
        </div>
      </div>
    </div>
  );
}
