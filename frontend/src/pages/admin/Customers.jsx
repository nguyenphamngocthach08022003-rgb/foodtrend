import { useEffect, useState } from 'react';
import { adminGetCustomers, adminToggleCustomerActive } from '../../api/admin.api';
import { formatMoney } from '../../components/common/Money';
import Pagination from '../../components/common/Pagination';

export default function AdminCustomers() {
  const [result, setResult] = useState({ items: [], pagination: {} });
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  const load = () => adminGetCustomers({ q, page, limit: 15 }).then(({ data }) => setResult({ items: data.data, pagination: data.pagination }));
  useEffect(() => { load(); }, [page]);

  const handleSearch = (e) => { e.preventDefault(); setPage(1); load(); };

  const handleToggle = async (c) => {
    await adminToggleCustomerActive(c.id, !c.is_active);
    load();
  };

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>Khách hàng</h2>
      <form onSubmit={handleSearch} className="flex gap-8" style={{ marginBottom: 16, maxWidth: 360 }}>
        <input placeholder="Tìm theo tên, SĐT, email..." value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn btn-outline">Tìm</button>
      </form>
      <div className="card" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--color-line-soft)', textAlign: 'left' }}>
              <th style={{ padding: 12 }}>Họ tên</th>
              <th style={{ padding: 12 }}>SĐT</th>
              <th style={{ padding: 12 }}>Số đơn</th>
              <th style={{ padding: 12 }}>Đã chi tiêu</th>
              <th style={{ padding: 12 }}>Trạng thái</th>
              <th style={{ padding: 12 }}></th>
            </tr>
          </thead>
          <tbody>
            {result.items.map((c) => (
              <tr key={c.id} style={{ borderTop: '1px solid var(--color-line-soft)' }}>
                <td style={{ padding: 12 }}>{c.full_name}</td>
                <td style={{ padding: 12 }}>{c.phone}</td>
                <td style={{ padding: 12 }}>{c.order_count}</td>
                <td style={{ padding: 12 }}>{formatMoney(c.total_spent)}</td>
                <td style={{ padding: 12 }}>
                  <span className="badge" style={{ background: c.is_active ? 'var(--color-green)' : 'var(--color-primary)' }}>
                    {c.is_active ? 'Hoạt động' : 'Đã khoá'}
                  </span>
                </td>
                <td style={{ padding: 12 }}>
                  <button className="btn btn-outline btn-sm" onClick={() => handleToggle(c)}>
                    {c.is_active ? 'Khoá' : 'Mở khoá'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={result.pagination.page || 1} totalPages={result.pagination.totalPages || 1} onChange={setPage} />
    </div>
  );
}
