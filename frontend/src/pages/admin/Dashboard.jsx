import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardSummary } from '../../api/admin.api';
import { formatMoney } from '../../components/common/Money';

const STATUS_LABEL = {
  PENDING: 'Chờ xử lý', CONFIRMED: 'Đã xác nhận', PREPARING: 'Đang chuẩn bị',
  READY: 'Sẵn sàng giao', COMPLETED: 'Hoàn thành', CANCELLED: 'Đã huỷ',
};

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => { getDashboardSummary().then(({ data }) => setData(data.data)); }, []);

  if (!data) return <p>Đang tải...</p>;

  const statusMap = Object.fromEntries(data.orders_by_status.map((s) => [s.status, Number(s.count)]));

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>Tổng quan</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 32 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 13, color: 'var(--color-ink-soft)' }}>Doanh thu (đã thanh toán)</div>
          <strong style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--color-primary)' }}>{formatMoney(data.total_revenue)}</strong>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 13, color: 'var(--color-ink-soft)' }}>Khách hàng</div>
          <strong style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem' }}>{data.customer_count}</strong>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 13, color: 'var(--color-ink-soft)' }}>Đơn chờ xử lý</div>
          <strong style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem' }}>{statusMap.PENDING || 0}</strong>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 13, color: 'var(--color-ink-soft)' }}>Đơn hoàn thành</div>
          <strong style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem' }}>{statusMap.COMPLETED || 0}</strong>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card" style={{ padding: 20 }}>
          <h4 style={{ marginBottom: 14 }}>Top sản phẩm bán chạy</h4>
          {data.top_products.map((p, i) => (
            <div key={p.slug} className="flex justify-between" style={{ marginBottom: 8, fontSize: 14 }}>
              <span>{i + 1}. {p.name}</span><strong>{p.total_sold} đã bán</strong>
            </div>
          ))}
        </div>
        <div className="card" style={{ padding: 20 }}>
          <h4 style={{ marginBottom: 14 }}>Đơn hàng gần đây</h4>
          {data.recent_orders.slice(0, 6).map((o) => (
            <div key={o.id} className="flex justify-between" style={{ marginBottom: 8, fontSize: 14 }}>
              <Link to={`/admin/don-hang/${o.id}`}>{o.order_code} — {o.customer_name}</Link>
              <span className={`status-pill status-${o.status}`} style={{ fontSize: 11 }}>{STATUS_LABEL[o.status]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
