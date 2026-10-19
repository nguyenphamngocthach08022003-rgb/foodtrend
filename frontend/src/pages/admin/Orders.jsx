import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { adminGetOrders } from '../../api/admin.api';
import { formatMoney } from '../../components/common/Money';
import Pagination from '../../components/common/Pagination';

const STATUS_LABEL = {
  PENDING: 'Chờ xử lý', CONFIRMED: 'Đã xác nhận', PREPARING: 'Đang chuẩn bị',
  READY: 'Sẵn sàng giao', COMPLETED: 'Hoàn thành', CANCELLED: 'Đã huỷ',
};

export default function AdminOrders() {
  const [params, setParams] = useSearchParams();
  const [result, setResult] = useState({ items: [], pagination: {} });
  const status = params.get('status') || '';
  const page = Number(params.get('page') || 1);

  useEffect(() => {
    adminGetOrders({ status: status || undefined, page, limit: 15 }).then(({ data }) => setResult({ items: data.data, pagination: data.pagination }));
  }, [status, page]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    next.delete('page');
    setParams(next);
  };

  return (
    <div>
      <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
        <h2>Đơn hàng</h2>
        <select value={status} onChange={(e) => updateParam('status', e.target.value)} style={{ width: 200 }}>
          <option value="">Tất cả trạng thái</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--color-line-soft)', textAlign: 'left' }}>
              <th style={{ padding: 12 }}>Mã đơn</th>
              <th style={{ padding: 12 }}>Khách hàng</th>
              <th style={{ padding: 12 }}>Tổng tiền</th>
              <th style={{ padding: 12 }}>Thanh toán</th>
              <th style={{ padding: 12 }}>Trạng thái</th>
              <th style={{ padding: 12 }}>Ngày đặt</th>
              <th style={{ padding: 12 }}></th>
            </tr>
          </thead>
          <tbody>
            {result.items.map((o) => (
              <tr key={o.id} style={{ borderTop: '1px solid var(--color-line-soft)' }}>
                <td style={{ padding: 12 }}>{o.order_code}</td>
                <td style={{ padding: 12 }}>{o.customer_name}</td>
                <td style={{ padding: 12 }}>{formatMoney(o.total_amount)}</td>
                <td style={{ padding: 12 }}>{o.payment_method} / {o.payment_status}</td>
                <td style={{ padding: 12 }}><span className={`status-pill status-${o.status}`}>{STATUS_LABEL[o.status]}</span></td>
                <td style={{ padding: 12, fontSize: 13 }}>{new Date(o.created_at).toLocaleDateString('vi-VN')}</td>
                <td style={{ padding: 12 }}><Link to={`/admin/don-hang/${o.id}`} className="btn btn-outline btn-sm">Chi tiết</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={result.pagination.page || 1} totalPages={result.pagination.totalPages || 1} onChange={(p) => updateParam('page', p)} />
    </div>
  );
}
