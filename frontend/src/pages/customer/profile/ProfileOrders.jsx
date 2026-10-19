import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyOrders, cancelOrder } from '../../../api/orders.api';
import { formatMoney } from '../../../components/common/Money';

const STATUS_LABEL = {
  PENDING: 'Chờ xử lý', CONFIRMED: 'Đã xác nhận', PREPARING: 'Đang chuẩn bị',
  READY: 'Sẵn sàng giao', COMPLETED: 'Hoàn thành', CANCELLED: 'Đã huỷ',
};

export default function ProfileOrders() {
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState('');

  const load = () => getMyOrders(status ? { status } : {}).then(({ data }) => setOrders(data.data));

  useEffect(() => { load(); }, [status]);

  const handleCancel = async (id) => {
    if (!window.confirm('Bạn chắc chắn muốn huỷ đơn hàng này?')) return;
    await cancelOrder(id);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
        <h3>Đơn hàng của tôi</h3>
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: 180 }}>
          <option value="">Tất cả trạng thái</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {orders.length === 0 ? (
        <p style={{ color: 'var(--color-ink-soft)' }}>Bạn chưa có đơn hàng nào.</p>
      ) : (
        <div className="flex-col gap-12">
          {orders.map((o) => (
            <div key={o.id} className="card" style={{ padding: 16 }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
                <strong>{o.order_code}</strong>
                <span className={`status-pill status-${o.status}`}>{STATUS_LABEL[o.status]}</span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ fontSize: 13, color: 'var(--color-ink-soft)' }}>
                  {new Date(o.created_at).toLocaleString('vi-VN')}
                </span>
                <strong style={{ color: 'var(--color-primary)' }}>{formatMoney(o.total_amount)}</strong>
              </div>
              <div className="flex gap-8" style={{ marginTop: 10 }}>
                <Link to={`/tai-khoan/don-hang/${o.id}`} className="btn btn-outline btn-sm">Xem chi tiết</Link>
                {o.status === 'PENDING' && (
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-primary)' }} onClick={() => handleCancel(o.id)}>Huỷ đơn</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
