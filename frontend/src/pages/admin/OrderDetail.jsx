import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminGetOrderById, adminUpdateOrderStatus } from '../../api/admin.api';
import { formatMoney } from '../../components/common/Money';

const FLOW = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED'];
const STATUS_LABEL = {
  PENDING: 'Chờ xử lý', CONFIRMED: 'Đã xác nhận', PREPARING: 'Đang chuẩn bị',
  READY: 'Sẵn sàng giao', COMPLETED: 'Hoàn thành', CANCELLED: 'Đã huỷ',
};

export default function AdminOrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [note, setNote] = useState('');

  const load = () => adminGetOrderById(id).then(({ data }) => setOrder(data.data));
  useEffect(() => { load(); }, [id]);

  if (!order) return <p>Đang tải...</p>;

  const currentIdx = FLOW.indexOf(order.status);
  const nextStatus = order.status === 'CANCELLED' ? null : FLOW[currentIdx + 1];

  const handleUpdate = async (status) => {
    await adminUpdateOrderStatus(id, { status, note: note || undefined });
    setNote('');
    load();
  };

  return (
    <div style={{ maxWidth: 720 }}>
      <Link to="/admin/don-hang" style={{ fontSize: 14 }}>← Danh sách đơn hàng</Link>
      <div className="card" style={{ padding: 20, marginTop: 14 }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
          <h2>{order.order_code}</h2>
          <span className={`status-pill status-${order.status}`}>{STATUS_LABEL[order.status]}</span>
        </div>

        <div className="flex justify-between" style={{ marginBottom: 6 }}><span>Người nhận</span><strong>{order.receiver_name} — {order.receiver_phone}</strong></div>
        <div className="flex justify-between" style={{ marginBottom: 6 }}><span>Địa chỉ</span><strong style={{ textAlign: 'right', maxWidth: 320 }}>{order.delivery_address}</strong></div>
        <div className="flex justify-between" style={{ marginBottom: 6 }}><span>Thanh toán</span><strong>{order.payment_method} — {order.payment_status}</strong></div>
        {order.customer_note && <div className="flex justify-between" style={{ marginBottom: 6 }}><span>Ghi chú khách</span><span>{order.customer_note}</span></div>}

        <hr style={{ border: 'none', borderTop: '1px solid var(--color-line-soft)', margin: '14px 0' }} />
        {order.items.map((i) => (
          <div key={i.id} className="flex justify-between" style={{ fontSize: 14, marginBottom: 6 }}>
            <span>{i.product_name} ({i.variant_name}) x{i.quantity}</span><span>{formatMoney(i.subtotal)}</span>
          </div>
        ))}
        <hr style={{ border: 'none', borderTop: '1px solid var(--color-line-soft)', margin: '14px 0' }} />
        <div className="flex justify-between" style={{ fontSize: '1.15rem', fontFamily: 'var(--font-display)' }}>
          <span>Tổng cộng</span><strong style={{ color: 'var(--color-primary)' }}>{formatMoney(order.total_amount)}</strong>
        </div>
      </div>

      {order.status !== 'CANCELLED' && order.status !== 'COMPLETED' && (
        <div className="card" style={{ padding: 20, marginTop: 20 }}>
          <h4 style={{ marginBottom: 12 }}>Cập nhật trạng thái</h4>
          <textarea placeholder="Ghi chú (tuỳ chọn)" rows={2} value={note} onChange={(e) => setNote(e.target.value)} style={{ marginBottom: 12 }} />
          <div className="flex gap-8">
            {nextStatus && <button className="btn btn-primary" onClick={() => handleUpdate(nextStatus)}>Chuyển sang: {STATUS_LABEL[nextStatus]}</button>}
            <button className="btn btn-outline" style={{ color: 'var(--color-primary)', borderColor: 'var(--color-primary)' }} onClick={() => { if (window.confirm('Huỷ đơn hàng này?')) handleUpdate('CANCELLED'); }}>
              Huỷ đơn hàng
            </button>
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 20, marginTop: 20 }}>
        <h4 style={{ marginBottom: 12 }}>Lịch sử trạng thái</h4>
        {order.history.map((h) => (
          <div key={h.id} className="flex justify-between" style={{ fontSize: 13.5, marginBottom: 6 }}>
            <span>{STATUS_LABEL[h.status]} {h.note ? `— ${h.note}` : ''}</span>
            <span style={{ color: 'var(--color-ink-soft)' }}>{new Date(h.created_at).toLocaleString('vi-VN')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
